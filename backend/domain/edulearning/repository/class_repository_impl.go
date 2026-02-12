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

// classRepositoryImpl 班级仓储实现
type classRepositoryImpl struct {
	db *gorm.DB
}

// NewClassRepository 创建班级仓储实例
func NewClassRepository(db *gorm.DB) ClassRepository {
	return &classRepositoryImpl{db: db}
}

func (r *classRepositoryImpl) Create(ctx context.Context, class *entity.Class) error {
	return r.db.WithContext(ctx).Create(class).Error
}

func (r *classRepositoryImpl) GetByID(ctx context.Context, id int64) (*entity.Class, error) {
	var class entity.Class
	err := r.db.WithContext(ctx).First(&class, id).Error
	if err != nil {
		return nil, err
	}
	return &class, nil
}

func (r *classRepositoryImpl) Update(ctx context.Context, class *entity.Class) error {
	return r.db.WithContext(ctx).Save(class).Error
}

func (r *classRepositoryImpl) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&entity.Class{}, id).Error
}

func (r *classRepositoryImpl) List(ctx context.Context, query *ClassQuery) ([]*entity.Class, int64, error) {
	var classes []*entity.Class
	var total int64

	db := r.db.WithContext(ctx).Model(&entity.Class{})

	// 应用筛选条件
	if query.SpaceID != nil {
		db = db.Where("space_id = ?", *query.SpaceID)
	}
	if query.TeacherID != nil {
		db = db.Where("teacher_id = ?", *query.TeacherID)
	}
	if query.Keyword != "" {
		db = db.Where("class_name LIKE ?", "%"+query.Keyword+"%")
	}

	// 统计总数
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 应用排序
	orderBy := "created_at"
	if query.OrderBy != "" {
		orderBy = query.OrderBy
	}
	if query.OrderDesc {
		db = db.Order(orderBy + " DESC")
	} else {
		db = db.Order(orderBy + " ASC")
	}

	// 应用分页
	if query.Page > 0 && query.PageSize > 0 {
		offset := (query.Page - 1) * query.PageSize
		db = db.Offset(offset).Limit(query.PageSize)
	}

	// 查询数据
	if err := db.Find(&classes).Error; err != nil {
		return nil, 0, err
	}

	return classes, total, nil
}

func (r *classRepositoryImpl) GetByTeacherID(ctx context.Context, teacherID int64, spaceID int64) ([]*entity.Class, error) {
	var classes []*entity.Class
	err := r.db.WithContext(ctx).
		Where("teacher_id = ? AND space_id = ?", teacherID, spaceID).
		Order("created_at DESC").
		Find(&classes).Error
	return classes, err
}

func (r *classRepositoryImpl) AddMember(ctx context.Context, member *entity.ClassMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *classRepositoryImpl) RemoveMember(ctx context.Context, classID int64, userID int64) error {
	return r.db.WithContext(ctx).
		Where("class_id = ? AND user_id = ?", classID, userID).
		Delete(&entity.ClassMember{}).Error
}

func (r *classRepositoryImpl) GetMembers(ctx context.Context, classID int64) ([]*entity.ClassMember, error) {
	var members []*entity.ClassMember
	err := r.db.WithContext(ctx).
		Where("class_id = ?", classID).
		Order("joined_at ASC").
		Find(&members).Error
	return members, err
}

func (r *classRepositoryImpl) IsMember(ctx context.Context, classID int64, userID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.ClassMember{}).
		Where("class_id = ? AND user_id = ?", classID, userID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *classRepositoryImpl) CountMembers(ctx context.Context, classID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.ClassMember{}).
		Where("class_id = ?", classID).
		Count(&count).Error
	return count, err
}

func (r *classRepositoryImpl) GetUserClasses(ctx context.Context, userID int64) ([]*entity.Class, error) {
	var classes []*entity.Class
	err := r.db.WithContext(ctx).
		Table("edu_classes c").
		Joins("INNER JOIN edu_class_members m ON c.id = m.class_id").
		Where("m.user_id = ?", userID).
		Order("c.created_at DESC").
		Find(&classes).Error
	return classes, err
}
