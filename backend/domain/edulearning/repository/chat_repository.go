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

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
)

// ChatRepository 对话消息仓储接口
type ChatRepository interface {
	// Create 创建消息
	Create(ctx context.Context, message *entity.ChatMessage) error

	// BatchCreate 批量创建消息
	BatchCreate(ctx context.Context, messages []*entity.ChatMessage) error

	// GetByID 根据ID获取消息
	GetByID(ctx context.Context, id int64) (*entity.ChatMessage, error)

	// Delete 删除消息
	Delete(ctx context.Context, id int64) error

	// GetByProjectID 获取项目的所有消息
	GetByProjectID(ctx context.Context, projectID int64, limit, offset int) ([]*entity.ChatMessage, error)

	// GetByStage 获取项目指定阶段的消息
	GetByStage(ctx context.Context, projectID int64, stageID int64, limit, offset int) ([]*entity.ChatMessage, error)

	// CountByProjectID 统计项目的消息数量
	CountByProjectID(ctx context.Context, projectID int64) (int64, error)

	// CountByStage 统计指定阶段的消息数量
	CountByStage(ctx context.Context, projectID int64, stageID int64) (int64, error)

	// GetLatestMessages 获取最新的N条消息
	GetLatestMessages(ctx context.Context, projectID int64, limit int) ([]*entity.ChatMessage, error)
}
