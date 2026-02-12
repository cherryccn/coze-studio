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

// EvaluationService 评估服务
type EvaluationService struct {
	evaluationRepo repository.EvaluationRepository
	projectRepo    repository.ProjectRepository
	stageRepo      repository.StageRepository
	db             *gorm.DB
	aiEvaluator    *AIEvaluator
}

// AIEvaluationRequest AI评估请求
type AIEvaluationRequest struct {
	ProjectID       int64
	UserID          int64
	StageOrder      int
	StageName       string
	OutputContent   string
	ScriptTitle     string
	StageGoal       string
}

// CreateAIEvaluation 创建AI评估
func (s *EvaluationService) CreateAIEvaluation(ctx context.Context, req *AIEvaluationRequest) (*entity.Evaluation, error) {
	// 使用 AI 评估器评估内容
	evalResult, err := s.aiEvaluator.EvaluateStageOutput(ctx, &StageEvaluationRequest{
		ProjectID:     req.ProjectID,
		StageOrder:    req.StageOrder,
		StageName:     req.StageName,
		OutputContent: req.OutputContent,
		ScriptTitle:   req.ScriptTitle,
		StageGoal:     req.StageGoal,
	})

	if err != nil {
		return nil, fmt.Errorf("AI evaluation failed: %w", err)
	}

	// 创建评估记录
	evaluation := &entity.Evaluation{
		ProjectID:       req.ProjectID,
		UserID:          req.UserID,
		EvaluationType:  entity.EvaluationTypeAI,
		DimensionScores: evalResult.DimensionScores,
		TotalScore:      evalResult.TotalScore,
		MaxScore:        100.0,
		Feedback:        &evalResult.Feedback,
		Strengths:       evalResult.Strengths,
		Improvements:    evalResult.Improvements,
	}

	if err := s.evaluationRepo.Create(ctx, evaluation); err != nil {
		return nil, fmt.Errorf("create evaluation failed: %w", err)
	}

	return evaluation, nil
}

// TeacherEvaluationRequest 教师评估请求
type TeacherEvaluationRequest struct {
	ProjectID       int64
	UserID          int64
	EvaluatorID     int64
	DimensionScores map[string]entity.DimensionScore
	Feedback        string
	Strengths       []string
	Improvements    []string
}

// CreateTeacherEvaluation 创建教师评估
func (s *EvaluationService) CreateTeacherEvaluation(ctx context.Context, req *TeacherEvaluationRequest) (*entity.Evaluation, error) {
	// 计算总分
	totalScore := calculateWeightedScore(req.DimensionScores)

	evaluation := &entity.Evaluation{
		ProjectID:       req.ProjectID,
		UserID:          req.UserID,
		EvaluationType:  entity.EvaluationTypeTeacher,
		EvaluatorID:     &req.EvaluatorID,
		DimensionScores: req.DimensionScores,
		TotalScore:      totalScore,
		MaxScore:        100.0,
		Feedback:        &req.Feedback,
		Strengths:       req.Strengths,
		Improvements:    req.Improvements,
	}

	// 使用事务创建评估并更新项目
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := s.evaluationRepo.Create(ctx, evaluation); err != nil {
			return fmt.Errorf("create evaluation failed: %w", err)
		}

		// 更新项目的教师评分
		project, err := s.projectRepo.GetByID(ctx, req.ProjectID)
		if err != nil {
			return fmt.Errorf("get project failed: %w", err)
		}

		project.SetTeacherScore(totalScore, req.Feedback)
		if err := s.projectRepo.Update(ctx, project); err != nil {
			return fmt.Errorf("update project failed: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return evaluation, nil
}

// GetProjectEvaluations 获取项目的所有评估
func (s *EvaluationService) GetProjectEvaluations(ctx context.Context, projectID int64) ([]*entity.Evaluation, error) {
	return s.evaluationRepo.GetByProjectID(ctx, projectID)
}

// GetLatestEvaluation 获取项目最新评估
func (s *EvaluationService) GetLatestEvaluation(ctx context.Context, projectID int64) (*entity.Evaluation, error) {
	return s.evaluationRepo.GetLatestByProject(ctx, projectID)
}

// calculateWeightedScore 计算加权总分
func calculateWeightedScore(dimensionScores map[string]entity.DimensionScore) float64 {
	var totalScore float64
	for _, dimension := range dimensionScores {
		// 加权分数 = (得分 / 满分) * 权重 * 100
		weightedScore := (dimension.Score / dimension.MaxScore) * dimension.Weight * 100
		totalScore += weightedScore
	}
	return totalScore
}

// generateAIFeedback 生成AI综合反馈
func generateAIFeedback(totalScore float64, dimensions map[string]entity.DimensionScore, strengths, improvements []string) string {
	feedback := fmt.Sprintf("综合评分：%.1f分\n\n", totalScore)

	feedback += "各维度得分：\n"
	for _, dimension := range dimensions {
		feedback += fmt.Sprintf("- %s: %.1f/%.1f\n", dimension.Name, dimension.Score, dimension.MaxScore)
	}

	feedback += "\n优点：\n"
	for i, strength := range strengths {
		feedback += fmt.Sprintf("%d. %s\n", i+1, strength)
	}

	feedback += "\n改进建议：\n"
	for i, improvement := range improvements {
		feedback += fmt.Sprintf("%d. %s\n", i+1, improvement)
	}

	return feedback
}

// ptr 辅助函数：创建字符串指针
func ptr(s string) *string {
	return &s
}
