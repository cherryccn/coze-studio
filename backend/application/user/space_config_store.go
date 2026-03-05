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
	"strconv"

	"github.com/coze-dev/coze-studio/backend/pkg/kvstore"
)

const spaceConfigNamespace = "space_config_v2"

type spaceConfigState struct {
	IsSupportExternalUsersJoinSpace bool `json:"is_support_external_users_join_space"`
	IsAllMemberCanPublish           bool `json:"is_all_member_can_publish"`
	ForbidMemberUpsertFolder        bool `json:"forbid_member_upsert_folder"`
}

func (u *UserApplicationService) getSpaceConfigState(ctx context.Context, spaceID int64) (*spaceConfigState, error) {
	if u.spaceConfigKV == nil {
		return defaultSpaceConfigState(), nil
	}

	key := strconv.FormatInt(spaceID, 10)
	state, err := u.spaceConfigKV.Get(ctx, spaceConfigNamespace, key)
	if err == nil {
		return state, nil
	}
	if err != kvstore.ErrKeyNotFound {
		return nil, err
	}

	defaultState := defaultSpaceConfigState()
	if saveErr := u.spaceConfigKV.Save(ctx, spaceConfigNamespace, key, defaultState); saveErr != nil {
		return nil, saveErr
	}

	return defaultState, nil
}

func (u *UserApplicationService) saveSpaceConfigState(ctx context.Context, spaceID int64, state *spaceConfigState) error {
	if u.spaceConfigKV == nil {
		return nil
	}

	return u.spaceConfigKV.Save(ctx, spaceConfigNamespace, strconv.FormatInt(spaceID, 10), state)
}

func defaultSpaceConfigState() *spaceConfigState {
	return &spaceConfigState{
		IsSupportExternalUsersJoinSpace: true,
		IsAllMemberCanPublish:           false,
		ForbidMemberUpsertFolder:        false,
	}
}
