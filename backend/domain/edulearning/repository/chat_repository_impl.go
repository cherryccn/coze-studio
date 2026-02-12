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

package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
)

// chatRepositoryImpl 对话仓储实现
type chatRepositoryImpl struct {
	db *gorm.DB
}

// NewChatRepository 创建对话仓储实例
func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepositoryImpl{db: db}
}

func (r *chatRepositoryImpl) Create(ctx context.Context, message *entity.ChatMessage) error {
	return r.db.WithContext(ctx).Create(message).Error
}

func (r *chatRepositoryImpl) BatchCreate(ctx context.Context, messages []*entity.ChatMessage) error {
	return r.db.WithContext(ctx).Create(&messages).Error
}

func (r *chatRepositoryImpl) GetByID(ctx context.Context, id int64) (*entity.ChatMessage, error) {
	var message entity.ChatMessage
	err := r.db.WithContext(ctx).First(&message, id).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (r *chatRepositoryImpl) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&entity.ChatMessage{}, id).Error
}

func (r *chatRepositoryImpl) GetByProjectID(ctx context.Context, projectID int64, limit, offset int) ([]*entity.ChatMessage, error) {
	var messages []*entity.ChatMessage
	db := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("created_at ASC")

	if limit > 0 {
		db = db.Limit(limit)
	}
	if offset > 0 {
		db = db.Offset(offset)
	}

	err := db.Find(&messages).Error
	return messages, err
}

func (r *chatRepositoryImpl) GetByStage(ctx context.Context, projectID int64, stageID int64, limit, offset int) ([]*entity.ChatMessage, error) {
	var messages []*entity.ChatMessage
	db := r.db.WithContext(ctx).
		Where("project_id = ? AND stage_id = ?", projectID, stageID).
		Order("created_at ASC")

	if limit > 0 {
		db = db.Limit(limit)
	}
	if offset > 0 {
		db = db.Offset(offset)
	}

	err := db.Find(&messages).Error
	return messages, err
}

func (r *chatRepositoryImpl) CountByProjectID(ctx context.Context, projectID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.ChatMessage{}).
		Where("project_id = ?", projectID).
		Count(&count).Error
	return count, err
}

func (r *chatRepositoryImpl) CountByStage(ctx context.Context, projectID int64, stageID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.ChatMessage{}).
		Where("project_id = ? AND stage_id = ?", projectID, stageID).
		Count(&count).Error
	return count, err
}

func (r *chatRepositoryImpl) GetLatestMessages(ctx context.Context, projectID int64, limit int) ([]*entity.ChatMessage, error) {
	var messages []*entity.ChatMessage
	err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Limit(limit).
		Find(&messages).Error
	return messages, err
}
