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

	"github.com/coze-dev/coze-studio/backend/domain/user/entity"
)

type UpdateProfileRequest struct {
	UserID      int64
	Name        *string
	UniqueName  *string
	Description *string
	Locale      *string
}

type ValidateProfileUpdateRequest struct {
	UniqueName *string
	Email      *string
}

type ValidateProfileUpdateResult int

const (
	ValidateSuccess             ValidateProfileUpdateResult = 0
	UniqueNameExist             ValidateProfileUpdateResult = 2
	UniqueNameTooShortOrTooLong ValidateProfileUpdateResult = 3
	EmailExist                  ValidateProfileUpdateResult = 5
)

type ValidateProfileUpdateResponse struct {
	Code ValidateProfileUpdateResult
	Msg  string
}

type CreateUserRequest struct {
	Email       string
	Password    string
	Name        string
	UniqueName  string
	Description string
	SpaceID     int64
	Locale      string
}

type CreateUserResponse struct {
	UserID int64
}

type CreateSpaceRequest struct {
	Name        string
	Description string
	IconURI     string
	SpaceType   entity.SpaceType
	OwnerID     int64
	CreatorID   int64
}

type CreateSpaceResponse struct {
	SpaceID int64
}

type UpdateSpaceRequest struct {
	SpaceID     int64
	OperatorID  int64
	Name        *string
	Description *string
	IconURI     *string
}

const (
	SpaceRoleOwner  int32 = 1
	SpaceRoleAdmin  int32 = 2
	SpaceRoleMember int32 = 3
)

type SpaceMember struct {
	SpaceID   int64
	UserID    int64
	RoleType  int32
	CreatedAt int64
	UpdatedAt int64
}

type SpaceMemberSnapshot struct {
	Space        *entity.Space
	OperatorRole int32
	Members      []*SpaceMember
	AdminTotal   int64
	MemberTotal  int64
}

type AddSpaceMemberItem struct {
	UserID   int64
	RoleType int32
}

type SpaceMemberDetailRequest struct {
	SpaceID    int64
	OperatorID int64
}

type SearchUsersRequest struct {
	Keywords []string
	Page     int
	Size     int
}

type SearchUsersResponse struct {
	Users []*entity.User
	Total int64
}

type AddSpaceMembersRequest struct {
	SpaceID     int64
	OperatorID  int64
	MemberToAdd []AddSpaceMemberItem
}

type UpdateSpaceMemberRoleRequest struct {
	SpaceID      int64
	OperatorID   int64
	TargetUserID int64
	TargetRole   int32
}

type RemoveSpaceMemberRequest struct {
	SpaceID      int64
	OperatorID   int64
	TargetUserID int64
}

type TransferSpaceOwnerRequest struct {
	SpaceID        int64
	OperatorID     int64
	TransferUserID int64
}

type ExitSpaceRequest struct {
	SpaceID        int64
	OperatorID     int64
	TransferUserID *int64
}

type User interface {
	SaasUserProvider
	// Create creates or registers a new user.
	Create(ctx context.Context, req *CreateUserRequest) (user *entity.User, err error)
	Login(ctx context.Context, email, password string) (user *entity.User, err error)
	Logout(ctx context.Context, userID int64) (err error)
	ResetPassword(ctx context.Context, email, password string) (err error)
	GetUserInfo(ctx context.Context, userID int64) (user *entity.User, err error)
	UpdateAvatar(ctx context.Context, userID int64, ext string, imagePayload []byte) (url string, err error)
	UpdateProfile(ctx context.Context, req *UpdateProfileRequest) (err error)
	ValidateProfileUpdate(ctx context.Context, req *ValidateProfileUpdateRequest) (resp *ValidateProfileUpdateResponse, err error)
	GetUserProfiles(ctx context.Context, userID int64) (user *entity.User, err error)
	MGetUserProfiles(ctx context.Context, userIDs []int64) (users []*entity.User, err error)
	SearchUsers(ctx context.Context, req *SearchUsersRequest) (resp *SearchUsersResponse, err error)
	ValidateSession(ctx context.Context, sessionKey string) (session *entity.Session, exist bool, err error)
	GetUserSpaceList(ctx context.Context, userID int64) (spaces []*entity.Space, err error)
	GetUserSpaceBySpaceID(ctx context.Context, spaceID []int64) (space []*entity.Space, err error)
	CreateSpace(ctx context.Context, req *CreateSpaceRequest) (resp *CreateSpaceResponse, err error)
	UpdateSpace(ctx context.Context, req *UpdateSpaceRequest) error
	GetSpaceMemberDetail(ctx context.Context, req *SpaceMemberDetailRequest) (resp *SpaceMemberSnapshot, err error)
	AddSpaceMembers(ctx context.Context, req *AddSpaceMembersRequest) error
	UpdateSpaceMemberRole(ctx context.Context, req *UpdateSpaceMemberRoleRequest) error
	RemoveSpaceMember(ctx context.Context, req *RemoveSpaceMemberRequest) error
	TransferSpaceOwner(ctx context.Context, req *TransferSpaceOwnerRequest) error
	ExitSpace(ctx context.Context, req *ExitSpaceRequest) error
}

type SaasUserProvider interface {
	GetSaasUserInfo(ctx context.Context) (user *entity.SaasUserData, err error)
	GetUserBenefit(ctx context.Context) (benefit *entity.UserBenefit, err error)
}
