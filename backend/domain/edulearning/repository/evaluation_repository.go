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

// EvaluationRepository 评估结果仓储接口
type EvaluationRepository interface {
	// Create 创建评估结果
	Create(ctx context.Context, evaluation *entity.Evaluation) error

	// GetByID 根据ID获取评估结果
	GetByID(ctx context.Context, id int64) (*entity.Evaluation, error)

	// Update 更新评估结果
	Update(ctx context.Context, evaluation *entity.Evaluation) error

	// Delete 删除评估结果
	Delete(ctx context.Context, id int64) error

	// GetByProjectID 获取项目的所有评估结果
	GetByProjectID(ctx context.Context, projectID int64) ([]*entity.Evaluation, error)

	// GetLatestByProject 获取项目的最新评估结果
	GetLatestByProject(ctx context.Context, projectID int64) (*entity.Evaluation, error)

	// GetByType 获取指定类型的评估结果
	GetByType(ctx context.Context, projectID int64, evaluationType entity.EvaluationType) ([]*entity.Evaluation, error)

	// GetAIEvaluation 获取AI评估结果
	GetAIEvaluation(ctx context.Context, projectID int64) (*entity.Evaluation, error)

	// GetTeacherEvaluation 获取教师评估结果
	GetTeacherEvaluation(ctx context.Context, projectID int64) (*entity.Evaluation, error)

	// List 获取评估结果列表
	List(ctx context.Context, query *EvaluationQuery) ([]*entity.Evaluation, int64, error)
}

// EvaluationQuery 评估结果查询条件
type EvaluationQuery struct {
	ProjectID      *int64                   // 项目ID筛选
	UserID         *int64                   // 用户ID筛选
	EvaluationType *entity.EvaluationType   // 评估类型筛选
	EvaluatorID    *int64                   // 评估者ID筛选
	Page           int                      // 页码（从1开始）
	PageSize       int                      // 每页数量
	OrderBy        string                   // 排序字段
	OrderDesc      bool                     // 是否降序
}
