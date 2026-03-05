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

package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/argon2"

	uploadEntity "github.com/coze-dev/coze-studio/backend/domain/upload/entity"
	userEntity "github.com/coze-dev/coze-studio/backend/domain/user/entity"
	"github.com/coze-dev/coze-studio/backend/domain/user/internal/dal/model"
	"github.com/coze-dev/coze-studio/backend/domain/user/repository"
	"github.com/coze-dev/coze-studio/backend/infra/idgen"
	"github.com/coze-dev/coze-studio/backend/infra/storage"
	"github.com/coze-dev/coze-studio/backend/pkg/errorx"
	"github.com/coze-dev/coze-studio/backend/pkg/lang/conv"
	"github.com/coze-dev/coze-studio/backend/pkg/lang/ptr"
	"github.com/coze-dev/coze-studio/backend/pkg/lang/slices"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
	"github.com/coze-dev/coze-studio/backend/types/consts"
	"github.com/coze-dev/coze-studio/backend/types/errno"
)

type Components struct {
	IconOSS   storage.Storage
	IDGen     idgen.IDGenerator
	UserRepo  repository.UserRepository
	SpaceRepo repository.SpaceRepository
}

func NewUserDomain(ctx context.Context, c *Components) User {
	return &userImpl{
		Components: c,
	}
}

type userImpl struct {
	*Components
}

func (u *userImpl) Login(ctx context.Context, email, password string) (user *userEntity.User, err error) {
	userModel, exist, err := u.UserRepo.GetUsersByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if !exist {
		return nil, errorx.New(errno.ErrUserInfoInvalidateCode)
	}

	// Verify the password using the Argon2id algorithm
	valid, err := verifyPassword(password, userModel.Password)
	if err != nil {
		return nil, err
	}
	if !valid {
		return nil, errorx.New(errno.ErrUserInfoInvalidateCode)
	}

	uniqueSessionID, err := u.IDGen.GenID(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to generate session id: %w", err)
	}

	sessionKey, err := generateSessionKey(uniqueSessionID)
	if err != nil {
		return nil, err
	}

	// Update user session key
	err = u.UserRepo.UpdateSessionKey(ctx, userModel.ID, sessionKey)
	if err != nil {
		return nil, err
	}

	userModel.SessionKey = sessionKey

	resURL, err := u.IconOSS.GetObjectUrl(ctx, userModel.IconURI)
	if err != nil {
		return nil, err
	}

	return userPo2Do(userModel, resURL), nil
}

func (u *userImpl) Logout(ctx context.Context, userID int64) (err error) {
	err = u.UserRepo.ClearSessionKey(ctx, userID)
	if err != nil {
		return err
	}

	return nil
}

func (u *userImpl) ResetPassword(ctx context.Context, email, password string) (err error) {
	// Hashing passwords using the Argon2id algorithm
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return err
	}

	err = u.UserRepo.UpdatePassword(ctx, email, hashedPassword)
	if err != nil {
		return err
	}

	return nil
}

func (u *userImpl) GetUserInfo(ctx context.Context, userID int64) (resp *userEntity.User, err error) {
	if userID <= 0 {
		return nil, errorx.New(errno.ErrUserInvalidParamCode,
			errorx.KVf("msg", "invalid user id : %d", userID))
	}

	userModel, err := u.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	resURL, err := u.IconOSS.GetObjectUrl(ctx, userModel.IconURI)
	if err != nil {
		return nil, err
	}

	return userPo2Do(userModel, resURL), nil
}

func (u *userImpl) UpdateAvatar(ctx context.Context, userID int64, ext string, imagePayload []byte) (url string, err error) {
	avatarKey := "user_avatar/" + strconv.FormatInt(userID, 10) + "." + ext
	err = u.IconOSS.PutObject(ctx, avatarKey, imagePayload)
	if err != nil {
		return "", err
	}

	err = u.UserRepo.UpdateAvatar(ctx, userID, avatarKey)
	if err != nil {
		return "", err
	}

	url, err = u.IconOSS.GetObjectUrl(ctx, avatarKey)
	if err != nil {
		return "", err
	}

	return url, nil
}

