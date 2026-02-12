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

// ProjectRepository 学生项目仓储接口
type ProjectRepository interface {
	// Create 创建项目
	Create(ctx context.Context, project *entity.StudentProject) error

	// GetByID 根据ID获取项目
	GetByID(ctx context.Context, id int64) (*entity.StudentProject, error)

	// Update 更新项目
	Update(ctx context.Context, project *entity.StudentProject) error

	// Delete 删除项目（软删除）
	Delete(ctx context.Context, id int64) error

	// List 获取项目列表
	List(ctx context.Context, query *ProjectQuery) ([]*entity.StudentProject, int64, error)

	// GetByUserID 获取用户的所有项目
	GetByUserID(ctx context.Context, userID int64, spaceID int64) ([]*entity.StudentProject, error)

	// GetByAssignment 获取作业的所有项目
	GetByAssignment(ctx context.Context, assignmentID int64) ([]*entity.StudentProject, error)

	// CountByStatus 统计指定状态的项目数量
	CountByStatus(ctx context.Context, userID int64, spaceID int64, status entity.ProjectStatus) (int64, error)
}

// ProjectQuery 项目查询条件
type ProjectQuery struct {
	UserID       *int64               // 用户ID筛选
	SpaceID      *int64               // 空间ID筛选
	ClassID      *int64               // 班级ID筛选
	AssignmentID *int64               // 作业ID筛选
	ProjectType  *entity.ProjectType  // 项目类型筛选
	Status       *entity.ProjectStatus // 状态筛选
	Keyword      string               // 搜索关键词（匹配title）
	Page         int                  // 页码（从1开始）
	PageSize     int                  // 每页数量
	OrderBy      string               // 排序字段
	OrderDesc    bool                 // 是否降序
}
