/*
 * Copyright 2025 coze-dev Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package user

import (
	"context"
	"fmt"
	"net/mail"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/coze-dev/coze-studio/backend/api/model/app/developer_api"
	"github.com/coze-dev/coze-studio/backend/api/model/passport"
	"github.com/coze-dev/coze-studio/backend/api/model/playground"
	"github.com/coze-dev/coze-studio/backend/application/base/ctxutil"
	"github.com/coze-dev/coze-studio/backend/bizpkg/config"
	"github.com/coze-dev/coze-studio/backend/domain/user/entity"
	user "github.com/coze-dev/coze-studio/backend/domain/user/service"
	"github.com/coze-dev/coze-studio/backend/infra/storage"
	"github.com/coze-dev/coze-studio/backend/pkg/errorx"
	"github.com/coze-dev/coze-studio/backend/pkg/kvstore"
	"github.com/coze-dev/coze-studio/backend/pkg/lang/ptr"
	langSlices "github.com/coze-dev/coze-studio/backend/pkg/lang/slices"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
	"github.com/coze-dev/coze-studio/backend/types/errno"
)

var UserApplicationSVC = &UserApplicationService{}

type UserApplicationService struct {
	oss            storage.Storage
	DomainSVC      user.User
	inviteLinkKV   *kvstore.KVStore[spaceInviteLinkState]
	inviteRecordKV *kvstore.KVStore[spaceInviteRecordState]
	spaceConfigKV  *kvstore.KVStore[spaceConfigState]
}

// Add a simple email verification function
func isValidEmail(email string) bool {
	// If the email string is not in the correct format, it will return an error.
	_, err := mail.ParseAddress(email)
	return err == nil
}

func (u *UserApplicationService) PassportWebEmailRegisterV2(ctx context.Context, locale string, req *passport.PassportWebEmailRegisterV2PostRequest) (
	resp *passport.PassportWebEmailRegisterV2PostResponse, sessionKey string, err error,
) {
	// Verify that the email format is legitimate
	if !isValidEmail(req.GetEmail()) {
		return nil, "", errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "Invalid email"))
	}

	baseConf, err := config.Base().GetBaseConfig(ctx)
	if err != nil {
		return nil, "", err
	}

	// Allow Register Checker
	if !u.allowRegisterChecker(req.GetEmail(), baseConf) {
		return nil, "", errorx.New(errno.ErrNotAllowedRegisterCode)
	}

	_, err = u.DomainSVC.Create(ctx, &user.CreateUserRequest{
		Email:    req.GetEmail(),
		Password: req.GetPassword(),

		Locale: locale,
	})
	if err != nil {
		return nil, "", err
	}

	userInfo, err := u.DomainSVC.Login(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, "", err
	}

	return &passport.PassportWebEmailRegisterV2PostResponse{
		Data: userDo2PassportTo(userInfo),
		Code: 0,
	}, userInfo.SessionKey, nil
}

func (u *UserApplicationService) allowRegisterChecker(email string, baseConf *config.BasicConfiguration) bool {
	if !baseConf.DisableUserRegistration {
		return true
	}

	allowedEmails := baseConf.AllowRegistrationEmail
	if allowedEmails == "" {
		return false
	}

	return slices.Contains(strings.Split(allowedEmails, ","), strings.ToLower(email))
}

// PassportWebLogoutGet handle user logout requests
func (u *UserApplicationService) PassportWebLogoutGet(ctx context.Context, req *passport.PassportWebLogoutGetRequest) (
	resp *passport.PassportWebLogoutGetResponse, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)

	err = u.DomainSVC.Logout(ctx, uid)
	if err != nil {
		return nil, err
	}

	return &passport.PassportWebLogoutGetResponse{
		Code: 0,
	}, nil
}

// PassportWebEmailLoginPost handle user email login requests
func (u *UserApplicationService) PassportWebEmailLoginPost(ctx context.Context, req *passport.PassportWebEmailLoginPostRequest) (
	resp *passport.PassportWebEmailLoginPostResponse, sessionKey string, err error,
) {
	userInfo, err := u.DomainSVC.Login(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, "", err
	}

	return &passport.PassportWebEmailLoginPostResponse{
		Data: userDo2PassportTo(userInfo),
		Code: 0,
	}, userInfo.SessionKey, nil
}

func (u *UserApplicationService) PassportWebEmailPasswordResetGet(ctx context.Context, req *passport.PassportWebEmailPasswordResetGetRequest) (
	resp *passport.PassportWebEmailPasswordResetGetResponse, err error,
) {
	session := ctxutil.GetUserSessionFromCtx(ctx)
	if session == nil {
		return nil, errorx.New(errno.ErrUserAuthenticationFailed, errorx.KV("reason", "session data is nil"))
	}
	if !strings.EqualFold(session.UserEmail, req.GetEmail()) {
		return nil, errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "email mismatch"))
	}

	err = u.DomainSVC.ResetPassword(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, err
	}

	return &passport.PassportWebEmailPasswordResetGetResponse{
		Code: 0,
	}, nil
}

func (u *UserApplicationService) PassportAccountInfoV2(ctx context.Context, req *passport.PassportAccountInfoV2Request) (
	resp *passport.PassportAccountInfoV2Response, err error,
) {
	userID := ctxutil.MustGetUIDFromCtx(ctx)

	userInfo, err := u.DomainSVC.GetUserInfo(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &passport.PassportAccountInfoV2Response{
		Data: userDo2PassportTo(userInfo),
		Code: 0,
	}, nil
}

// UserUpdateAvatar Update user avatar
func (u *UserApplicationService) UserUpdateAvatar(ctx context.Context, mimeType string, req *passport.UserUpdateAvatarRequest) (
	resp *passport.UserUpdateAvatarResponse, err error,
) {
	// Get file suffix by MIME type
	var ext string
	switch mimeType {
	case "image/jpeg", "image/jpg":
		ext = "jpg"
	case "image/png":
		ext = "png"
	case "image/gif":
		ext = "gif"
	case "image/webp":
		ext = "webp"
	default:
		return nil, errorx.WrapByCode(err, errno.ErrUserInvalidParamCode,
			errorx.KV("msg", "unsupported image type"))
	}

	uid := ctxutil.MustGetUIDFromCtx(ctx)

	url, err := u.DomainSVC.UpdateAvatar(ctx, uid, ext, req.GetAvatar())
	if err != nil {
		return nil, err
	}

	return &passport.UserUpdateAvatarResponse{
		Data: &passport.UserUpdateAvatarResponseData{
			WebURI: url,
		},
		Code: 0,
	}, nil
}

// UserUpdateProfile Update user profile
func (u *UserApplicationService) UserUpdateProfile(ctx context.Context, req *passport.UserUpdateProfileRequest) (
	resp *passport.UserUpdateProfileResponse, err error,
) {
	userID := ctxutil.MustGetUIDFromCtx(ctx)

	err = u.DomainSVC.UpdateProfile(ctx, &user.UpdateProfileRequest{
		UserID:      userID,
		Name:        req.Name,
		UniqueName:  req.UserUniqueName,
		Description: req.Description,
		Locale:      req.Locale,
	})
	if err != nil {
		return nil, err
	}

	return &passport.UserUpdateProfileResponse{
		Code: 0,
	}, nil
}

func (u *UserApplicationService) GetSpaceListV2(ctx context.Context, req *playground.GetSpaceListV2Request) (
	resp *playground.GetSpaceListV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)

	spaces, err := u.DomainSVC.GetUserSpaceList(ctx, uid)
	if err != nil {
		return nil, err
	}

	botSpaces := langSlices.Transform(spaces, func(space *entity.Space) *playground.BotSpaceV2 {
		return &playground.BotSpaceV2{
			ID:            space.ID,
			Name:          space.Name,
			Description:   space.Description,
			SpaceType:     playground.SpaceType(space.SpaceType),
			IconURL:       space.IconURL,
			RoleType:      space.RoleType,
			SpaceRoleType: playground.SpaceRoleType(space.RoleType),
		}
	})

	return &playground.GetSpaceListV2Response{
		Data: &playground.SpaceInfo{
			BotSpaceList:          botSpaces,
			HasPersonalSpace:      true,
			TeamSpaceNum:          0,
			RecentlyUsedSpaceList: botSpaces,
			Total:                 ptr.Of(int32(len(botSpaces))),
			HasMore:               ptr.Of(false),
		},
		Code: 0,
	}, nil
}

func (u *UserApplicationService) SaveSpaceV2(ctx context.Context, req *playground.SaveSpaceV2Payload) (
	resp *playground.SaveSpaceV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	var spaceID int64

	trimmedSpaceID := strings.TrimSpace(req.SpaceID)
	if trimmedSpaceID == "" {
		// Create space when no space_id is provided.
		createResp, createErr := u.DomainSVC.CreateSpace(ctx, &user.CreateSpaceRequest{
			Name:        strings.TrimSpace(req.Name),
			Description: strings.TrimSpace(req.Description),
			IconURI:     strings.TrimSpace(req.IconURI),
			SpaceType:   entity.SpaceType(req.SpaceType),
			OwnerID:     uid,
			CreatorID:   uid,
		})
		if createErr != nil {
			return nil, createErr
		}
		spaceID = createResp.SpaceID
	} else {
		spaceID, err = parseRequiredInt64(trimmedSpaceID, "space_id")
		if err != nil {
			return nil, err
		}

		var namePtr *string
		if trimmedName := strings.TrimSpace(req.Name); trimmedName != "" {
			namePtr = ptr.Of(trimmedName)
		}

		descriptionValue := strings.TrimSpace(req.Description)
		descriptionPtr := ptr.Of(descriptionValue)

		var iconURIPtr *string
		trimmedIconURI := strings.TrimSpace(req.IconURI)
		if trimmedIconURI != "" &&
			!strings.HasPrefix(trimmedIconURI, "http://") &&
			!strings.HasPrefix(trimmedIconURI, "https://") {
			iconURIPtr = ptr.Of(trimmedIconURI)
		}

		if err = u.DomainSVC.UpdateSpace(ctx, &user.UpdateSpaceRequest{
			SpaceID:     spaceID,
			OperatorID:  uid,
			Name:        namePtr,
			Description: descriptionPtr,
			IconURI:     iconURIPtr,
		}); err != nil {
			return nil, err
		}
	}

	if req.SpaceConfig != nil {
		configState, configErr := u.getSpaceConfigState(ctx, spaceID)
		if configErr != nil {
			return nil, configErr
		}

		if req.SpaceConfig.IsSupportExternalUsersJoinSpace != nil {
			configState.IsSupportExternalUsersJoinSpace = *req.SpaceConfig.IsSupportExternalUsersJoinSpace
		}
		if req.SpaceConfig.IsAllMemberCanPublish != nil {
			configState.IsAllMemberCanPublish = *req.SpaceConfig.IsAllMemberCanPublish
		}
		if req.SpaceConfig.ForbidMemberUpsertFolder != nil {
			configState.ForbidMemberUpsertFolder = *req.SpaceConfig.ForbidMemberUpsertFolder
		}

		if saveErr := u.saveSpaceConfigState(ctx, spaceID, configState); saveErr != nil {
			return nil, saveErr
		}
	}

	return &playground.SaveSpaceV2Response{
		Data: &playground.SaveSpaceRet{
			ID:           ptr.Of(spaceID),
			CheckNotPass: ptr.Of(false),
		},
		Code: 0,
	}, nil
}

func (u *UserApplicationService) MGetUserBasicInfo(ctx context.Context, req *playground.MGetUserBasicInfoRequest) (
	resp *playground.MGetUserBasicInfoResponse, err error,
) {
	userIDs, err := langSlices.TransformWithErrorCheck(req.GetUserIds(), func(s string) (int64, error) {
		return strconv.ParseInt(s, 10, 64)
	})
	if err != nil {
		return nil, errorx.WrapByCode(err, errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid user id"))
	}

	userInfos, err := u.DomainSVC.MGetUserProfiles(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	return &playground.MGetUserBasicInfoResponse{
		UserBasicInfoMap: langSlices.ToMap(userInfos, func(userInfo *entity.User) (string, *playground.UserBasicInfo) {
			return strconv.FormatInt(userInfo.UserID, 10), userDo2PlaygroundTo(userInfo)
		}),
		Code: 0,
	}, nil
}

func (u *UserApplicationService) SpaceMemberDetailV2(ctx context.Context, req *playground.SpaceMemberDetailV2Request) (
	resp *playground.SpaceMemberDetailV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseRequiredInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}

	spaceMembers, err := u.DomainSVC.GetSpaceMemberDetail(ctx, &user.SpaceMemberDetailRequest{
		SpaceID:    spaceID,
		OperatorID: uid,
	})
	if err != nil {
		return nil, err
	}

	spaceInfoList, err := u.DomainSVC.GetUserSpaceBySpaceID(ctx, []int64{spaceID})
	if err != nil {
		return nil, err
	}
	spaceInfo := spaceMembers.Space
	if len(spaceInfoList) > 0 && spaceInfoList[0] != nil {
		spaceInfo = spaceInfoList[0]
	}
	if spaceInfo == nil {
		spaceInfo = &entity.Space{
			ID: spaceID,
		}
	}

	memberIDs := langSlices.Transform(spaceMembers.Members, func(item *user.SpaceMember) int64 {
		return item.UserID
	})
	userProfiles, err := u.DomainSVC.MGetUserProfiles(ctx, memberIDs)
	if err != nil {
		return nil, err
	}
	userProfileMap := langSlices.ToMap(userProfiles, func(item *entity.User) (int64, *entity.User) {
		return item.UserID, item
	})

	searchWord := strings.ToLower(strings.TrimSpace(ptr.From(req.SearchWord)))
	var roleFilter *int32
	if req.SpaceRoleType != nil && *req.SpaceRoleType != playground.SpaceRoleType_Default {
		targetRole := int32(*req.SpaceRoleType)
		roleFilter = &targetRole
	}

	memberList := make([]*playground.MemberInfo, 0, len(spaceMembers.Members))
	for _, member := range spaceMembers.Members {
		profile := userProfileMap[member.UserID]
		name := ""
		userName := ""
		iconURL := ""
		if profile != nil {
			name = profile.Name
			userName = profile.UniqueName
			iconURL = profile.IconURL
		}

		if roleFilter != nil && member.RoleType != *roleFilter {
			continue
		}

		if searchWord != "" {
			searchContent := strings.ToLower(strings.Join([]string{
				name,
				userName,
			}, " "))
			if !strings.Contains(searchContent, searchWord) {
				continue
			}
		}

		joinDate := formatTimestampDate(member.CreatedAt)
		memberList = append(memberList, &playground.MemberInfo{
			UserID:        strconv.FormatInt(member.UserID, 10),
			Name:          name,
			IconURL:       iconURL,
			SpaceRoleType: playground.SpaceRoleType(member.RoleType),
			IsJoin:        ptr.Of(true),
			JoinDate:      ptr.Of(joinDate),
			UserName:      ptr.Of(userName),
		})
	}

	page := int32(1)
	size := int32(50)
	if req.Page != nil && *req.Page > 0 {
		page = *req.Page
	}
	if req.Size != nil && *req.Size > 0 {
		size = *req.Size
	}

	total := int32(len(memberList))
	start := (page - 1) * size
	end := start + size
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}
	memberList = memberList[start:end]

	spaceRoleType := playground.SpaceRoleType(spaceMembers.OperatorRole)
	spaceIDStr := strconv.FormatInt(spaceID, 10)
	canEditSettings := spaceMembers.OperatorRole == user.SpaceRoleOwner || spaceMembers.OperatorRole == user.SpaceRoleAdmin
	spaceConfig, err := u.getSpaceConfigState(ctx, spaceID)
	if err != nil {
		return nil, err
	}

	return &playground.SpaceMemberDetailV2Response{
		Code: 0,
		Msg:  "success",
		Data: &playground.SpaceMemberDetailV2Data{
			SpaceID:        ptr.Of(spaceIDStr),
			Name:           ptr.Of(spaceInfo.Name),
			Description:    ptr.Of(spaceInfo.Description),
			IconURL:        ptr.Of(spaceInfo.IconURL),
			SpaceRoleType:  &spaceRoleType,
			Total:          ptr.Of(total),
			MemberInfoList: memberList,
			AdminTotalNum:  ptr.Of(int32(spaceMembers.AdminTotal)),
			MemberTotalNum: ptr.Of(int32(spaceMembers.MemberTotal)),
			MaxAdminNum:    ptr.Of(int32(10)),
			MaxMemberNum:   ptr.Of(int32(200)),
			SpaceConfigDetails: &playground.SpaceConfigDetails{
				CanShowJoinTeamPermissionSettings: ptr.Of(true),
				CanEditJoinTeamPermissionSettings: ptr.Of(canEditSettings),
				IsSupportExternalUsersJoinSpace:   ptr.Of(spaceConfig.IsSupportExternalUsersJoinSpace),
				IsSupportAllMemberPublish:         ptr.Of(spaceConfig.IsAllMemberCanPublish),
				ForbidMemberUpsertFolder:          ptr.Of(spaceConfig.ForbidMemberUpsertFolder),
			},
			CanPublishInSpace: ptr.Of(canEditSettings),
		},
	}, nil
}

func (u *UserApplicationService) SearchMemberV2(ctx context.Context, req *playground.SearchMemberV2Request) (
	resp *playground.SearchMemberV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseRequiredInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}

	spaceMembers, err := u.DomainSVC.GetSpaceMemberDetail(ctx, &user.SpaceMemberDetailRequest{
		SpaceID:    spaceID,
		OperatorID: uid,
	})
	if err != nil {
		return nil, err
	}

	memberRoleMap := make(map[int64]int32, len(spaceMembers.Members))
	for _, member := range spaceMembers.Members {
		memberRoleMap[member.UserID] = member.RoleType
	}

	confirmingInviteMap := make(map[int64]bool)
	recordState, err := u.getInviteRecordState(ctx, spaceID)
	if err == nil {
		latestRecords := make(map[int64]*spaceInviteRecordItem, len(recordState.Records))
		for _, record := range recordState.Records {
			existing := latestRecords[record.InviteUserID]
			if existing == nil || record.InviteDate >= existing.InviteDate {
				latestRecords[record.InviteUserID] = record
			}
		}

		now := time.Now().Unix()
		for inviteUserID, record := range latestRecords {
			status := record.Status
			if status != playground.SpaceInviteStatusRevoked && record.ExpiredDate > 0 && record.ExpiredDate <= now {
				status = playground.SpaceInviteStatusExpired
			}
			confirmingInviteMap[inviteUserID] = status == playground.SpaceInviteStatusConfirming
		}
	} else {
		logs.CtxWarnf(ctx, "load invite record failed, spaceID=%d err=%v", spaceID, err)
	}

	page := int32(1)
	size := int32(50)
	if req.Page != nil && *req.Page > 0 {
		page = *req.Page
	}
	if req.Size != nil && *req.Size > 0 {
		size = *req.Size
	}
	if size > 100 {
		size = 100
	}

	searchKeywords := normalizeSearchKeywords(req.SearchList)
	searchPage := int(page)
	searchSize := int(size)
	if len(searchKeywords) > 0 {
		// keep larger page size for keyword search to reduce missed candidates in add-member modal
		searchPage = 1
		if searchSize < 100 {
			searchSize = 100
		}
	}

	searchResp, err := u.DomainSVC.SearchUsers(ctx, &user.SearchUsersRequest{
		Keywords: searchKeywords,
		Page:     searchPage,
		Size:     searchSize,
	})
	if err != nil {
		return nil, err
	}

	memberInfoList := make([]*playground.MemberInfo, 0, len(searchResp.Users))
	for _, userInfo := range searchResp.Users {
		if userInfo == nil || userInfo.UserID <= 0 {
			continue
		}

		roleType, isJoin := memberRoleMap[userInfo.UserID]
		spaceRoleType := playground.SpaceRoleType_Default
		if isJoin {
			spaceRoleType = playground.SpaceRoleType(roleType)
		}

		isConfirming := !isJoin && confirmingInviteMap[userInfo.UserID]
		memberInfoList = append(memberInfoList, &playground.MemberInfo{
			UserID:        strconv.FormatInt(userInfo.UserID, 10),
			Name:          userInfo.Name,
			IconURL:       userInfo.IconURL,
			SpaceRoleType: spaceRoleType,
			IsJoin:        ptr.Of(isJoin),
			UserName:      ptr.Of(userInfo.UniqueName),
			IsConfirming:  ptr.Of(isConfirming),
		})
	}

	failedSearchList := make([]string, 0)
	if len(searchKeywords) > 0 {
		for _, keyword := range searchKeywords {
			matched := false
			for _, userInfo := range searchResp.Users {
				if matchUserBySearchKeyword(userInfo, keyword) {
					matched = true
					break
				}
			}
			if !matched {
				failedSearchList = append(failedSearchList, keyword)
			}
		}
	}

	total := int32(searchResp.Total)
	return &playground.SearchMemberV2Response{
		Code:             0,
		Msg:              "success",
		MemberInfoList:   memberInfoList,
		FailedSearchList: failedSearchList,
		Total:            ptr.Of(total),
	}, nil
}

func (u *UserApplicationService) AddBotSpaceMemberV2(ctx context.Context, req *playground.AddSpaceMemberV2Request) (
	resp *playground.AddSpaceMemberV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseRequiredInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}

	memberToAdd := make([]user.AddSpaceMemberItem, 0, len(req.MemberInfoList))
	for _, member := range req.MemberInfoList {
		targetUserID, parseErr := strconv.ParseInt(member.UserID, 10, 64)
		if parseErr != nil {
			return nil, errorx.WrapByCode(parseErr, errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid member user_id"))
		}
		targetRole := int32(member.SpaceRoleType)
		memberToAdd = append(memberToAdd, user.AddSpaceMemberItem{
			UserID:   targetUserID,
			RoleType: targetRole,
		})
	}

	if err = u.DomainSVC.AddSpaceMembers(ctx, &user.AddSpaceMembersRequest{
		SpaceID:     spaceID,
		OperatorID:  uid,
		MemberToAdd: memberToAdd,
	}); err != nil {
		return nil, err
	}

	if len(memberToAdd) > 0 {
		if recordErr := u.recordInviteAsJoined(ctx, spaceID, uid, memberToAdd); recordErr != nil {
			logs.CtxWarnf(ctx, "record invite joined info failed, spaceID=%d, operator=%d, err=%v", spaceID, uid, recordErr)
		}
	}

	return &playground.AddSpaceMemberV2Response{
		Code: 0,
		Msg:  "success",
	}, nil
}

func (u *UserApplicationService) UpdateSpaceMemberV2(ctx context.Context, req *playground.UpdateSpaceMemberV2Request) (
	resp *playground.UpdateSpaceMemberV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseOptionalInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}
	targetUserID, err := parseOptionalInt64(req.UserID, "user_id")
	if err != nil {
		return nil, err
	}

	if req.SpaceRoleType == nil {
		return nil, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "space_role_type is required"))
	}

	if err = u.DomainSVC.UpdateSpaceMemberRole(ctx, &user.UpdateSpaceMemberRoleRequest{
		SpaceID:      spaceID,
		OperatorID:   uid,
		TargetUserID: targetUserID,
		TargetRole:   int32(*req.SpaceRoleType),
	}); err != nil {
		return nil, err
	}

	return &playground.UpdateSpaceMemberV2Response{
		Code: 0,
		Msg:  "success",
	}, nil
}

func (u *UserApplicationService) RemoveSpaceMemberV2(ctx context.Context, req *playground.RemoveSpaceMemberV2Request) (
	resp *playground.RemoveSpaceMemberV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseOptionalInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}
	targetUserID, err := parseOptionalInt64(req.RemoveUserID, "remove_user_id")
	if err != nil {
		return nil, err
	}

	if err = u.DomainSVC.RemoveSpaceMember(ctx, &user.RemoveSpaceMemberRequest{
		SpaceID:      spaceID,
		OperatorID:   uid,
		TargetUserID: targetUserID,
	}); err != nil {
		return nil, err
	}

	return &playground.RemoveSpaceMemberV2Response{
		Code: 0,
		Msg:  "success",
	}, nil
}

func (u *UserApplicationService) TransferSpaceV2(ctx context.Context, req *playground.TransferSpaceV2Request) (
	resp *playground.TransferSpaceV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseOptionalInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}
	transferUserID, err := parseOptionalInt64(req.TransferUserID, "transfer_user_id")
	if err != nil {
		return nil, err
	}

	if err = u.DomainSVC.TransferSpaceOwner(ctx, &user.TransferSpaceOwnerRequest{
		SpaceID:        spaceID,
		OperatorID:     uid,
		TransferUserID: transferUserID,
	}); err != nil {
		return nil, err
	}

	return &playground.TransferSpaceV2Response{
		Code: 0,
		Msg:  "success",
	}, nil
}

func (u *UserApplicationService) ExitSpaceV2(ctx context.Context, req *playground.ExitSpaceV2Request) (
	resp *playground.ExitSpaceV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseOptionalInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}

	var transferUserID *int64
	if req.TransferUserID != nil && strings.TrimSpace(*req.TransferUserID) != "" {
		target, parseErr := parseOptionalInt64(req.TransferUserID, "transfer_user_id")
		if parseErr != nil {
			return nil, parseErr
		}
		transferUserID = ptr.Of(target)
	}

	if err = u.DomainSVC.ExitSpace(ctx, &user.ExitSpaceRequest{
		SpaceID:        spaceID,
		OperatorID:     uid,
		TransferUserID: transferUserID,
	}); err != nil {
		return nil, err
	}

	return &playground.ExitSpaceV2Response{
		Code: 0,
		Msg:  "success",
	}, nil
}

func (u *UserApplicationService) InviteMemberLinkV2(ctx context.Context, req *playground.InviteMemberLinkV2Request) (
	resp *playground.InviteMemberLinkV2Response, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseRequiredInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}
	if _, err = u.DomainSVC.GetSpaceMemberDetail(ctx, &user.SpaceMemberDetailRequest{
		SpaceID:    spaceID,
		OperatorID: uid,
	}); err != nil {
		return nil, err
	}

	linkState, err := u.getInviteLinkState(ctx, spaceID)
	if err != nil {
		return nil, err
	}

	if req.Func != nil && *req.Func == playground.InviteFuncGetInfo {
		return buildInviteMemberLinkResponse(linkState), nil
	}

	now := time.Now().Unix()
	linkState.Enabled = req.TeamInviteLinkStatus
	if linkState.Key == "" {
		linkState.Key = fmt.Sprintf("space-%d-%d", spaceID, now)
	}
	if linkState.ExpireTime <= now {
		linkState.ExpireTime = now + int64(spaceInviteExpireDuration/time.Second)
	}

	if err = u.saveInviteLinkState(ctx, spaceID, linkState); err != nil {
		return nil, err
	}

	return buildInviteMemberLinkResponse(linkState), nil
}

func (u *UserApplicationService) GetSpaceInviteManageList(ctx context.Context, req *playground.GetSpaceInviteManageListRequest) (
	resp *playground.GetSpaceInviteManageListResponse, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseOptionalInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}
	spaceMembers, err := u.DomainSVC.GetSpaceMemberDetail(ctx, &user.SpaceMemberDetailRequest{
		SpaceID:    spaceID,
		OperatorID: uid,
	})
	if err != nil {
		return nil, err
	}

	recordState, err := u.getInviteRecordState(ctx, spaceID)
	if err != nil {
		return nil, err
	}

	roleMap := make(map[int64]int32, len(spaceMembers.Members))
	for _, member := range spaceMembers.Members {
		roleMap[member.UserID] = member.RoleType
	}

	idsMap := make(map[int64]bool)
	for _, item := range recordState.Records {
		idsMap[item.InviteUserID] = true
		idsMap[item.OperatorUserID] = true
	}
	userIDs := make([]int64, 0, len(idsMap))
	for id := range idsMap {
		userIDs = append(userIDs, id)
	}
	userProfiles, err := u.DomainSVC.MGetUserProfiles(ctx, userIDs)
	if err != nil {
		return nil, err
	}
	userProfileMap := langSlices.ToMap(userProfiles, func(item *entity.User) (int64, *entity.User) {
		return item.UserID, item
	})

	statusFilter := playground.SpaceInviteStatusAll
	if req.SpaceInviteStatus != nil {
		statusFilter = *req.SpaceInviteStatus
	}
	searchWord := strings.ToLower(strings.TrimSpace(ptr.From(req.SearchWord)))

	filtered := make([]*spaceInviteRecordItem, 0, len(recordState.Records))
	now := time.Now().Unix()
	for _, item := range recordState.Records {
		status := item.Status
		if status != playground.SpaceInviteStatusRevoked && item.ExpiredDate > 0 && item.ExpiredDate <= now {
			status = playground.SpaceInviteStatusExpired
		}
		if statusFilter != playground.SpaceInviteStatusAll && status != statusFilter {
			continue
		}
		inviteUser := userProfileMap[item.InviteUserID]
		if searchWord != "" {
			searchContent := ""
			if inviteUser != nil {
				searchContent = strings.ToLower(inviteUser.Name + " " + inviteUser.UniqueName)
			}
			if !strings.Contains(searchContent, searchWord) {
				continue
			}
		}

		copied := *item
		copied.Status = status
		filtered = append(filtered, &copied)
	}

	slices.SortFunc(filtered, func(a, b *spaceInviteRecordItem) int {
		if a.InviteDate == b.InviteDate {
			if a.InviteUserID == b.InviteUserID {
				return 0
			}
			if a.InviteUserID > b.InviteUserID {
				return -1
			}
			return 1
		}
		if a.InviteDate > b.InviteDate {
			return -1
		}
		return 1
	})

	page := int32(1)
	size := int32(20)
	if req.Page != nil && *req.Page > 0 {
		page = *req.Page
	}
	if req.Size != nil && *req.Size > 0 {
		size = *req.Size
	}
	total := int32(len(filtered))
	start := (page - 1) * size
	end := start + size
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}
	paged := filtered[start:end]

	resultList := make([]*playground.SpaceInviteManageInfo, 0, len(paged))
	for _, item := range paged {
		inviteUser := userProfileMap[item.InviteUserID]
		operatorUser := userProfileMap[item.OperatorUserID]

		inviteNick := ""
		inviteName := ""
		inviteIcon := ""
		if inviteUser != nil {
			inviteNick = inviteUser.Name
			inviteName = inviteUser.UniqueName
			inviteIcon = inviteUser.IconURL
		}

		operatorNick := ""
		operatorName := ""
		operatorIcon := ""
		if operatorUser != nil {
			operatorNick = operatorUser.Name
			operatorName = operatorUser.UniqueName
			operatorIcon = operatorUser.IconURL
		}

		operatorRole := playground.SpaceRoleType(roleMap[item.OperatorUserID])
		if operatorRole == playground.SpaceRoleType_Default {
			operatorRole = playground.SpaceRoleType_Member
		}

		resultList = append(resultList, &playground.SpaceInviteManageInfo{
			InviteUserID:        strconv.FormatInt(item.InviteUserID, 10),
			InviteNickName:      inviteNick,
			InviteUserName:      inviteName,
			InviteUserIconURL:   inviteIcon,
			InviteDate:          strconv.FormatInt(item.InviteDate, 10),
			SpaceInviteStatus:   item.Status,
			OperatorUserID:      strconv.FormatInt(item.OperatorUserID, 10),
			OperatorNickName:    operatorNick,
			OperatorUserName:    operatorName,
			OperatorUserIconURL: operatorIcon,
			OperatorRoleType:    operatorRole,
			ExpiredDate:         strconv.FormatInt(item.ExpiredDate, 10),
		})
	}

	hasMore := end < total
	return &playground.GetSpaceInviteManageListResponse{
		Code: 0,
		Msg:  "success",
		Data: &playground.SpaceInviteManageInfoData{
			SpaceInviteManageInfoList: resultList,
			Total:                     ptr.Of(total),
			HasMore:                   ptr.Of(hasMore),
		},
	}, nil
}

func (u *UserApplicationService) RevocateSpaceInvite(ctx context.Context, req *playground.RevocateSpaceInviteRequest) (
	resp *playground.RevocateSpaceInviteResponse, err error,
) {
	uid := ctxutil.MustGetUIDFromCtx(ctx)
	spaceID, err := parseOptionalInt64(req.SpaceID, "space_id")
	if err != nil {
		return nil, err
	}
	inviteUserID, err := parseOptionalInt64(req.InviteUserID, "invite_user_id")
	if err != nil {
		return nil, err
	}
	if _, err = u.DomainSVC.GetSpaceMemberDetail(ctx, &user.SpaceMemberDetailRequest{
		SpaceID:    spaceID,
		OperatorID: uid,
	}); err != nil {
		return nil, err
	}

	recordState, err := u.getInviteRecordState(ctx, spaceID)
	if err != nil {
		return nil, err
	}

	targetIdx := -1
	for idx, item := range recordState.Records {
		if item.InviteUserID == inviteUserID {
			targetIdx = idx
		}
	}
	if targetIdx >= 0 {
		recordState.Records[targetIdx].Status = playground.SpaceInviteStatusRevoked
		recordState.Records[targetIdx].ExpiredDate = time.Now().Unix()
		if err = u.saveInviteRecordState(ctx, spaceID, recordState); err != nil {
			return nil, err
		}
	}

	return &playground.RevocateSpaceInviteResponse{
		Code: 0,
		Msg:  "success",
	}, nil
}

func (u *UserApplicationService) UpdateUserProfileCheck(ctx context.Context, req *developer_api.UpdateUserProfileCheckRequest) (resp *developer_api.UpdateUserProfileCheckResponse, err error) {
	if req.GetUserUniqueName() == "" {
		return &developer_api.UpdateUserProfileCheckResponse{
			Code: 0,
			Msg:  "no content to update",
		}, nil
	}

	validateResp, err := u.DomainSVC.ValidateProfileUpdate(ctx, &user.ValidateProfileUpdateRequest{
		UniqueName: req.UserUniqueName,
	})
	if err != nil {
		return nil, err
	}

	return &developer_api.UpdateUserProfileCheckResponse{
		Code: int64(validateResp.Code),
		Msg:  validateResp.Msg,
	}, nil
}

func (u *UserApplicationService) ValidateSession(ctx context.Context, sessionKey string) (*entity.Session, error) {
	session, exist, err := u.DomainSVC.ValidateSession(ctx, sessionKey)
	if err != nil {
		return nil, err
	}

	if !exist {
		return nil, errorx.New(errno.ErrUserAuthenticationFailed, errorx.KV("reason", "session not exist"))
	}

	return session, nil
}

func userDo2PassportTo(userDo *entity.User) *passport.User {
	var locale *string
	if userDo.Locale != "" {
		locale = ptr.Of(userDo.Locale)
	}

	return &passport.User{
		UserIDStr:      userDo.UserID,
		Name:           userDo.Name,
		ScreenName:     ptr.Of(userDo.Name),
		UserUniqueName: userDo.UniqueName,
		Email:          userDo.Email,
		Description:    userDo.Description,
		AvatarURL:      userDo.IconURL,
		AppUserInfo: &passport.AppUserInfo{
			UserUniqueName: userDo.UniqueName,
		},
		Locale: locale,

		UserCreateTime: userDo.CreatedAt / 1000,
	}
}

func userDo2PlaygroundTo(userDo *entity.User) *playground.UserBasicInfo {
	return &playground.UserBasicInfo{
		UserId:         userDo.UserID,
		Username:       userDo.Name,
		UserUniqueName: ptr.Of(userDo.UniqueName),
		UserAvatar:     userDo.IconURL,
		CreateTime:     ptr.Of(userDo.CreatedAt / 1000),
	}
}

func (u *UserApplicationService) recordInviteAsJoined(
	ctx context.Context,
	spaceID int64,
	operatorID int64,
	members []user.AddSpaceMemberItem,
) error {
	recordState, err := u.getInviteRecordState(ctx, spaceID)
	if err != nil {
		return err
	}

	now := time.Now().Unix()
	expiredDate := now + int64(spaceInviteExpireDuration/time.Second)
	for _, member := range members {
		if member.UserID <= 0 {
			continue
		}
		recordState.Records = append(recordState.Records, &spaceInviteRecordItem{
			InviteUserID:   member.UserID,
			InviteDate:     now,
			Status:         playground.SpaceInviteStatusJoined,
			OperatorUserID: operatorID,
			ExpiredDate:    expiredDate,
		})
	}

	return u.saveInviteRecordState(ctx, spaceID, recordState)
}

func buildInviteMemberLinkResponse(state *spaceInviteLinkState) *playground.InviteMemberLinkV2Response {
	expireTime := strconv.FormatInt(state.ExpireTime, 10)
	return &playground.InviteMemberLinkV2Response{
		Code: 0,
		Msg:  "success",
		Data: &playground.InviteMemberLinkData{
			Key:        ptr.Of(state.Key),
			ExpireTime: ptr.Of(expireTime),
		},
	}
}

func normalizeSearchKeywords(searchList []string) []string {
	result := make([]string, 0, len(searchList))
	seen := make(map[string]struct{}, len(searchList))
	for _, keyword := range searchList {
		trimmed := strings.TrimSpace(keyword)
		if trimmed == "" {
			continue
		}

		lower := strings.ToLower(trimmed)
		if _, ok := seen[lower]; ok {
			continue
		}
		seen[lower] = struct{}{}
		result = append(result, trimmed)
	}
	return result
}

func matchUserBySearchKeyword(userInfo *entity.User, keyword string) bool {
	if userInfo == nil {
		return false
	}

	searchKeyword := strings.ToLower(strings.TrimSpace(keyword))
	if searchKeyword == "" {
		return false
	}

	if strings.Contains(strings.ToLower(userInfo.Name), searchKeyword) {
		return true
	}
	if strings.Contains(strings.ToLower(userInfo.UniqueName), searchKeyword) {
		return true
	}
	if strings.Contains(strings.ToLower(userInfo.Email), searchKeyword) {
		return true
	}
	return strings.Contains(strconv.FormatInt(userInfo.UserID, 10), searchKeyword)
}

func parseRequiredInt64(raw string, field string) (int64, error) {
	if strings.TrimSpace(raw) == "" {
		return 0, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", field+" is required"))
	}

	result, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, errorx.WrapByCode(err, errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid "+field))
	}
	if result <= 0 {
		return 0, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid "+field))
	}

	return result, nil
}

func parseOptionalInt64(raw *string, field string) (int64, error) {
	if raw == nil {
		return 0, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", field+" is required"))
	}

	return parseRequiredInt64(*raw, field)
}

func formatTimestampDate(ts int64) string {
	if ts <= 0 {
		return ""
	}
	return time.UnixMilli(ts).Format("2006-01-02")
}
