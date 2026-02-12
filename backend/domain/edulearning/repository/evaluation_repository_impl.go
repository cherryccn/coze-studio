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

// evaluationRepositoryImpl 评估仓储实现
type evaluationRepositoryImpl struct {
	db *gorm.DB
}

// NewEvaluationRepository 创建评估仓储实例
func NewEvaluationRepository(db *gorm.DB) EvaluationRepository {
	return &evaluationRepositoryImpl{db: db}
}

func (r *evaluationRepositoryImpl) Create(ctx context.Context, evaluation *entity.Evaluation) error {
	return r.db.WithContext(ctx).Create(evaluation).Error
}

func (r *evaluationRepositoryImpl) GetByID(ctx context.Context, id int64) (*entity.Evaluation, error) {
	var evaluation entity.Evaluation
	err := r.db.WithContext(ctx).First(&evaluation, id).Error
	if err != nil {
		return nil, err
	}
	return &evaluation, nil
}

func (r *evaluationRepositoryImpl) Update(ctx context.Context, evaluation *entity.Evaluation) error {
	return r.db.WithContext(ctx).Save(evaluation).Error
}

func (r *evaluationRepositoryImpl) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&entity.Evaluation{}, id).Error
}

func (r *evaluationRepositoryImpl) GetByProjectID(ctx context.Context, projectID int64) ([]*entity.Evaluation, error) {
	var evaluations []*entity.Evaluation
	err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("evaluated_at DESC").
		Find(&evaluations).Error
	return evaluations, err
}

func (r *evaluationRepositoryImpl) GetLatestByProject(ctx context.Context, projectID int64) (*entity.Evaluation, error) {
	var evaluation entity.Evaluation
	err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("evaluated_at DESC").
		First(&evaluation).Error
	if err != nil {
		return nil, err
	}
	return &evaluation, nil
}

func (r *evaluationRepositoryImpl) GetByType(ctx context.Context, projectID int64, evaluationType entity.EvaluationType) ([]*entity.Evaluation, error) {
	var evaluations []*entity.Evaluation
	err := r.db.WithContext(ctx).
		Where("project_id = ? AND evaluation_type = ?", projectID, evaluationType).
		Order("evaluated_at DESC").
		Find(&evaluations).Error
	return evaluations, err
}

func (r *evaluationRepositoryImpl) GetAIEvaluation(ctx context.Context, projectID int64) (*entity.Evaluation, error) {
	var evaluation entity.Evaluation
	err := r.db.WithContext(ctx).
		Where("project_id = ? AND evaluation_type = ?", projectID, entity.EvaluationTypeAI).
		Order("evaluated_at DESC").
		First(&evaluation).Error
	if err != nil {
		return nil, err
	}
	return &evaluation, nil
}

func (r *evaluationRepositoryImpl) GetTeacherEvaluation(ctx context.Context, projectID int64) (*entity.Evaluation, error) {
	var evaluation entity.Evaluation
	err := r.db.WithContext(ctx).
		Where("project_id = ? AND evaluation_type = ?", projectID, entity.EvaluationTypeTeacher).
		Order("evaluated_at DESC").
		First(&evaluation).Error
	if err != nil {
		return nil, err
	}
	return &evaluation, nil
}

func (r *evaluationRepositoryImpl) List(ctx context.Context, query *EvaluationQuery) ([]*entity.Evaluation, int64, error) {
	var evaluations []*entity.Evaluation
	var total int64

	db := r.db.WithContext(ctx).Model(&entity.Evaluation{})

	// 应用筛选条件
	if query.ProjectID != nil {
		db = db.Where("project_id = ?", *query.ProjectID)
	}
	if query.UserID != nil {
		db = db.Where("user_id = ?", *query.UserID)
	}
	if query.EvaluationType != nil {
		db = db.Where("evaluation_type = ?", *query.EvaluationType)
	}
	if query.EvaluatorID != nil {
		db = db.Where("evaluator_id = ?", *query.EvaluatorID)
	}

	// 统计总数
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 应用排序
	orderBy := "evaluated_at"
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
	if err := db.Find(&evaluations).Error; err != nil {
		return nil, 0, err
	}

	return evaluations, total, nil
}
