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

	"github.com/coze-dev/coze-studio/backend/domain/eduscript/entity"
	"github.com/coze-dev/coze-studio/backend/domain/eduscript/repository"
)

type scriptRepoImpl struct {
	db *gorm.DB
}

// NewScriptRepository creates a new script repository
func NewScriptRepository(db *gorm.DB) repository.ScriptRepository {
	return &scriptRepoImpl{db: db}
}

func (r *scriptRepoImpl) GetByID(ctx context.Context, id int64) (*entity.Script, error) {
	var script entity.Script
	err := r.db.WithContext(ctx).Where("id = ? AND status = 1", id).First(&script).Error
	if err != nil {
		return nil, err
	}
	return &script, nil
}

func (r *scriptRepoImpl) List(ctx context.Context, query *repository.ScriptQuery) ([]*entity.Script, int64, error) {
	var scripts []*entity.Script
	var total int64

	db := r.db.WithContext(ctx).Model(&entity.Script{}).Where("status = 1")

	// Keyword search
	if query.Keyword != "" {
		keyword := "%" + query.Keyword + "%"
		db = db.Where("name LIKE ? OR description LIKE ?", keyword, keyword)
	}

	// Difficulty filter
	if query.Difficulty != nil {
		db = db.Where("difficulty = ?", *query.Difficulty)
	}

	// Count total
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pagination
	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// Fetch data
	if err := db.Offset(offset).Limit(pageSize).Find(&scripts).Error; err != nil {
		return nil, 0, err
	}

	return scripts, total, nil
}

func (r *scriptRepoImpl) Create(ctx context.Context, script *entity.Script) error {
	return r.db.WithContext(ctx).Create(script).Error
}

func (r *scriptRepoImpl) Update(ctx context.Context, script *entity.Script) error {
	return r.db.WithContext(ctx).Save(script).Error
}

func (r *scriptRepoImpl) Delete(ctx context.Context, id int64) error {
	// Soft delete: set status to 0
	return r.db.WithContext(ctx).Model(&entity.Script{}).
		Where("id = ?", id).
		Update("status", 0).Error
}
