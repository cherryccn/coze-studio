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

	"github.com/coze-dev/coze-studio/backend/domain/eduproject/entity"
)

// ProjectRepository 项目仓储接口
type ProjectRepository interface {
	// GetByID 根据ID获取项目
	GetByID(ctx context.Context, id int64) (*entity.StudentProject, error)

	// GetByStudentID 获取学生的项目列表
	GetByStudentID(ctx context.Context, studentID int64) ([]*entity.StudentProject, error)

	// Create 创建项目
	Create(ctx context.Context, project *entity.StudentProject) error

	// Update 更新项目
	Update(ctx context.Context, project *entity.StudentProject) error

	// CreateStage 创建阶段记录
	CreateStage(ctx context.Context, stage *entity.ProjectStage) error

	// GetStagesByProjectID 获取项目的所有阶段
	GetStagesByProjectID(ctx context.Context, projectID int64) ([]*entity.ProjectStage, error)

	// UpdateStage 更新阶段
	UpdateStage(ctx context.Context, stage *entity.ProjectStage) error
}
