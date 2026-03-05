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

package playground

type InviteFunc int64

const (
	InviteFuncGetInfo InviteFunc = 1
)

type SpaceInviteStatus int64

const (
	SpaceInviteStatusAll        SpaceInviteStatus = 0
	SpaceInviteStatusJoined     SpaceInviteStatus = 1
	SpaceInviteStatusConfirming SpaceInviteStatus = 2
	SpaceInviteStatusRejected   SpaceInviteStatus = 3
	SpaceInviteStatusRevoked    SpaceInviteStatus = 4
	SpaceInviteStatusExpired    SpaceInviteStatus = 5
)

type InviteMemberLinkData struct {
	Key        *string `json:"key,omitempty"`
	ExpireTime *string `json:"expire_time,omitempty"`
}

type InviteMemberLinkV2Request struct {
	SpaceID              string      `json:"space_id"`
	TeamInviteLinkStatus bool        `json:"team_invite_link_status"`
	Func                 *InviteFunc `json:"func,omitempty"`
}

type InviteMemberLinkV2Response struct {
	Code int64                 `json:"code"`
	Msg  string                `json:"msg"`
	Data *InviteMemberLinkData `json:"data,omitempty"`
}

type SpaceInviteManageInfo struct {
	InviteUserID        string            `json:"invite_user_id"`
	InviteNickName      string            `json:"invite_nick_name"`
	InviteUserName      string            `json:"invite_user_name"`
	InviteUserIconURL   string            `json:"invite_user_icon_url"`
	InviteDate          string            `json:"invite_date"`
	SpaceInviteStatus   SpaceInviteStatus `json:"space_invite_status"`
	OperatorUserID      string            `json:"operator_user_id"`
	OperatorNickName    string            `json:"operator_nick_name"`
	OperatorUserName    string            `json:"operator_user_name"`
	OperatorUserIconURL string            `json:"operator_user_icon_url"`
	OperatorRoleType    SpaceRoleType     `json:"operator_role_type"`
	ExpiredDate         string            `json:"expired_date"`
}

type SpaceInviteManageInfoData struct {
	SpaceInviteManageInfoList []*SpaceInviteManageInfo `json:"space_invite_manage_info_list,omitempty"`
	Total                     *int32                   `json:"total,omitempty"`
	HasMore                   *bool                    `json:"has_more,omitempty"`
}

type GetSpaceInviteManageListRequest struct {
	SpaceID           *string            `json:"space_id,omitempty" query:"space_id"`
	SpaceInviteStatus *SpaceInviteStatus `json:"space_invite_status,omitempty" query:"space_invite_status"`
	SearchWord        *string            `json:"search_word,omitempty" query:"search_word"`
	Page              *int32             `json:"page,omitempty" query:"page"`
	Size              *int32             `json:"size,omitempty" query:"size"`
}

type GetSpaceInviteManageListResponse struct {
	Data *SpaceInviteManageInfoData `json:"data,omitempty"`
	Code int64                      `json:"code"`
	Msg  string                     `json:"msg"`
}

type RevocateSpaceInviteRequest struct {
	SpaceID      *string `json:"space_id,omitempty" query:"space_id"`
	InviteUserID *string `json:"invite_user_id,omitempty" query:"invite_user_id"`
}

type RevocateSpaceInviteResponse struct {
	Code int64  `json:"code"`
	Msg  string `json:"msg"`
}