func (u *userImpl) ValidateProfileUpdate(ctx context.Context, req *ValidateProfileUpdateRequest) (
	resp *ValidateProfileUpdateResponse, err error,
) {
	if req.UniqueName == nil && req.Email == nil {
		return nil, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "missing parameter"))
	}

	if req.UniqueName != nil {
		uniqueName := ptr.From(req.UniqueName)
		charNum := utf8.RuneCountInString(uniqueName)

		if charNum < 4 || charNum > 20 {
			return &ValidateProfileUpdateResponse{
				Code: UniqueNameTooShortOrTooLong,
				Msg:  "unique name length should be between 4 and 20",
			}, nil
		}

		exist, err := u.UserRepo.CheckUniqueNameExist(ctx, uniqueName)
		if err != nil {
			return nil, err
		}

		if exist {
			return &ValidateProfileUpdateResponse{
				Code: UniqueNameExist,
				Msg:  "unique name existed",
			}, nil
		}
	}

	return &ValidateProfileUpdateResponse{
		Code: ValidateSuccess,
		Msg:  "success",
	}, nil
}

func (u *userImpl) UpdateProfile(ctx context.Context, req *UpdateProfileRequest) error {
	updates := map[string]interface{}{
		"updated_at": time.Now().UnixMilli(),
	}

	if req.UniqueName != nil {
		resp, err := u.ValidateProfileUpdate(ctx, &ValidateProfileUpdateRequest{
			UniqueName: req.UniqueName,
		})
		if err != nil {
			return err
		}

		if resp.Code != ValidateSuccess {
			return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", resp.Msg))
		}

		updates["unique_name"] = ptr.From(req.UniqueName)
	}

	if req.Name != nil {
		updates["name"] = ptr.From(req.Name)
	}

	if req.Description != nil {
		updates["description"] = ptr.From(req.Description)
	}

	if req.Locale != nil {
		updates["locale"] = ptr.From(req.Locale)
	}

	err := u.UserRepo.UpdateProfile(ctx, req.UserID, updates)
	if err != nil {
		return err
	}

	return nil
}

