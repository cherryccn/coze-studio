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

type SpaceConfigDetails struct {
	CanShowJoinTeamPermissionSettings *bool `json:"can_show_join_team_permission_settings,omitempty"`
	CanEditJoinTeamPermissionSettings *bool `json:"can_edit_join_team_permission_settings,omitempty"`
	IsSupportExternalUsersJoinSpace   *bool `json:"is_support_external_users_join_space,omitempty"`
	IsSupportAllMemberPublish         *bool `json:"is_support_all_member_publish,omitempty"`
	ForbidMemberUpsertFolder          *bool `json:"forbid_member_upsert_folder,omitempty"`
}

type MemberInfo struct {
	UserID        string        `json:"user_id"`
	Name          string        `json:"name"`
	IconURL       string        `json:"icon_url"`
	SpaceRoleType SpaceRoleType `json:"space_role_type"`
	IsJoin        *bool         `json:"is_join,omitempty"`
	JoinDate      *string       `json:"join_date,omitempty"`
	UserName      *string       `json:"user_name,omitempty"`
	IsConfirming  *bool         `json:"is_confirming,omitempty"`
}

type SpaceMemberDetailV2Request struct {
	SpaceID       string         `json:"space_id"`
	SearchWord    *string        `json:"search_word,omitempty"`
	SpaceRoleType *SpaceRoleType `json:"space_role_type,omitempty"`
	Page          *int32         `json:"page,omitempty"`
	Size          *int32         `json:"size,omitempty"`
}

type SpaceMemberDetailV2Data struct {
	SpaceID              *string             `json:"space_id,omitempty"`
	Name                 *string             `json:"name,omitempty"`
	Description          *string             `json:"description,omitempty"`
	IconURL              *string             `json:"icon_url,omitempty"`
	SpaceRoleType        *SpaceRoleType      `json:"space_role_type,omitempty"`
	Total                *int32              `json:"total,omitempty"`
	MemberInfoList       []*MemberInfo       `json:"member_info_list,omitempty"`
	AdminTotalNum        *int32              `json:"admin_total_num,omitempty"`
	MemberTotalNum       *int32              `json:"member_total_num,omitempty"`
	MaxAdminNum          *int32              `json:"max_admin_num,omitempty"`
	MaxMemberNum         *int32              `json:"max_member_num,omitempty"`
	TeamInviteLinkStatus *bool               `json:"team_invite_link_status,omitempty"`
	SpaceConfigDetails   *SpaceConfigDetails `json:"space_config_details,omitempty"`
	CanPublishInSpace    *bool               `json:"can_publish_in_space,omitempty"`
}

type SpaceMemberDetailV2Response struct {
	Code int64                    `json:"code"`
	Msg  string                   `json:"msg"`
	Data *SpaceMemberDetailV2Data `json:"data,omitempty"`
}

type SearchMemberV2Request struct {
	SearchList               []string `json:"search_list"`
	SpaceID                  string   `json:"space_id"`
	SearchVolcanoAccountList *bool    `json:"search_volcano_account_list,omitempty"`
	Page                     *int32   `json:"page,omitempty"`
	Size                     *int32   `json:"size,omitempty"`
}

type SearchMemberV2Response struct {
	Code             int64         `json:"code"`
	Msg              string        `json:"msg"`
	MemberInfoList   []*MemberInfo `json:"member_info_list,omitempty"`
	FailedSearchList []string      `json:"failed_search_list,omitempty"`
	Total            *int32        `json:"total,omitempty"`
}

type AddSpaceMemberV2Request struct {
	MemberInfoList []*MemberInfo `json:"member_info_list"`
	SpaceID        string        `json:"space_id"`
}

type AddSpaceMemberV2Response struct {
	Code int64  `json:"code"`
	Msg  string `json:"msg"`
}

type UpdateSpaceMemberV2Request struct {
	SpaceID       *string        `json:"space_id,omitempty"`
	UserID        *string        `json:"user_id,omitempty"`
	SpaceRoleType *SpaceRoleType `json:"space_role_type,omitempty"`
}

type UpdateSpaceMemberV2Response struct {
	Code int64  `json:"code"`
	Msg  string `json:"msg"`
}

type TransferSpaceV2Request struct {
	SpaceID        *string `json:"space_id,omitempty"`
	TransferUserID *string `json:"transfer_user_id,omitempty"`
}

type TransferSpaceV2Response struct {
	Code int64  `json:"code"`
	Msg  string `json:"msg"`
}

type RemoveSpaceMemberV2Request struct {
	SpaceID      *string `json:"space_id,omitempty"`
	RemoveUserID *string `json:"remove_user_id,omitempty"`
}

type RemoveSpaceMemberV2Response struct {
	Code int64  `json:"code"`
	Msg  string `json:"msg"`
}

type ExitSpaceV2Request struct {
	SpaceID        *string `json:"space_id,omitempty"`
	TransferUserID *string `json:"transfer_user_id,omitempty"`
}

type ExitSpaceV2Response struct {
	Code int64  `json:"code"`
	Msg  string `json:"msg"`
}
