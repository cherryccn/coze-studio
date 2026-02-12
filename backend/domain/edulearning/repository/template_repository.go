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

// TemplateRepository Bot模板仓储接口
type TemplateRepository interface {
	// Create 创建模板
	Create(ctx context.Context, template *entity.Template) error

	// GetByID 根据ID获取模板
	GetByID(ctx context.Context, id int64) (*entity.Template, error)

	// Update 更新模板
	Update(ctx context.Context, template *entity.Template) error

	// Delete 删除模板（软删除）
	Delete(ctx context.Context, id int64) error

	// List 获取模板列表
	List(ctx context.Context, query *TemplateQuery) ([]*entity.Template, int64, error)

	// GetByBotID 根据Bot ID获取模板
	GetByBotID(ctx context.Context, botID int64) (*entity.Template, error)

	// GetBySpaceID 获取空间下的所有模板
	GetBySpaceID(ctx context.Context, spaceID int64) ([]*entity.Template, error)
}

// TemplateQuery 模板查询条件
type TemplateQuery struct {
	SpaceID          *int64  // 空间ID筛选
	CreatorID        *int64  // 创建者ID筛选
	ScenarioCategory *string // 场景类别筛选
	Visibility       *string // 可见性筛选
	Keyword          string  // 搜索关键词（匹配title）
	Page             int     // 页码（从1开始）
	PageSize         int     // 每页数量
	OrderBy          string  // 排序字段
	OrderDesc        bool    // 是否降序
}