func (u *userImpl) Create(ctx context.Context, req *CreateUserRequest) (user *userEntity.User, err error) {
	exist, err := u.UserRepo.CheckEmailExist(ctx, req.Email)
	if err != nil {
		return nil, err
	}

	if exist {
		return nil, errorx.New(errno.ErrUserEmailAlreadyExistCode, errorx.KV("email", req.Email))
	}

	if req.UniqueName != "" {
		exist, err = u.UserRepo.CheckUniqueNameExist(ctx, req.UniqueName)
		if err != nil {
			return nil, err
		}
		if exist {
			return nil, errorx.New(errno.ErrUserUniqueNameAlreadyExistCode, errorx.KV("name", req.UniqueName))
		}
	}

	// Hashing passwords using the Argon2id algorithm
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	name := req.Name
	if name == "" {
		name = strings.Split(req.Email, "@")[0]
	}

	userID, err := u.IDGen.GenID(ctx)
	if err != nil {
		return nil, fmt.Errorf("generate id error: %w", err)
	}

	now := time.Now().UnixMilli()

	spaceID := req.SpaceID
	if spaceID <= 0 {
		var sid int64
		sid, err = u.IDGen.GenID(ctx)
		if err != nil {
			return nil, fmt.Errorf("gen space_id failed: %w", err)
		}

		err = u.SpaceRepo.CreateSpace(ctx, &model.Space{
			ID:          sid,
			Name:        "Personal Space",
			Description: "This is your personal space",
			IconURI:     uploadEntity.EnterpriseIconURI,
			OwnerID:     userID,
			CreatorID:   userID,
			CreatedAt:   now,
			UpdatedAt:   now,
		})
		if err != nil {
			return nil, fmt.Errorf("create personal space failed: %w", err)
		}

		spaceID = sid
	}

	newUser := &model.User{
		ID:           userID,
		IconURI:      uploadEntity.UserIconURI,
		Name:         name,
		UniqueName:   u.getUniqueNameFormEmail(ctx, req.Email),
		Email:        req.Email,
		Password:     hashedPassword,
		Description:  req.Description,
		UserVerified: false,
		Locale:       req.Locale,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	err = u.UserRepo.CreateUser(ctx, newUser)
	if err != nil {
		return nil, fmt.Errorf("insert user failed: %w", err)
	}

	err = u.SpaceRepo.AddSpaceUser(ctx, &model.SpaceUser{
		SpaceID:   spaceID,
		UserID:    userID,
		RoleType:  1,
		CreatedAt: now,
		UpdatedAt: now,
	})
	if err != nil {
		return nil, fmt.Errorf("add space user failed: %w", err)
	}

	iconURL, err := u.IconOSS.GetObjectUrl(ctx, newUser.IconURI)
	if err != nil {
		return nil, fmt.Errorf("get icon url failed: %w", err)
	}

	return userPo2Do(newUser, iconURL), nil
}

func (u *userImpl) getUniqueNameFormEmail(ctx context.Context, email string) string {
	arr := strings.Split(email, "@")
	if len(arr) != 2 {
		return email
	}

	username := arr[0]

	exist, err := u.UserRepo.CheckUniqueNameExist(ctx, username)
	if err != nil {
		logs.CtxWarnf(ctx, "check unique name exist failed: %v", err)
		return email
	}

	if exist {
		logs.CtxWarnf(ctx, "unique name %s already exist", username)

		return email
	}

	return username
}

func (u *userImpl) ValidateSession(ctx context.Context, sessionKey string) (
	session *userEntity.Session, exist bool, err error,
) {
	// authentication session key
	sessionModel, err := verifySessionKey(sessionKey)
	if err != nil {
		return nil, false, errorx.New(errno.ErrUserAuthenticationFailed, errorx.KV("reason", "access denied"))
	}

	// Retrieve user information from the database
	userModel, exist, err := u.UserRepo.GetUserBySessionKey(ctx, sessionKey)
	if err != nil {
		return nil, false, err
	}

	if !exist {
		return nil, false, nil
	}

	return &userEntity.Session{
		UserID:    userModel.ID,
		Locale:    userModel.Locale,
		UserEmail: userModel.Email,
		CreatedAt: sessionModel.CreatedAt,
		ExpiresAt: sessionModel.ExpiresAt,
	}, true, nil
}

func (u *userImpl) MGetUserProfiles(ctx context.Context, userIDs []int64) (users []*userEntity.User, err error) {
	userModels, err := u.UserRepo.GetUsersByIDs(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	users = make([]*userEntity.User, 0, len(userModels))
	for _, um := range userModels {
		// Get image URL
		resURL, err := u.IconOSS.GetObjectUrl(ctx, um.IconURI)
		if err != nil {
			continue // If getting the image URL fails, skip the user
		}

		users = append(users, userPo2Do(um, resURL))
	}

	return users, nil
}

func (u *userImpl) SearchUsers(ctx context.Context, req *SearchUsersRequest) (resp *SearchUsersResponse, err error) {
	if req == nil {
		return nil, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "request is required"))
	}

	page := req.Page
	size := req.Size
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 50
	}
	if size > 200 {
		size = 200
	}

	userModels, total, err := u.UserRepo.SearchUsers(ctx, req.Keywords, page, size)
	if err != nil {
		return nil, err
	}

	users := make([]*userEntity.User, 0, len(userModels))
	for _, um := range userModels {
		resURL, urlErr := u.IconOSS.GetObjectUrl(ctx, um.IconURI)
		if urlErr != nil {
			resURL = ""
		}

		users = append(users, userPo2Do(um, resURL))
	}

	return &SearchUsersResponse{
		Users: users,
		Total: total,
	}, nil
}

func (u *userImpl) GetUserProfiles(ctx context.Context, userID int64) (user *userEntity.User, err error) {
	userInfos, err := u.MGetUserProfiles(ctx, []int64{userID})
	if err != nil {
		return nil, err
	}

	if len(userInfos) == 0 {
		return nil, errorx.New(errno.ErrUserResourceNotFound, errorx.KV("type", "user"),
			errorx.KV("id", conv.Int64ToStr(userID)))
	}

	return userInfos[0], nil
}

