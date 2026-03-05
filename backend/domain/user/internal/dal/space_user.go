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

package dal

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/user/internal/dal/model"
)

func (dao *SpaceDAO) AddSpaceUser(ctx context.Context, spaceUser *model.SpaceUser) error {
	return dao.query.SpaceUser.WithContext(ctx).Create(spaceUser)
}

func (dao *SpaceDAO) AddSpaceUsers(ctx context.Context, spaceUsers []*model.SpaceUser) error {
	if len(spaceUsers) == 0 {
		return nil
	}

	return dao.query.SpaceUser.WithContext(ctx).Create(spaceUsers...)
}

func (dao *SpaceDAO) GetSpaceList(ctx context.Context, userID int64) ([]*model.SpaceUser, error) {
	return dao.query.SpaceUser.WithContext(ctx).Where(
		dao.query.SpaceUser.UserID.Eq(userID),
	).Find()
}

func (dao *SpaceDAO) GetSpaceUser(ctx context.Context, spaceID, userID int64) (*model.SpaceUser, bool, error) {
	spaceUser, err := dao.query.SpaceUser.WithContext(ctx).Where(
		dao.query.SpaceUser.SpaceID.Eq(spaceID),
		dao.query.SpaceUser.UserID.Eq(userID),
	).First()
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, nil
	}

	if err != nil {
		return nil, false, err
	}

	return spaceUser, true, nil
}

func (dao *SpaceDAO) ListSpaceUsersBySpaceID(ctx context.Context, spaceID int64) ([]*model.SpaceUser, error) {
	return dao.query.SpaceUser.WithContext(ctx).Where(
		dao.query.SpaceUser.SpaceID.Eq(spaceID),
	).Find()
}

func (dao *SpaceDAO) UpdateSpaceUserRole(ctx context.Context, spaceID, userID int64, roleType int32) error {
	_, err := dao.query.SpaceUser.WithContext(ctx).Where(
		dao.query.SpaceUser.SpaceID.Eq(spaceID),
		dao.query.SpaceUser.UserID.Eq(userID),
	).Updates(map[string]any{
		"role_type":  roleType,
		"updated_at": time.Now().UnixMilli(),
	})
	return err
}

func (dao *SpaceDAO) DeleteSpaceUser(ctx context.Context, spaceID, userID int64) error {
	_, err := dao.query.SpaceUser.WithContext(ctx).Where(
		dao.query.SpaceUser.SpaceID.Eq(spaceID),
		dao.query.SpaceUser.UserID.Eq(userID),
	).Delete()
	return err
}
