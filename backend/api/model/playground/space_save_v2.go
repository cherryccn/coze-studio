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

type SpaceConfigSettingsV2 struct {
	IsSupportExternalUsersJoinSpace *bool `json:"is_support_external_users_join_space,omitempty"`
	IsAllMemberCanPublish           *bool `json:"is_all_member_can_publish,omitempty"`
	ForbidMemberUpsertFolder        *bool `json:"forbid_member_upsert_folder,omitempty"`
}

type SaveSpaceV2Payload struct {
	SpaceID        string                 `json:"space_id,omitempty"`
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	IconURI        string                 `json:"icon_uri"`
	SpaceType      SpaceType              `json:"space_type"`
	SpaceMode      *SpaceMode             `json:"space_mode,omitempty"`
	SpaceConfig    *SpaceConfigSettingsV2 `json:"space_config,omitempty"`
	EnterpriseID   *string                `json:"enterprise_id,omitempty"`
	OrganizationID *string                `json:"organization_id,omitempty"`
}
