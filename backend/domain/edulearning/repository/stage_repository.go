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

// StageRepository 项目阶段仓储接口
type StageRepository interface {
	// Create 创建阶段
	Create(ctx context.Context, stage *entity.ProjectStage) error

	// BatchCreate 批量创建阶段
	BatchCreate(ctx context.Context, stages []*entity.ProjectStage) error

	// GetByID 根据ID获取阶段
	GetByID(ctx context.Context, id int64) (*entity.ProjectStage, error)

	// Update 更新阶段
	Update(ctx context.Context, stage *entity.ProjectStage) error

	// Delete 删除阶段
	Delete(ctx context.Context, id int64) error

	// GetByProjectID 获取项目的所有阶段
	GetByProjectID(ctx context.Context, projectID int64) ([]*entity.ProjectStage, error)

	// GetByProjectAndOrder 获取项目的指定序号阶段
	GetByProjectAndOrder(ctx context.Context, projectID int64, stageOrder int) (*entity.ProjectStage, error)

	// GetCurrentStage 获取项目当前阶段
	GetCurrentStage(ctx context.Context, projectID int64) (*entity.ProjectStage, error)

	// CountByStatus 统计指定状态的阶段数量
	CountByStatus(ctx context.Context, projectID int64, status entity.StageStatus) (int64, error)
}
