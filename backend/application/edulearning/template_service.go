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

package edulearning

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
	"github.com/coze-dev/coze-studio/backend/domain/edulearning/repository"
)

// TemplateService 模板服务
type TemplateService struct {
	templateRepo repository.TemplateRepository
	db           *gorm.DB
}

// CreateTemplateRequest 创建模板请求
type CreateTemplateRequest struct {
	SpaceID            int64
	CreatorID          int64
	BotID              int64
	Title              string
	Description        *string
	Visibility         string
	ScenarioCategory   string
	CustomizationGuide *string
}

// CreateTemplate 创建模板
func (s *TemplateService) CreateTemplate(ctx context.Context, req *CreateTemplateRequest) (*entity.Template, error) {
	template := &entity.Template{
		SpaceID:            req.SpaceID,
		CreatorID:          req.CreatorID,
		BotID:              req.BotID,
		Title:              req.Title,
		Description:        req.Description,
		Visibility:         req.Visibility,
		ScenarioCategory:   req.ScenarioCategory,
		CustomizationGuide: req.CustomizationGuide,
	}

	if err := s.templateRepo.Create(ctx, template); err != nil {
		return nil, fmt.Errorf("create template failed: %w", err)
	}

	return template, nil
}

// GetTemplate 获取模板详情
func (s *TemplateService) GetTemplate(ctx context.Context, templateID int64) (*entity.Template, error) {
	return s.templateRepo.GetByID(ctx, templateID)
}

// UpdateTemplate 更新模板
func (s *TemplateService) UpdateTemplate(ctx context.Context, template *entity.Template) error {
	return s.templateRepo.Update(ctx, template)
}

// DeleteTemplate 删除模板
func (s *TemplateService) DeleteTemplate(ctx context.Context, templateID int64) error {
	return s.templateRepo.Delete(ctx, templateID)
}

// ListTemplates 获取模板列表
func (s *TemplateService) ListTemplates(ctx context.Context, query *repository.TemplateQuery) ([]*entity.Template, int64, error) {
	return s.templateRepo.List(ctx, query)
}

// GetSpaceTemplates 获取空间下的所有模板
func (s *TemplateService) GetSpaceTemplates(ctx context.Context, spaceID int64) ([]*entity.Template, error) {
	return s.templateRepo.GetBySpaceID(ctx, spaceID)
}
