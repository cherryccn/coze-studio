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

	"github.com/coze-dev/coze-studio/backend/domain/educlass/entity"
	"github.com/coze-dev/coze-studio/backend/domain/educlass/repository"
)

type classRepoImpl struct {
	db *gorm.DB
}

// NewClassRepository creates a new class repository
func NewClassRepository(db *gorm.DB) repository.ClassRepository {
	return &classRepoImpl{db: db}
}

func (r *classRepoImpl) Create(ctx context.Context, class *entity.Class) error {
	return r.db.WithContext(ctx).Create(class).Error
}

func (r *classRepoImpl) GetByID(ctx context.Context, id int64) (*entity.Class, error) {
	var class entity.Class
	err := r.db.WithContext(ctx).Where("id = ? AND status != ?", id, entity.ClassStatusDeleted).First(&class).Error
	if err != nil {
		return nil, err
	}
	return &class, nil
}

func (r *classRepoImpl) GetByCode(ctx context.Context, code string) (*entity.Class, error) {
	var class entity.Class
	err := r.db.WithContext(ctx).Where("code = ? AND status != ?", code, entity.ClassStatusDeleted).First(&class).Error
	if err != nil {
		return nil, err
	}
	return &class, nil
}

func (r *classRepoImpl) GetBySpaceID(ctx context.Context, spaceID int64) ([]*entity.Class, error) {
	var classes []*entity.Class
	err := r.db.WithContext(ctx).
		Where("space_id = ? AND status != ?", spaceID, entity.ClassStatusDeleted).
		Order("created_at DESC").
		Find(&classes).Error
	return classes, err
}

func (r *classRepoImpl) GetByTeacherID(ctx context.Context, teacherID int64, spaceID int64) ([]*entity.Class, error) {
	var classes []*entity.Class
	err := r.db.WithContext(ctx).
		Where("teacher_id = ? AND space_id = ? AND status != ?", teacherID, spaceID, entity.ClassStatusDeleted).
		Order("created_at DESC").
		Find(&classes).Error
	return classes, err
}

func (r *classRepoImpl) GetClassesByMemberID(ctx context.Context, userID int64, spaceID int64) ([]*entity.Class, error) {
	var classes []*entity.Class
	err := r.db.WithContext(ctx).
		Table("edu_classes").
		Joins("JOIN edu_class_members ON edu_classes.id = edu_class_members.class_id").
		Where("edu_class_members.user_id = ? AND edu_classes.space_id = ? AND edu_classes.status != ?",
			userID, spaceID, entity.ClassStatusDeleted).
		Order("edu_class_members.joined_at DESC").
		Find(&classes).Error
	return classes, err
}

func (r *classRepoImpl) Update(ctx context.Context, class *entity.Class) error {
	return r.db.WithContext(ctx).Save(class).Error
}

func (r *classRepoImpl) Delete(ctx context.Context, id int64) error {
	// Soft delete: set status to deleted
	return r.db.WithContext(ctx).Model(&entity.Class{}).
		Where("id = ?", id).
		Update("status", entity.ClassStatusDeleted).Error
}

func (r *classRepoImpl) AddMember(ctx context.Context, member *entity.ClassMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *classRepoImpl) BatchAddMembers(ctx context.Context, members []*entity.ClassMember) error {
	if len(members) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).CreateInBatches(members, 100).Error
}

func (r *classRepoImpl) GetMembers(ctx context.Context, classID int64, role string) ([]*entity.ClassMember, error) {
	var members []*entity.ClassMember
	db := r.db.WithContext(ctx).Where("class_id = ?", classID)
	if role != "" {
		db = db.Where("role = ?", role)
	}
	err := db.Order("joined_at DESC").Find(&members).Error
	return members, err
}

func (r *classRepoImpl) GetMemberByUserID(ctx context.Context, classID int64, userID int64) (*entity.ClassMember, error) {
	var member entity.ClassMember
	err := r.db.WithContext(ctx).Where("class_id = ? AND user_id = ?", classID, userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *classRepoImpl) RemoveMember(ctx context.Context, classID int64, userID int64) error {
	return r.db.WithContext(ctx).
		Where("class_id = ? AND user_id = ?", classID, userID).
		Delete(&entity.ClassMember{}).Error
}

func (r *classRepoImpl) CreateInviteCode(ctx context.Context, code *entity.ClassInviteCode) error {
	return r.db.WithContext(ctx).Create(code).Error
}

func (r *classRepoImpl) GetInviteCodeByCode(ctx context.Context, code string) (*entity.ClassInviteCode, error) {
	var inviteCode entity.ClassInviteCode
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&inviteCode).Error
	if err != nil {
		return nil, err
	}
	return &inviteCode, nil
}

func (r *classRepoImpl) GetInviteCodesByClassID(ctx context.Context, classID int64) ([]*entity.ClassInviteCode, error) {
	var codes []*entity.ClassInviteCode
	err := r.db.WithContext(ctx).
		Where("class_id = ?", classID).
		Order("created_at DESC").
		Find(&codes).Error
	return codes, err
}

func (r *classRepoImpl) UpdateInviteCode(ctx context.Context, code *entity.ClassInviteCode) error {
	return r.db.WithContext(ctx).Save(code).Error
}
