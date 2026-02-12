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

// AssignmentRepository 作业仓储接口
type AssignmentRepository interface {
	// Create 创建作业
	Create(ctx context.Context, assignment *entity.Assignment) error

	// GetByID 根据ID获取作业
	GetByID(ctx context.Context, id int64) (*entity.Assignment, error)

	// Update 更新作业
	Update(ctx context.Context, assignment *entity.Assignment) error

	// Delete 删除作业（软删除）
	Delete(ctx context.Context, id int64) error

	// List 获取作业列表
	List(ctx context.Context, query *AssignmentQuery) ([]*entity.Assignment, int64, error)

	// GetByClassID 获取班级的所有作业
	GetByClassID(ctx context.Context, classID int64) ([]*entity.Assignment, error)

	// GetByTeacherID 获取教师布置的所有作业
	GetByTeacherID(ctx context.Context, teacherID int64) ([]*entity.Assignment, error)

	// CountByClass 统计班级的作业数量
	CountByClass(ctx context.Context, classID int64) (int64, error)

	// GetUpcoming 获取即将到期的作业
	GetUpcoming(ctx context.Context, classID int64, days int) ([]*entity.Assignment, error)
}

// AssignmentQuery 作业查询条件
type AssignmentQuery struct {
	ClassID        *int64                 // 班级ID筛选
	TeacherID      *int64                 // 教师ID筛选
	AssignmentType *entity.ProjectType    // 作业类型筛选
	Keyword        string                 // 搜索关键词（匹配title）
	Page           int                    // 页码（从1开始）
	PageSize       int                    // 每页数量
	OrderBy        string                 // 排序字段
	OrderDesc      bool                   // 是否降序
}
