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

// ClassRepository 班级仓储接口
type ClassRepository interface {
	// Create 创建班级
	Create(ctx context.Context, class *entity.Class) error

	// GetByID 根据ID获取班级
	GetByID(ctx context.Context, id int64) (*entity.Class, error)

	// Update 更新班级
	Update(ctx context.Context, class *entity.Class) error

	// Delete 删除班级（软删除）
	Delete(ctx context.Context, id int64) error

	// List 获取班级列表
	List(ctx context.Context, query *ClassQuery) ([]*entity.Class, int64, error)

	// GetByTeacherID 获取教师的所有班级
	GetByTeacherID(ctx context.Context, teacherID int64, spaceID int64) ([]*entity.Class, error)

	// AddMember 添加班级成员
	AddMember(ctx context.Context, member *entity.ClassMember) error

	// RemoveMember 移除班级成员
	RemoveMember(ctx context.Context, classID int64, userID int64) error

	// GetMembers 获取班级成员列表
	GetMembers(ctx context.Context, classID int64) ([]*entity.ClassMember, error)

	// IsMember 检查用户是否为班级成员
	IsMember(ctx context.Context, classID int64, userID int64) (bool, error)

	// CountMembers 统计班级成员数量
	CountMembers(ctx context.Context, classID int64) (int64, error)

	// GetUserClasses 获取用户所在的所有班级
	GetUserClasses(ctx context.Context, userID int64) ([]*entity.Class, error)
}

// ClassQuery 班级查询条件
type ClassQuery struct {
	SpaceID   *int64 // 空间ID筛选
	TeacherID *int64 // 教师ID筛选
	Keyword   string // 搜索关键词（匹配class_name）
	Page      int    // 页码（从1开始）
	PageSize  int    // 每页数量
	OrderBy   string // 排序字段
	OrderDesc bool   // 是否降序
}