func (u *userImpl) GetUserSpaceList(ctx context.Context, userID int64) (spaces []*userEntity.Space, err error) {
	userSpaces, err := u.SpaceRepo.GetSpaceList(ctx, userID)
	if err != nil {
		return nil, err
	}
	spaceIDs := slices.Transform(userSpaces, func(us *model.SpaceUser) int64 {
		return us.SpaceID
	})
	roleMap := make(map[int64]int32, len(userSpaces))
	for _, us := range userSpaces {
		roleMap[us.SpaceID] = us.RoleType
	}

	spaceModels, err := u.SpaceRepo.GetSpaceByIDs(ctx, spaceIDs)
	if err != nil {
		return nil, err
	}
	uris := slices.ToMap(spaceModels, func(sm *model.Space) (string, bool) {
		return sm.IconURI, false
	})

	urls := make(map[string]string, len(uris))
	for uri := range uris {
		url, err := u.IconOSS.GetObjectUrl(ctx, uri)
		if err != nil {
			return nil, err
		}
		urls[uri] = url
	}
	return slices.Transform(spaceModels, func(sm *model.Space) *userEntity.Space {
		space := spacePo2Do(sm, urls[sm.IconURI])
		if role, ok := roleMap[sm.ID]; ok {
			space.RoleType = role
		}
		return space
	}), nil
}

func (u *userImpl) GetUserSpaceBySpaceID(ctx context.Context, spaceID []int64) (spaces []*userEntity.Space, err error) {
	if len(spaceID) == 0 {
		return nil, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "spaceID cannot be empty"))
	}

	spaceModels, err := u.SpaceRepo.GetSpaceByIDs(ctx, spaceID)
	if err != nil {
		return nil, err
	}

	if len(spaceModels) == 0 {
		return []*userEntity.Space{}, nil
	}

	uris := slices.ToMap(spaceModels, func(sm *model.Space) (string, bool) {
		return sm.IconURI, false
	})

	urls := make(map[string]string, len(uris))
	for uri := range uris {
		if uri != "" {
			url, err := u.IconOSS.GetObjectUrl(ctx, uri)
			if err != nil {
				return nil, err
			}
			urls[uri] = url
		}
	}

	return slices.Transform(spaceModels, func(sm *model.Space) *userEntity.Space {
		return spacePo2Do(sm, urls[sm.IconURI])
	}), nil
}

func (u *userImpl) CreateSpace(ctx context.Context, req *CreateSpaceRequest) (resp *CreateSpaceResponse, err error) {
	// Generate space ID
	spaceID, err := u.IDGen.GenID(ctx)
	if err != nil {
		return nil, fmt.Errorf("gen space_id failed: %w", err)
	}

	// Create the space model
	spaceModel := &model.Space{
		ID:          spaceID,
		Name:        req.Name,
		Description: req.Description,
		IconURI:     req.IconURI,
		SpaceType:   int32(req.SpaceType),
		OwnerID:     req.OwnerID,
		CreatorID:   req.CreatorID,
	}

	// Create the space in database
	err = u.SpaceRepo.CreateSpace(ctx, spaceModel)
	if err != nil {
		return nil, err
	}

	// Add the creator as an owner to the space
	// RoleType: 1=owner, 2=admin, 3=member (based on database schema)
	spaceUser := &model.SpaceUser{
		SpaceID:  spaceModel.ID,
		UserID:   req.CreatorID,
		RoleType: 1, // Owner role
	}

	err = u.SpaceRepo.AddSpaceUser(ctx, spaceUser)
	if err != nil {
		return nil, err
	}

	return &CreateSpaceResponse{
		SpaceID: spaceModel.ID,
	}, nil
}

