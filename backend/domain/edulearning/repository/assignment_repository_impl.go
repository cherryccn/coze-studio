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
	"time"

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
)

// assignmentRepositoryImpl 作业仓储实现
type assignmentRepositoryImpl struct {
	db *gorm.DB
}

// NewAssignmentRepository 创建作业仓储实例
func NewAssignmentRepository(db *gorm.DB) AssignmentRepository {
	return &assignmentRepositoryImpl{db: db}
}

func (r *assignmentRepositoryImpl) Create(ctx context.Context, assignment *entity.Assignment) error {
	return r.db.WithContext(ctx).Create(assignment).Error
}

func (r *assignmentRepositoryImpl) GetByID(ctx context.Context, id int64) (*entity.Assignment, error) {
	var assignment entity.Assignment
	err := r.db.WithContext(ctx).First(&assignment, id).Error
	if err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (r *assignmentRepositoryImpl) Update(ctx context.Context, assignment *entity.Assignment) error {
	return r.db.WithContext(ctx).Save(assignment).Error
}

func (r *assignmentRepositoryImpl) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&entity.Assignment{}, id).Error
}

func (r *assignmentRepositoryImpl) List(ctx context.Context, query *AssignmentQuery) ([]*entity.Assignment, int64, error) {
	var assignments []*entity.Assignment
	var total int64

	db := r.db.WithContext(ctx).Model(&entity.Assignment{})

	// 应用筛选条件
	if query.ClassID != nil {
		db = db.Where("class_id = ?", *query.ClassID)
	}
	if query.TeacherID != nil {
		db = db.Where("teacher_id = ?", *query.TeacherID)
	}
	if query.AssignmentType != nil {
		db = db.Where("assignment_type = ?", *query.AssignmentType)
	}
	if query.Keyword != "" {
		db = db.Where("title LIKE ?", "%"+query.Keyword+"%")
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
	if err := db.Find(&assignments).Error; err != nil {
		return nil, 0, err
	}

	return assignments, total, nil
}

func (r *assignmentRepositoryImpl) GetByClassID(ctx context.Context, classID int64) ([]*entity.Assignment, error) {
	var assignments []*entity.Assignment
	err := r.db.WithContext(ctx).
		Where("class_id = ?", classID).
		Order("created_at DESC").
		Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepositoryImpl) GetByTeacherID(ctx context.Context, teacherID int64) ([]*entity.Assignment, error) {
	var assignments []*entity.Assignment
	err := r.db.WithContext(ctx).
		Where("teacher_id = ?", teacherID).
		Order("created_at DESC").
		Find(&assignments).Error
	return assignments, err
}

func (r *assignmentRepositoryImpl) CountByClass(ctx context.Context, classID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.Assignment{}).
		Where("class_id = ?", classID).
		Count(&count).Error
	return count, err
}

func (r *assignmentRepositoryImpl) GetUpcoming(ctx context.Context, classID int64, days int) ([]*entity.Assignment, error) {
	var assignments []*entity.Assignment
	futureDate := time.Now().AddDate(0, 0, days)
	err := r.db.WithContext(ctx).
		Where("class_id = ? AND due_date IS NOT NULL AND due_date <= ?", classID, futureDate).
		Order("due_date ASC").
		Find(&assignments).Error
	return assignments, err
}
