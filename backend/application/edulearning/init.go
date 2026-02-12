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

	"gorm.io/gorm"

	"github.com/coze-dev/coze-studio/backend/domain/edulearning/repository"
)

// ServiceComponents 服务组件
type ServiceComponents struct {
	DB *gorm.DB
}

// Services 所有教育平台服务
type Services struct {
	Project    *ProjectService
	Evaluation *EvaluationService
	Template   *TemplateService
	Class      *ClassService
	Assignment *AssignmentService
}

// InitServices 初始化所有服务
func InitServices(ctx context.Context, components *ServiceComponents) *Services {
	// 初始化 Repositories
	projectRepo := repository.NewProjectRepository(components.DB)
	stageRepo := repository.NewStageRepository(components.DB)
	chatRepo := repository.NewChatRepository(components.DB)
	evaluationRepo := repository.NewEvaluationRepository(components.DB)
	templateRepo := repository.NewTemplateRepository(components.DB)
	classRepo := repository.NewClassRepository(components.DB)
	assignmentRepo := repository.NewAssignmentRepository(components.DB)

	// 初始化 Services
	projectService := &ProjectService{
		projectRepo: projectRepo,
		stageRepo:   stageRepo,
		chatRepo:    chatRepo,
		db:          components.DB,
	}

	evaluationService := &EvaluationService{
		evaluationRepo: evaluationRepo,
		projectRepo:    projectRepo,
		stageRepo:      stageRepo,
		db:             components.DB,
	}

	templateService := &TemplateService{
		templateRepo: templateRepo,
		db:           components.DB,
	}

	classService := &ClassService{
		classRepo: classRepo,
		db:        components.DB,
	}

	assignmentService := &AssignmentService{
		assignmentRepo: assignmentRepo,
		projectRepo:    projectRepo,
		classRepo:      classRepo,
		db:             components.DB,
	}

	return &Services{
		Project:    projectService,
		Evaluation: evaluationService,
		Template:   templateService,
		Class:      classService,
		Assignment: assignmentService,
	}
}
