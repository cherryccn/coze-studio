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

// projectRepositoryImpl 项目仓储实现
type projectRepositoryImpl struct {
	db *gorm.DB
}

// NewProjectRepository 创建项目仓储实例
func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepositoryImpl{db: db}
}

func (r *projectRepositoryImpl) Create(ctx context.Context, project *entity.StudentProject) error {
	return r.db.WithContext(ctx).Create(project).Error
}

func (r *projectRepositoryImpl) GetByID(ctx context.Context, id int64) (*entity.StudentProject, error) {
	var project entity.StudentProject
	err := r.db.WithContext(ctx).First(&project, id).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *projectRepositoryImpl) Update(ctx context.Context, project *entity.StudentProject) error {
	return r.db.WithContext(ctx).Save(project).Error
}

func (r *projectRepositoryImpl) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&entity.StudentProject{}, id).Error
}

func (r *projectRepositoryImpl) List(ctx context.Context, query *ProjectQuery) ([]*entity.StudentProject, int64, error) {
	var projects []*entity.StudentProject
	var total int64

	db := r.db.WithContext(ctx).Model(&entity.StudentProject{})

	// 应用筛选条件
	if query.UserID != nil {
		db = db.Where("user_id = ?", *query.UserID)
	}
	if query.SpaceID != nil {
		db = db.Where("space_id = ?", *query.SpaceID)
	}
	if query.ClassID != nil {
		db = db.Where("class_id = ?", *query.ClassID)
	}
	if query.AssignmentID != nil {
		db = db.Where("assignment_id = ?", *query.AssignmentID)
	}
	if query.ProjectType != nil {
		db = db.Where("project_type = ?", *query.ProjectType)
	}
	if query.Status != nil {
		db = db.Where("status = ?", *query.Status)
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
	if err := db.Find(&projects).Error; err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

func (r *projectRepositoryImpl) GetByUserID(ctx context.Context, userID int64, spaceID int64) ([]*entity.StudentProject, error) {
	var projects []*entity.StudentProject
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND space_id = ?", userID, spaceID).
		Order("created_at DESC").
		Find(&projects).Error
	return projects, err
}

func (r *projectRepositoryImpl) GetByAssignment(ctx context.Context, assignmentID int64) ([]*entity.StudentProject, error) {
	var projects []*entity.StudentProject
	err := r.db.WithContext(ctx).
		Where("assignment_id = ?", assignmentID).
		Order("created_at DESC").
		Find(&projects).Error
	return projects, err
}

func (r *projectRepositoryImpl) CountByStatus(ctx context.Context, userID int64, spaceID int64, status entity.ProjectStatus) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.StudentProject{}).
		Where("user_id = ? AND space_id = ? AND status = ?", userID, spaceID, status).
		Count(&count).Error
	return count, err
}
