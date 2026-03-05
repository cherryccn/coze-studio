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
	"time"

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/user/internal/dal/model"
	"github.com/coze-dev/coze-studio/backend/domain/user/internal/dal/query"
)

func NewSpaceDAO(db *gorm.DB) *SpaceDAO {
	return &SpaceDAO{
		db:    db,
		query: query.Use(db),
	}
}

type SpaceDAO struct {
	db    *gorm.DB
	query *query.Query
}

func (dao *SpaceDAO) CreateSpace(ctx context.Context, space *model.Space) error {
	return dao.query.Space.WithContext(ctx).Create(space)
}

func (dao *SpaceDAO) UpdateSpace(ctx context.Context, spaceID int64, updates map[string]any) error {
	if len(updates) == 0 {
		return nil
	}

	_, err := dao.query.Space.WithContext(ctx).Where(
		dao.query.Space.ID.Eq(spaceID),
	).Updates(updates)

	return err
}

func (dao *SpaceDAO) GetSpaceByIDs(ctx context.Context, spaceIDs []int64) ([]*model.Space, error) {
	return dao.query.Space.WithContext(ctx).Where(
		dao.query.Space.ID.In(spaceIDs...),
	).Find()
}

func (dao *SpaceDAO) GetSpaceByID(ctx context.Context, spaceID int64) (*model.Space, error) {
	return dao.query.Space.WithContext(ctx).Where(
		dao.query.Space.ID.Eq(spaceID),
	).First()
}

func (dao *SpaceDAO) UpdateSpaceOwner(ctx context.Context, spaceID, ownerID int64) error {
	_, err := dao.query.Space.WithContext(ctx).Where(
		dao.query.Space.ID.Eq(spaceID),
	).Updates(map[string]any{
		"owner_id":   ownerID,
		"updated_at": time.Now().UnixMilli(),
	})
	return err
}

func (dao *SpaceDAO) TransferSpaceOwner(ctx context.Context, spaceID, fromUserID, toUserID int64) error {
	return dao.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		q := query.Use(tx)

		_, err := q.Space.WithContext(ctx).Where(
			q.Space.ID.Eq(spaceID),
		).Updates(map[string]any{
			"owner_id":   toUserID,
			"updated_at": time.Now().UnixMilli(),
		})
		if err != nil {
			return err
		}

		_, err = q.SpaceUser.WithContext(ctx).Where(
			q.SpaceUser.SpaceID.Eq(spaceID),
			q.SpaceUser.UserID.Eq(fromUserID),
		).Updates(map[string]any{
			"role_type":  2,
			"updated_at": time.Now().UnixMilli(),
		})
		if err != nil {
			return err
		}

		_, err = q.SpaceUser.WithContext(ctx).Where(
			q.SpaceUser.SpaceID.Eq(spaceID),
			q.SpaceUser.UserID.Eq(toUserID),
		).Updates(map[string]any{
			"role_type":  1,
			"updated_at": time.Now().UnixMilli(),
		})
		return err
	})
}
