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

	"github.com/coze-dev/coze-studio/backend/domain/eduscript/entity"
)

// ScriptRepository 剧本仓储接口
type ScriptRepository interface {
	// GetByID 根据ID获取剧本
	GetByID(ctx context.Context, id int64) (*entity.Script, error)

	// List 获取剧本列表
	List(ctx context.Context, query *ScriptQuery) ([]*entity.Script, int64, error)

	// Create 创建剧本
	Create(ctx context.Context, script *entity.Script) error

	// Update 更新剧本
	Update(ctx context.Context, script *entity.Script) error

	// Delete 删除剧本（软删除）
	Delete(ctx context.Context, id int64) error
}

// ScriptQuery 剧本查询条件
type ScriptQuery struct {
	Keyword    string // 搜索关键词（匹配name或description）
	Difficulty *int8  // 难度筛选
	Status     *int8  // 状态筛选
	Page       int    // 页码（从1开始）
	PageSize   int    // 每页数量
}