func (u *userImpl) UpdateSpace(ctx context.Context, req *UpdateSpaceRequest) error {
	if req.SpaceID <= 0 || req.OperatorID <= 0 {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid space_id or operator_id"))
	}

	operatorRole, err := u.requireSpaceOperatorRole(ctx, req.SpaceID, req.OperatorID)
	if err != nil {
		return err
	}
	if operatorRole != SpaceRoleOwner && operatorRole != SpaceRoleAdmin {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "only owner/admin can update space"))
	}

	_, err = u.SpaceRepo.GetSpaceByID(ctx, req.SpaceID)
	if err != nil {
		return err
	}

	updates := map[string]any{
		"updated_at": time.Now().UnixMilli(),
	}
	if req.Name != nil {
		trimmedName := strings.TrimSpace(*req.Name)
		if trimmedName == "" {
			return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "space name is required"))
		}
		updates["name"] = trimmedName
	}
	if req.Description != nil {
		updates["description"] = strings.TrimSpace(*req.Description)
	}
	if req.IconURI != nil {
		trimmedIconURI := strings.TrimSpace(*req.IconURI)
		if trimmedIconURI != "" {
			updates["icon_uri"] = trimmedIconURI
		}
	}

	return u.SpaceRepo.UpdateSpace(ctx, req.SpaceID, updates)
}

func (u *userImpl) GetSpaceMemberDetail(ctx context.Context, req *SpaceMemberDetailRequest) (*SpaceMemberSnapshot, error) {
	if req.SpaceID <= 0 || req.OperatorID <= 0 {
		return nil, errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid space_id or operator_id"))
	}

	space, err := u.SpaceRepo.GetSpaceByID(ctx, req.SpaceID)
	if err != nil {
		return nil, err
	}

	operatorSpaceUser, exist, err := u.SpaceRepo.GetSpaceUser(ctx, req.SpaceID, req.OperatorID)
	if err != nil {
		return nil, err
	}
	if !exist {
		return nil, errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "operator is not in space"))
	}

	if operatorSpaceUser.RoleType != SpaceRoleOwner && operatorSpaceUser.RoleType != SpaceRoleAdmin {
		return nil, errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "insufficient space role"))
	}

	spaceUsers, err := u.SpaceRepo.ListSpaceUsersBySpaceID(ctx, req.SpaceID)
	if err != nil {
		return nil, err
	}

	adminTotal := int64(0)
	memberTotal := int64(0)
	members := make([]*SpaceMember, 0, len(spaceUsers))
	for _, su := range spaceUsers {
		if su.RoleType == SpaceRoleAdmin {
			adminTotal++
		}
		if su.RoleType == SpaceRoleMember {
			memberTotal++
		}
		members = append(members, &SpaceMember{
			SpaceID:   su.SpaceID,
			UserID:    su.UserID,
			RoleType:  su.RoleType,
			CreatedAt: su.CreatedAt,
			UpdatedAt: su.UpdatedAt,
		})
	}

	return &SpaceMemberSnapshot{
		Space:        spacePo2Do(space, ""),
		OperatorRole: operatorSpaceUser.RoleType,
		Members:      members,
		AdminTotal:   adminTotal,
		MemberTotal:  memberTotal,
	}, nil
}

