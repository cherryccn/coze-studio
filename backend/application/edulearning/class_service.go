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

package edulearning

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
	"github.com/coze-dev/coze-studio/backend/domain/edulearning/repository"
)

// ClassService 班级服务
type ClassService struct {
	classRepo repository.ClassRepository
	db        *gorm.DB
}

// CreateClassRequest 创建班级请求
type CreateClassRequest struct {
	SpaceID     int64
	TeacherID   int64
	ClassName   string
	Description *string
}

// CreateClass 创建班级
func (s *ClassService) CreateClass(ctx context.Context, req *CreateClassRequest) (*entity.Class, error) {
	class := &entity.Class{
		SpaceID:     req.SpaceID,
		TeacherID:   req.TeacherID,
		ClassName:   req.ClassName,
		Description: req.Description,
	}

	if err := s.classRepo.Create(ctx, class); err != nil {
		return nil, fmt.Errorf("create class failed: %w", err)
	}

	return class, nil
}

// GetClass 获取班级详情
func (s *ClassService) GetClass(ctx context.Context, classID int64) (*entity.Class, error) {
	return s.classRepo.GetByID(ctx, classID)
}

// UpdateClass 更新班级
func (s *ClassService) UpdateClass(ctx context.Context, class *entity.Class) error {
	return s.classRepo.Update(ctx, class)
}

// DeleteClass 删除班级
func (s *ClassService) DeleteClass(ctx context.Context, classID int64) error {
	return s.classRepo.Delete(ctx, classID)
}

// ListClasses 获取班级列表
func (s *ClassService) ListClasses(ctx context.Context, query *repository.ClassQuery) ([]*entity.Class, int64, error) {
	return s.classRepo.List(ctx, query)
}

// GetTeacherClasses 获取教师的所有班级
func (s *ClassService) GetTeacherClasses(ctx context.Context, teacherID int64, spaceID int64) ([]*entity.Class, error) {
	return s.classRepo.GetByTeacherID(ctx, teacherID, spaceID)
}

// AddClassMember 添加班级成员
func (s *ClassService) AddClassMember(ctx context.Context, classID int64, userID int64) error {
	member := &entity.ClassMember{
		ClassID: classID,
		UserID:  userID,
	}
	return s.classRepo.AddMember(ctx, member)
}

// RemoveClassMember 移除班级成员
func (s *ClassService) RemoveClassMember(ctx context.Context, classID int64, userID int64) error {
	return s.classRepo.RemoveMember(ctx, classID, userID)
}

// GetClassMembers 获取班级成员列表
func (s *ClassService) GetClassMembers(ctx context.Context, classID int64) ([]*entity.ClassMember, error) {
	return s.classRepo.GetMembers(ctx, classID)
}

// IsClassMember 检查用户是否为班级成员
func (s *ClassService) IsClassMember(ctx context.Context, classID int64, userID int64) (bool, error) {
	return s.classRepo.IsMember(ctx, classID, userID)
}

// GetUserClasses 获取用户所在的所有班级
func (s *ClassService) GetUserClasses(ctx context.Context, userID int64) ([]*entity.Class, error) {
	return s.classRepo.GetUserClasses(ctx, userID)
}
