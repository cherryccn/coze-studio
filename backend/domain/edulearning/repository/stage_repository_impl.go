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

// stageRepositoryImpl 阶段仓储实现
type stageRepositoryImpl struct {
	db *gorm.DB
}

// NewStageRepository 创建阶段仓储实例
func NewStageRepository(db *gorm.DB) StageRepository {
	return &stageRepositoryImpl{db: db}
}

func (r *stageRepositoryImpl) Create(ctx context.Context, stage *entity.ProjectStage) error {
	return r.db.WithContext(ctx).Create(stage).Error
}

func (r *stageRepositoryImpl) BatchCreate(ctx context.Context, stages []*entity.ProjectStage) error {
	return r.db.WithContext(ctx).Create(&stages).Error
}

func (r *stageRepositoryImpl) GetByID(ctx context.Context, id int64) (*entity.ProjectStage, error) {
	var stage entity.ProjectStage
	err := r.db.WithContext(ctx).First(&stage, id).Error
	if err != nil {
		return nil, err
	}
	return &stage, nil
}

func (r *stageRepositoryImpl) Update(ctx context.Context, stage *entity.ProjectStage) error {
	return r.db.WithContext(ctx).Save(stage).Error
}

func (r *stageRepositoryImpl) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&entity.ProjectStage{}, id).Error
}

func (r *stageRepositoryImpl) GetByProjectID(ctx context.Context, projectID int64) ([]*entity.ProjectStage, error) {
	var stages []*entity.ProjectStage
	err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("stage_order ASC").
		Find(&stages).Error
	return stages, err
}

func (r *stageRepositoryImpl) GetByProjectAndOrder(ctx context.Context, projectID int64, stageOrder int) (*entity.ProjectStage, error) {
	var stage entity.ProjectStage
	err := r.db.WithContext(ctx).
		Where("project_id = ? AND stage_order = ?", projectID, stageOrder).
		First(&stage).Error
	if err != nil {
		return nil, err
	}
	return &stage, nil
}

func (r *stageRepositoryImpl) GetCurrentStage(ctx context.Context, projectID int64) (*entity.ProjectStage, error) {
	var stage entity.ProjectStage
	err := r.db.WithContext(ctx).
		Where("project_id = ? AND status = ?", projectID, entity.StageStatusInProgress).
		First(&stage).Error
	if err != nil {
		return nil, err
	}
	return &stage, nil
}

func (r *stageRepositoryImpl) CountByStatus(ctx context.Context, projectID int64, status entity.StageStatus) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&entity.ProjectStage{}).
		Where("project_id = ? AND status = ?", projectID, status).
		Count(&count).Error
	return count, err
}
