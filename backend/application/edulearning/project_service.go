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

// ProjectService 项目服务
type ProjectService struct {
	projectRepo repository.ProjectRepository
	stageRepo   repository.StageRepository
	chatRepo    repository.ChatRepository
	db          *gorm.DB
}

// CreateProjectRequest 创建项目请求
type CreateProjectRequest struct {
	UserID       int64
	SpaceID      int64
	ClassID      *int64
	AssignmentID *int64
	ProjectType  entity.ProjectType
	SourceID     int64
	Title        string
	Description  *string
}

// CreateProject 创建学习项目
func (s *ProjectService) CreateProject(ctx context.Context, req *CreateProjectRequest) (*entity.StudentProject, error) {
	project := &entity.StudentProject{
		UserID:       req.UserID,
		SpaceID:      req.SpaceID,
		ClassID:      req.ClassID,
		AssignmentID: req.AssignmentID,
		ProjectType:  req.ProjectType,
		SourceID:     req.SourceID,
		Title:        req.Title,
		Description:  req.Description,
		CurrentStage: 1,
		Status:       entity.ProjectStatusInProgress,
	}

	// 使用事务创建项目和初始阶段
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 创建项目
		if err := s.projectRepo.Create(ctx, project); err != nil {
			return fmt.Errorf("create project failed: %w", err)
		}

		// 如果是剧本项目，初始化阶段
		if req.ProjectType == entity.ProjectTypeScript {
			stages := []*entity.ProjectStage{
				{
					ProjectID:  project.ID,
					StageOrder: 1,
					StageName:  "概念理解",
					Status:     entity.StageStatusInProgress,
				},
				{
					ProjectID:  project.ID,
					StageOrder: 2,
					StageName:  "功能设计",
					Status:     entity.StageStatusNotStarted,
				},
				{
					ProjectID:  project.ID,
					StageOrder: 3,
					StageName:  "Bot开发",
					Status:     entity.StageStatusNotStarted,
				},
			}

			if err := s.stageRepo.BatchCreate(ctx, stages); err != nil {
				return fmt.Errorf("create stages failed: %w", err)
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return project, nil
}

// GetProject 获取项目详情
func (s *ProjectService) GetProject(ctx context.Context, projectID int64) (*entity.StudentProject, error) {
	return s.projectRepo.GetByID(ctx, projectID)
}

// ListUserProjects 获取用户的项目列表
func (s *ProjectService) ListUserProjects(ctx context.Context, userID int64, spaceID int64) ([]*entity.StudentProject, error) {
	return s.projectRepo.GetByUserID(ctx, userID, spaceID)
}

// GetProjectStages 获取项目的所有阶段
func (s *ProjectService) GetProjectStages(ctx context.Context, projectID int64) ([]*entity.ProjectStage, error) {
	return s.stageRepo.GetByProjectID(ctx, projectID)
}

// AdvanceStageRequest 推进阶段请求
type AdvanceStageRequest struct {
	ProjectID     int64
	CurrentStage  int
	OutputContent string
	Score         float64
	Feedback      string
}

// AdvanceStage 完成当前阶段并推进到下一阶段
func (s *ProjectService) AdvanceStage(ctx context.Context, req *AdvanceStageRequest) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 获取当前阶段
		currentStage, err := s.stageRepo.GetByProjectAndOrder(ctx, req.ProjectID, req.CurrentStage)
		if err != nil {
			return fmt.Errorf("get current stage failed: %w", err)
		}

		// 完成当前阶段
		currentStage.Complete(req.OutputContent, req.Score, req.Feedback)
		if err := s.stageRepo.Update(ctx, currentStage); err != nil {
			return fmt.Errorf("update current stage failed: %w", err)
		}

		// 更新项目
		project, err := s.projectRepo.GetByID(ctx, req.ProjectID)
		if err != nil {
			return fmt.Errorf("get project failed: %w", err)
		}

		// 检查是否还有下一阶段
		nextStageOrder := req.CurrentStage + 1
		nextStage, err := s.stageRepo.GetByProjectAndOrder(ctx, req.ProjectID, nextStageOrder)
		if err == nil && nextStage != nil {
			// 有下一阶段，推进
			project.AdvanceStage()
			nextStage.Start()
			if err := s.stageRepo.Update(ctx, nextStage); err != nil {
				return fmt.Errorf("start next stage failed: %w", err)
			}
		} else {
			// 没有下一阶段，标记项目完成
			project.MarkAsCompleted()
		}

		if err := s.projectRepo.Update(ctx, project); err != nil {
			return fmt.Errorf("update project failed: %w", err)
		}

		return nil
	})
}

// UpdateStageOutput 更新阶段产出内容
func (s *ProjectService) UpdateStageOutput(ctx context.Context, stageID int64, content string) error {
	stage, err := s.stageRepo.GetByID(ctx, stageID)
	if err != nil {
		return fmt.Errorf("get stage failed: %w", err)
	}

	stage.UpdateOutput(content)
	return s.stageRepo.Update(ctx, stage)
}

// SaveChatMessage 保存对话消息
func (s *ProjectService) SaveChatMessage(ctx context.Context, message *entity.ChatMessage) error {
	return s.chatRepo.Create(ctx, message)
}

// GetChatHistory 获取对话历史
func (s *ProjectService) GetChatHistory(ctx context.Context, projectID int64, stageID *int64, limit int) ([]*entity.ChatMessage, error) {
	if stageID != nil {
		return s.chatRepo.GetByStage(ctx, projectID, *stageID, limit, 0)
	}
	return s.chatRepo.GetByProjectID(ctx, projectID, limit, 0)
}

// SubmitProject 提交项目（作业）
func (s *ProjectService) SubmitProject(ctx context.Context, projectID int64) error {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return fmt.Errorf("get project failed: %w", err)
	}

	if !project.IsAssignment() {
		return fmt.Errorf("project is not an assignment")
	}

	project.MarkAsSubmitted()
	return s.projectRepo.Update(ctx, project)
}
