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

	"github.com/coze-dev/coze-studio/backend/domain/educlass/entity"
)

// ClassRepository 班级仓储接口
type ClassRepository interface {
	// Create 创建班级
	Create(ctx context.Context, class *entity.Class) error

	// GetByID 根据ID获取班级
	GetByID(ctx context.Context, id int64) (*entity.Class, error)

	// GetByCode 根据班级代码获取班级
	GetByCode(ctx context.Context, code string) (*entity.Class, error)

	// GetBySpaceID 获取空间下的所有班级
	GetBySpaceID(ctx context.Context, spaceID int64) ([]*entity.Class, error)

	// GetByTeacherID 获取教师创建的班级列表
	GetByTeacherID(ctx context.Context, teacherID int64, spaceID int64) ([]*entity.Class, error)

	// GetClassesByMemberID 获取用户作为成员加入的班级列表
	GetClassesByMemberID(ctx context.Context, userID int64, spaceID int64) ([]*entity.Class, error)

	// Update 更新班级信息
	Update(ctx context.Context, class *entity.Class) error

	// Delete 删除班级（软删除）
	Delete(ctx context.Context, id int64) error

	// AddMember 添加班级成员
	AddMember(ctx context.Context, member *entity.ClassMember) error

	// BatchAddMembers 批量添加班级成员
	BatchAddMembers(ctx context.Context, members []*entity.ClassMember) error

	// GetMembers 获取班级成员列表
	GetMembers(ctx context.Context, classID int64, role string) ([]*entity.ClassMember, error)

	// GetMemberByUserID 获取用户在班级中的成员信息
	GetMemberByUserID(ctx context.Context, classID int64, userID int64) (*entity.ClassMember, error)

	// RemoveMember 移除班级成员
	RemoveMember(ctx context.Context, classID int64, userID int64) error

	// CreateInviteCode 创建邀请码
	CreateInviteCode(ctx context.Context, code *entity.ClassInviteCode) error

	// GetInviteCodeByCode 根据邀请码获取信息
	GetInviteCodeByCode(ctx context.Context, code string) (*entity.ClassInviteCode, error)

	// GetInviteCodesByClassID 获取班级的所有邀请码
	GetInviteCodesByClassID(ctx context.Context, classID int64) ([]*entity.ClassInviteCode, error)

	// UpdateInviteCode 更新邀请码
	UpdateInviteCode(ctx context.Context, code *entity.ClassInviteCode) error
}