func (u *userImpl) AddSpaceMembers(ctx context.Context, req *AddSpaceMembersRequest) error {
	if req.SpaceID <= 0 || req.OperatorID <= 0 {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid space_id or operator_id"))
	}
	if len(req.MemberToAdd) == 0 {
		return nil
	}

	operatorRole, err := u.requireSpaceOperatorRole(ctx, req.SpaceID, req.OperatorID)
	if err != nil {
		return err
	}
	if operatorRole != SpaceRoleOwner && operatorRole != SpaceRoleAdmin {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "only owner/admin can add member"))
	}

	spaceUsers, err := u.SpaceRepo.ListSpaceUsersBySpaceID(ctx, req.SpaceID)
	if err != nil {
		return err
	}
	existingUserMap := make(map[int64]bool, len(spaceUsers))
	for _, su := range spaceUsers {
		existingUserMap[su.UserID] = true
	}

	candidateUserIDs := make([]int64, 0, len(req.MemberToAdd))
	for _, item := range req.MemberToAdd {
		if item.UserID > 0 {
			candidateUserIDs = append(candidateUserIDs, item.UserID)
		}
	}
	existedUsers, err := u.UserRepo.GetUsersByIDs(ctx, candidateUserIDs)
	if err != nil {
		return err
	}
	existedUserMap := make(map[int64]bool, len(existedUsers))
	for _, userModel := range existedUsers {
		existedUserMap[userModel.ID] = true
	}

	toCreate := make([]*model.SpaceUser, 0, len(req.MemberToAdd))
	for _, item := range req.MemberToAdd {
		if item.UserID <= 0 || item.UserID == req.OperatorID {
			continue
		}
		if !existedUserMap[item.UserID] {
			continue
		}

		targetRole := item.RoleType
		if targetRole == 0 {
			targetRole = SpaceRoleMember
		}
		if targetRole != SpaceRoleAdmin && targetRole != SpaceRoleMember {
			return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid target role type"))
		}
		if operatorRole == SpaceRoleAdmin && targetRole != SpaceRoleMember {
			return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "admin can only add member role"))
		}
		if existingUserMap[item.UserID] {
			continue
		}

		existingUserMap[item.UserID] = true
		toCreate = append(toCreate, &model.SpaceUser{
			SpaceID:  req.SpaceID,
			UserID:   item.UserID,
			RoleType: targetRole,
		})
	}

	return u.SpaceRepo.AddSpaceUsers(ctx, toCreate)
}

func (u *userImpl) UpdateSpaceMemberRole(ctx context.Context, req *UpdateSpaceMemberRoleRequest) error {
	if req.SpaceID <= 0 || req.OperatorID <= 0 || req.TargetUserID <= 0 {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid param"))
	}
	if req.TargetRole != SpaceRoleAdmin && req.TargetRole != SpaceRoleMember {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "target role only supports admin/member"))
	}
	if req.OperatorID == req.TargetUserID {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "cannot update self role"))
	}

	operatorRole, err := u.requireSpaceOperatorRole(ctx, req.SpaceID, req.OperatorID)
	if err != nil {
		return err
	}
	if operatorRole != SpaceRoleOwner && operatorRole != SpaceRoleAdmin {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "only owner/admin can update member role"))
	}

	targetSpaceUser, exist, err := u.SpaceRepo.GetSpaceUser(ctx, req.SpaceID, req.TargetUserID)
	if err != nil {
		return err
	}
	if !exist {
		return errorx.New(errno.ErrUserResourceNotFound, errorx.KV("type", "space_user"), errorx.KV("id", conv.Int64ToStr(req.TargetUserID)))
	}
	if targetSpaceUser.RoleType == SpaceRoleOwner {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "cannot update owner role"))
	}

	if operatorRole == SpaceRoleAdmin {
		if targetSpaceUser.RoleType != SpaceRoleMember || req.TargetRole != SpaceRoleMember {
			return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "admin can only manage members"))
		}
	}

	return u.SpaceRepo.UpdateSpaceUserRole(ctx, req.SpaceID, req.TargetUserID, req.TargetRole)
}

func (u *userImpl) RemoveSpaceMember(ctx context.Context, req *RemoveSpaceMemberRequest) error {
	if req.SpaceID <= 0 || req.OperatorID <= 0 || req.TargetUserID <= 0 {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid param"))
	}
	if req.OperatorID == req.TargetUserID {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "use exit endpoint to remove self"))
	}

	operatorRole, err := u.requireSpaceOperatorRole(ctx, req.SpaceID, req.OperatorID)
	if err != nil {
		return err
	}
	if operatorRole != SpaceRoleOwner && operatorRole != SpaceRoleAdmin {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "only owner/admin can remove member"))
	}

	targetSpaceUser, exist, err := u.SpaceRepo.GetSpaceUser(ctx, req.SpaceID, req.TargetUserID)
	if err != nil {
		return err
	}
	if !exist {
		return nil
	}
	if targetSpaceUser.RoleType == SpaceRoleOwner {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "cannot remove owner"))
	}

	if operatorRole == SpaceRoleAdmin && targetSpaceUser.RoleType != SpaceRoleMember {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "admin can only remove members"))
	}

	return u.SpaceRepo.DeleteSpaceUser(ctx, req.SpaceID, req.TargetUserID)
}

