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
	"strconv"
	"time"

	"github.com/coze-dev/coze-studio/backend/api/model/playground"
	"github.com/coze-dev/coze-studio/backend/pkg/kvstore"
)

const (
	spaceInviteLinkNamespace   = "space_invite_link_v2"
	spaceInviteRecordNamespace = "space_invite_record_v2"
	spaceInviteExpireDuration  = 7 * 24 * time.Hour
)

type spaceInviteLinkState struct {
	Enabled    bool   `json:"enabled"`
	Key        string `json:"key"`
	ExpireTime int64  `json:"expire_time"`
}

type spaceInviteRecordItem struct {
	InviteUserID   int64                        `json:"invite_user_id"`
	InviteDate     int64                        `json:"invite_date"`
	Status         playground.SpaceInviteStatus `json:"status"`
	OperatorUserID int64                        `json:"operator_user_id"`
	ExpiredDate    int64                        `json:"expired_date"`
}

type spaceInviteRecordState struct {
	Records []*spaceInviteRecordItem `json:"records"`
}

func (u *UserApplicationService) getInviteLinkState(ctx context.Context, spaceID int64) (*spaceInviteLinkState, error) {
	key := strconv.FormatInt(spaceID, 10)
	if u.inviteLinkKV == nil {
		return defaultInviteLinkState(spaceID), nil
	}

	state, err := u.inviteLinkKV.Get(ctx, spaceInviteLinkNamespace, key)
	if err == nil {
		return state, nil
	}
	if err != kvstore.ErrKeyNotFound {
		return nil, err
	}

	defaultState := defaultInviteLinkState(spaceID)
	if saveErr := u.inviteLinkKV.Save(ctx, spaceInviteLinkNamespace, key, defaultState); saveErr != nil {
		return nil, saveErr
	}
	return defaultState, nil
}

func (u *UserApplicationService) saveInviteLinkState(ctx context.Context, spaceID int64, state *spaceInviteLinkState) error {
	if u.inviteLinkKV == nil {
		return nil
	}

	return u.inviteLinkKV.Save(ctx, spaceInviteLinkNamespace, strconv.FormatInt(spaceID, 10), state)
}

func (u *UserApplicationService) getInviteRecordState(ctx context.Context, spaceID int64) (*spaceInviteRecordState, error) {
	key := strconv.FormatInt(spaceID, 10)
	if u.inviteRecordKV == nil {
		return &spaceInviteRecordState{}, nil
	}

	state, err := u.inviteRecordKV.Get(ctx, spaceInviteRecordNamespace, key)
	if err == nil {
		if state.Records == nil {
			state.Records = make([]*spaceInviteRecordItem, 0)
		}
		return state, nil
	}
	if err != kvstore.ErrKeyNotFound {
		return nil, err
	}

	emptyState := &spaceInviteRecordState{
		Records: make([]*spaceInviteRecordItem, 0),
	}
	if saveErr := u.inviteRecordKV.Save(ctx, spaceInviteRecordNamespace, key, emptyState); saveErr != nil {
		return nil, saveErr
	}
	return emptyState, nil
}

func (u *UserApplicationService) saveInviteRecordState(ctx context.Context, spaceID int64, state *spaceInviteRecordState) error {
	if u.inviteRecordKV == nil {
		return nil
	}

	return u.inviteRecordKV.Save(ctx, spaceInviteRecordNamespace, strconv.FormatInt(spaceID, 10), state)
}

func defaultInviteLinkState(spaceID int64) *spaceInviteLinkState {
	now := time.Now().Unix()
	return &spaceInviteLinkState{
		Enabled:    true,
		Key:        fmt.Sprintf("space-%d-%d", spaceID, now),
		ExpireTime: now + int64(spaceInviteExpireDuration/time.Second),
	}
}
