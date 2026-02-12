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

// templateRepositoryImpl 模板仓储实现
type templateRepositoryImpl struct {
	db *gorm.DB
}

// NewTemplateRepository 创建模板仓储实例
func NewTemplateRepository(db *gorm.DB) TemplateRepository {
	return &templateRepositoryImpl{db: db}
}

func (r *templateRepositoryImpl) Create(ctx context.Context, template *entity.Template) error {
	return r.db.WithContext(ctx).Create(template).Error
}

func (r *templateRepositoryImpl) GetByID(ctx context.Context, id int64) (*entity.Template, error) {
	var template entity.Template
	err := r.db.WithContext(ctx).First(&template, id).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *templateRepositoryImpl) Update(ctx context.Context, template *entity.Template) error {
	return r.db.WithContext(ctx).Save(template).Error
}

func (r *templateRepositoryImpl) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&entity.Template{}, id).Error
}

func (r *templateRepositoryImpl) List(ctx context.Context, query *TemplateQuery) ([]*entity.Template, int64, error) {
	var templates []*entity.Template
	var total int64

	db := r.db.WithContext(ctx).Model(&entity.Template{})

	// 应用筛选条件
	if query.SpaceID != nil {
		db = db.Where("space_id = ?", *query.SpaceID)
	}
	if query.CreatorID != nil {
		db = db.Where("creator_id = ?", *query.CreatorID)
	}
	if query.ScenarioCategory != nil {
		db = db.Where("scenario_category = ?", *query.ScenarioCategory)
	}
	if query.Visibility != nil {
		db = db.Where("visibility = ?", *query.Visibility)
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
	if err := db.Find(&templates).Error; err != nil {
		return nil, 0, err
	}

	return templates, total, nil
}

func (r *templateRepositoryImpl) GetByBotID(ctx context.Context, botID int64) (*entity.Template, error) {
	var template entity.Template
	err := r.db.WithContext(ctx).
		Where("bot_id = ?", botID).
		First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}

func (r *templateRepositoryImpl) GetBySpaceID(ctx context.Context, spaceID int64) ([]*entity.Template, error) {
	var templates []*entity.Template
	err := r.db.WithContext(ctx).
		Where("space_id = ?", spaceID).
		Order("created_at DESC").
		Find(&templates).Error
	return templates, err
}