func (u *userImpl) TransferSpaceOwner(ctx context.Context, req *TransferSpaceOwnerRequest) error {
	if req.SpaceID <= 0 || req.OperatorID <= 0 || req.TransferUserID <= 0 {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid param"))
	}
	if req.OperatorID == req.TransferUserID {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "cannot transfer owner to self"))
	}

	operatorRole, err := u.requireSpaceOperatorRole(ctx, req.SpaceID, req.OperatorID)
	if err != nil {
		return err
	}
	if operatorRole != SpaceRoleOwner {
		return errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "only owner can transfer owner"))
	}

	targetSpaceUser, exist, err := u.SpaceRepo.GetSpaceUser(ctx, req.SpaceID, req.TransferUserID)
	if err != nil {
		return err
	}
	if !exist {
		return errorx.New(errno.ErrUserResourceNotFound, errorx.KV("type", "space_user"), errorx.KV("id", conv.Int64ToStr(req.TransferUserID)))
	}
	if targetSpaceUser.RoleType == SpaceRoleOwner {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "transfer target is already owner"))
	}

	return u.SpaceRepo.TransferSpaceOwner(ctx, req.SpaceID, req.OperatorID, req.TransferUserID)
}

func (u *userImpl) ExitSpace(ctx context.Context, req *ExitSpaceRequest) error {
	if req.SpaceID <= 0 || req.OperatorID <= 0 {
		return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "invalid param"))
	}

	operatorRole, err := u.requireSpaceOperatorRole(ctx, req.SpaceID, req.OperatorID)
	if err != nil {
		return err
	}

	if operatorRole == SpaceRoleOwner {
		if req.TransferUserID == nil || *req.TransferUserID <= 0 || *req.TransferUserID == req.OperatorID {
			return errorx.New(errno.ErrUserInvalidParamCode, errorx.KV("msg", "owner exit requires valid transfer_user_id"))
		}

		if err = u.TransferSpaceOwner(ctx, &TransferSpaceOwnerRequest{
			SpaceID:        req.SpaceID,
			OperatorID:     req.OperatorID,
			TransferUserID: *req.TransferUserID,
		}); err != nil {
			return err
		}
	}

	return u.SpaceRepo.DeleteSpaceUser(ctx, req.SpaceID, req.OperatorID)
}

func (u *userImpl) requireSpaceOperatorRole(ctx context.Context, spaceID, operatorID int64) (int32, error) {
	operatorSpaceUser, exist, err := u.SpaceRepo.GetSpaceUser(ctx, spaceID, operatorID)
	if err != nil {
		return 0, err
	}
	if !exist {
		return 0, errorx.New(errno.ErrUserPermissionCode, errorx.KV("msg", "operator is not in space"))
	}

	return operatorSpaceUser.RoleType, nil
}

func spacePo2Do(space *model.Space, iconUrl string) *userEntity.Space {
	return &userEntity.Space{
		ID:          space.ID,
		Name:        space.Name,
		Description: space.Description,
		IconURL:     iconUrl,
		SpaceType:   userEntity.SpaceType(space.SpaceType),
		OwnerID:     space.OwnerID,
		CreatorID:   space.CreatorID,
		CreatedAt:   space.CreatedAt,
		UpdatedAt:   space.UpdatedAt,
	}
}

// Argon2id parameter
type argon2Params struct {
	memory      uint32
	iterations  uint32
	parallelism uint8
	saltLength  uint32
	keyLength   uint32
}

// Default Argon2id parameters
var defaultArgon2Params = &argon2Params{
	memory:      64 * 1024, // 64MB
	iterations:  3,
	parallelism: 4,
	saltLength:  16,
	keyLength:   32,
}

// Hashing passwords using the Argon2id algorithm
func hashPassword(password string) (string, error) {
	p := defaultArgon2Params

	// Generate random salt values
	salt := make([]byte, p.saltLength)
	_, err := rand.Read(salt)
	if err != nil {
		return "", err
	}

	// Calculate the hash value using the Argon2id algorithm
	hash := argon2.IDKey(
		[]byte(password),
		salt,
		p.iterations,
		p.memory,
		p.parallelism,
		p.keyLength,
	)

	// Encoding to base64 format
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// Format: $argon2id $v = 19 $m = 65536, t = 3, p = 4 $< salt > $< hash >
	encoded := fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		p.memory, p.iterations, p.parallelism, b64Salt, b64Hash)

	return encoded, nil
}

// Verify that the passwords match
func verifyPassword(password, encodedHash string) (bool, error) {
	// Parse the encoded hash string
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false, fmt.Errorf("invalid hash format")
	}

	var p argon2Params
	_, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &p.memory, &p.iterations, &p.parallelism)
	if err != nil {
		return false, err
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, err
	}
	p.saltLength = uint32(len(salt))

	decodedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, err
	}
	p.keyLength = uint32(len(decodedHash))

	// Calculate the hash value using the same parameters and salt values
	computedHash := argon2.IDKey(
		[]byte(password),
		salt,
		p.iterations,
		p.memory,
		p.parallelism,
		p.keyLength,
	)

	// Compare the calculated hash value with the stored hash value
	return subtle.ConstantTimeCompare(decodedHash, computedHash) == 1, nil
}

// Session structure, which contains session information
type Session struct {
	ID        int64     `json:"id"`         // Session unique device identifier
	CreatedAt time.Time `json:"created_at"` // creation time
	ExpiresAt time.Time `json:"expires_at"` // expiration time
}

// The key used for signing (in practice you should read from the configuration or use environment variables)
var hmacSecret = []byte("opencoze-session-hmac-key")

// Generate a secure session key
func generateSessionKey(sessionID int64) (string, error) {
	// Create the default session structure (without the user ID, which will be set in the Login method)
	session := Session{
		ID:        sessionID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(consts.DefaultSessionDuration),
	}

	// Serialize session data
	sessionData, err := json.Marshal(session)
	if err != nil {
		return "", err
	}

	// Calculate HMAC signatures to ensure integrity
	h := hmac.New(sha256.New, hmacSecret)
	h.Write(sessionData)
	signature := h.Sum(nil)

	// Combining session data and signatures
	finalData := append(sessionData, signature...)

	// Base64 encoding final result
	return base64.RawURLEncoding.EncodeToString(finalData), nil
}

// Verify the validity of the session key
func verifySessionKey(sessionKey string) (*Session, error) {
	// Decode session data
	data, err := base64.RawURLEncoding.DecodeString(sessionKey)
	if err != nil {
		return nil, fmt.Errorf("invalid session format: %w", err)
	}

	// Make sure the data is long enough to include at least session data and signatures
	if len(data) < 32 { // Simple inspection should actually be more rigorous
		return nil, fmt.Errorf("session data too short")
	}

	// Separating session data and signatures
	sessionData := data[:len(data)-32] // Assume the signature is 32 bytes
	signature := data[len(data)-32:]

	// verify signature
	h := hmac.New(sha256.New, hmacSecret)
	h.Write(sessionData)
	expectedSignature := h.Sum(nil)

	if !hmac.Equal(signature, expectedSignature) {
		return nil, fmt.Errorf("invalid session signature")
	}

	// Parsing session data
	var session Session
	if err := json.Unmarshal(sessionData, &session); err != nil {
		return nil, fmt.Errorf("invalid session data: %w", err)
	}

	// Check if the session has expired
	if time.Now().After(session.ExpiresAt) {
		return nil, fmt.Errorf("session expired")
	}

	return &session, nil
}

func userPo2Do(model *model.User, iconURL string) *userEntity.User {
	return &userEntity.User{
		UserID:       model.ID,
		Name:         model.Name,
		UniqueName:   model.UniqueName,
		Email:        model.Email,
		Description:  model.Description,
		IconURI:      model.IconURI,
		IconURL:      iconURL,
		UserVerified: model.UserVerified,
		Locale:       model.Locale,
		SessionKey:   model.SessionKey,
		CreatedAt:    model.CreatedAt,
		UpdatedAt:    model.UpdatedAt,
	}
}
