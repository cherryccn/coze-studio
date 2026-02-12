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

package edu

import (
	"context"
	"fmt"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"

	eduapp "github.com/coze-dev/coze-studio/backend/application/edulearning"
	edumodel "github.com/coze-dev/coze-studio/backend/api/model/edu"
	"github.com/coze-dev/coze-studio/backend/domain/edulearning/entity"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
)

var eduServices *eduapp.Services

// InitEduServices 初始化教育平台服务
func InitEduServices() error {
	if db == nil {
		if err := InitDB(); err != nil {
			return fmt.Errorf("init database failed: %w", err)
		}
	}

	components := &eduapp.ServiceComponents{
		DB: db,
	}

	eduServices = eduapp.InitServices(context.Background(), components)
	logs.Infof("[edu] Services initialized successfully")
	return nil
}

// ========== Additional Project Handlers ==========

// GetProject 获取项目详情
// @router /api/space/:space_id/edu/projects/:project_id [GET]
func GetProject(ctx context.Context, c *app.RequestContext) {
	projectIDStr := c.Param("project_id")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetProjectResponse{
			BaseResponse: edumodel.BaseResponse{Code: 400, Msg: "invalid project_id"},
		})
		return
	}

	project, err := eduServices.Project.GetProject(ctx, projectID)
	if err != nil {
		logs.Errorf("[GetProject] Failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.GetProjectResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "get project failed"},
		})
		return
	}

	// Get stages
	stages, _ := eduServices.Project.GetProjectStages(ctx, projectID)

	// Get evaluations
	evaluations, _ := eduServices.Evaluation.GetProjectEvaluations(ctx, projectID)

	detail := &edumodel.ProjectDetail{
		ProjectInfo:  convertProjectToInfo(project),
		Stages:       convertStagesToInfo(stages),
		Evaluations:  convertEvaluationsToInfo(evaluations),
	}

	c.JSON(consts.StatusOK, edumodel.GetProjectResponse{
		BaseResponse: edumodel.BaseResponse{Code: 0, Msg: "success"},
		Data:         detail,
	})
}

// ListProjects 获取项目列表
// @router /api/space/:space_id/edu/projects [GET]
func ListProjects(ctx context.Context, c *app.RequestContext) {
	var req edumodel.ListProjectsRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.ListProjectsResponse{
			BaseResponse: edumodel.BaseResponse{Code: 400, Msg: err.Error()},
		})
		return
	}

	userID := getUserID(c)
	spaceIDStr := c.Param("space_id")
	spaceID, _ := strconv.ParseInt(spaceIDStr, 10, 64)

	// Get user's projects
	projects, err := eduServices.Project.ListUserProjects(ctx, userID, spaceID)
	if err != nil {
		logs.Errorf("[ListProjects] Failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.ListProjectsResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "list projects failed"},
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.ListProjectsResponse{
		BaseResponse: edumodel.BaseResponse{Code: 0, Msg: "success"},
		Data: &edumodel.ProjectListData{
			List:     convertProjectsToInfo(projects),
			Total:    int64(len(projects)),
			Page:     req.Page,
			PageSize: req.PageSize,
		},
	})
}

// UpdateStageOutput 更新阶段产出
// @router /api/space/:space_id/edu/stages/output [PUT]
func UpdateStageOutput(ctx context.Context, c *app.RequestContext) {
	var req edumodel.UpdateStageOutputRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.UpdateStageOutputResponse{
			BaseResponse: edumodel.BaseResponse{Code: 400, Msg: err.Error()},
		})
		return
	}

	err := eduServices.Project.UpdateStageOutput(ctx, req.StageID, req.Content)
	if err != nil {
		logs.Errorf("[UpdateStageOutput] Failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.UpdateStageOutputResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "update stage output failed"},
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.UpdateStageOutputResponse{
		BaseResponse: edumodel.BaseResponse{Code: 0, Msg: "success"},
	})
}

// CompleteStage 完成阶段
// @router /api/space/:space_id/edu/stages/complete [POST]
func CompleteStage(ctx context.Context, c *app.RequestContext) {
	var req edumodel.CompleteStageRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CompleteStageResponse{
			BaseResponse: edumodel.BaseResponse{Code: 400, Msg: err.Error()},
		})
		return
	}

	userID := getUserID(c)

	// Create AI evaluation
	evaluation, err := eduServices.Evaluation.CreateAIEvaluation(ctx, &eduapp.AIEvaluationRequest{
		ProjectID:     req.ProjectID,
		UserID:        userID,
		OutputContent: req.OutputContent,
	})

	if err != nil {
		logs.Errorf("[CompleteStage] AI evaluation failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.CompleteStageResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "AI evaluation failed"},
		})
		return
	}

	// Advance to next stage
	err = eduServices.Project.AdvanceStage(ctx, &eduapp.AdvanceStageRequest{
		ProjectID:     req.ProjectID,
		CurrentStage:  req.StageOrder,
		OutputContent: req.OutputContent,
		Score:         evaluation.TotalScore,
		Feedback:      *evaluation.Feedback,
	})

	if err != nil {
		logs.Errorf("[CompleteStage] Advance stage failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.CompleteStageResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "advance stage failed"},
		})
		return
	}

	nextStage := req.StageOrder + 1
	c.JSON(consts.StatusOK, edumodel.CompleteStageResponse{
		BaseResponse: edumodel.BaseResponse{Code: 0, Msg: "success"},
		Data: &edumodel.StageCompletionData{
			Score:      evaluation.TotalScore,
			Feedback:   *evaluation.Feedback,
			NextStage:  &nextStage,
			Evaluation: convertEvaluationToInfo(evaluation),
		},
	})
}

// ========== Evaluation Handlers ==========

// CreateTeacherEvaluation 创建教师评估
// @router /api/space/:space_id/edu/evaluations [POST]
func CreateTeacherEvaluation(ctx context.Context, c *app.RequestContext) {
	var req edumodel.CreateTeacherEvaluationRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.CreateTeacherEvaluationResponse{
			BaseResponse: edumodel.BaseResponse{Code: 400, Msg: err.Error()},
		})
		return
	}

	teacherID := getUserID(c)

	// Get project to get user_id
	project, err := eduServices.Project.GetProject(ctx, req.ProjectID)
	if err != nil {
		c.JSON(consts.StatusInternalServerError, edumodel.CreateTeacherEvaluationResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "get project failed"},
		})
		return
	}

	// Convert dimension scores
	dimensionScores := make(map[string]entity.DimensionScore)
	for key, val := range req.DimensionScores {
		dimensionScores[key] = entity.DimensionScore{
			Name:     val.Name,
			Score:    val.Score,
			MaxScore: val.MaxScore,
			Weight:   val.Weight,
			Feedback: val.Feedback,
		}
	}

	evaluation, err := eduServices.Evaluation.CreateTeacherEvaluation(ctx, &eduapp.TeacherEvaluationRequest{
		ProjectID:       req.ProjectID,
		UserID:          project.UserID,
		EvaluatorID:     teacherID,
		DimensionScores: dimensionScores,
		Feedback:        req.Feedback,
		Strengths:       req.Strengths,
		Improvements:    req.Improvements,
	})

	if err != nil {
		logs.Errorf("[CreateTeacherEvaluation] Failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.CreateTeacherEvaluationResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "create teacher evaluation failed"},
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.CreateTeacherEvaluationResponse{
		BaseResponse: edumodel.BaseResponse{Code: 0, Msg: "success"},
		Data:         convertEvaluationToInfo(evaluation),
	})
}

// GetEvaluations 获取项目评估列表
// @router /api/space/:space_id/edu/projects/:project_id/evaluations [GET]
func GetEvaluations(ctx context.Context, c *app.RequestContext) {
	projectIDStr := c.Param("project_id")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(consts.StatusBadRequest, edumodel.GetEvaluationsResponse{
			BaseResponse: edumodel.BaseResponse{Code: 400, Msg: "invalid project_id"},
		})
		return
	}

	evaluations, err := eduServices.Evaluation.GetProjectEvaluations(ctx, projectID)
	if err != nil {
		logs.Errorf("[GetEvaluations] Failed: %v", err)
		c.JSON(consts.StatusInternalServerError, edumodel.GetEvaluationsResponse{
			BaseResponse: edumodel.BaseResponse{Code: 500, Msg: "get evaluations failed"},
		})
		return
	}

	c.JSON(consts.StatusOK, edumodel.GetEvaluationsResponse{
		BaseResponse: edumodel.BaseResponse{Code: 0, Msg: "success"},
		Data:         convertEvaluationsToInfo(evaluations),
	})
}

// ========== Helper Functions ==========

// getUserID 从上下文获取用户ID (模拟)
func getUserID(c *app.RequestContext) int64 {
	// TODO: 从认证中间件获取真实用户ID
	// 这里暂时返回固定值用于测试
	return 1
}

// Convert functions
func convertProjectToInfo(p *entity.StudentProject) *edumodel.ProjectInfo {
	return &edumodel.ProjectInfo{
		ID:           p.ID,
		UserID:       p.UserID,
		SpaceID:      p.SpaceID,
		ProjectType:  int8(p.ProjectType),
		SourceID:     p.SourceID,
		Title:        p.Title,
		Description:  p.Description,
		BotID:        p.BotID,
		CurrentStage: p.CurrentStage,
		Status:       string(p.Status),
		TotalScore:   p.TotalScore,
		CreatedAt:    p.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:    p.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func convertProjectsToInfo(projects []*entity.StudentProject) []*edumodel.ProjectInfo {
	result := make([]*edumodel.ProjectInfo, len(projects))
	for i, p := range projects {
		result[i] = convertProjectToInfo(p)
	}
	return result
}

func convertStagesToInfo(stages []*entity.ProjectStage) []*edumodel.StageInfo {
	result := make([]*edumodel.StageInfo, len(stages))
	for i, s := range stages {
		var startedAt, completedAt *string
		if s.StartedAt != nil {
			str := s.StartedAt.Format("2006-01-02 15:04:05")
			startedAt = &str
		}
		if s.CompletedAt != nil {
			str := s.CompletedAt.Format("2006-01-02 15:04:05")
			completedAt = &str
		}

		result[i] = &edumodel.StageInfo{
			ID:            s.ID,
			ProjectID:     s.ProjectID,
			StageOrder:    s.StageOrder,
			StageName:     s.StageName,
			Status:        string(s.Status),
			OutputContent: s.OutputContent,
			Score:         s.Score,
			Feedback:      s.Feedback,
			StartedAt:     startedAt,
			CompletedAt:   completedAt,
		}
	}
	return result
}

func convertEvaluationToInfo(e *entity.Evaluation) *edumodel.EvaluationInfo {
	dimensionScores := make(map[string]edumodel.DimensionScore)
	for key, val := range e.DimensionScores {
		dimensionScores[key] = edumodel.DimensionScore{
			Name:     val.Name,
			Score:    val.Score,
			MaxScore: val.MaxScore,
			Weight:   val.Weight,
			Feedback: val.Feedback,
		}
	}

	return &edumodel.EvaluationInfo{
		ID:              e.ID,
		ProjectID:       e.ProjectID,
		UserID:          e.UserID,
		EvaluationType:  int8(e.EvaluationType),
		EvaluatorID:     e.EvaluatorID,
		DimensionScores: dimensionScores,
		TotalScore:      e.TotalScore,
		MaxScore:        e.MaxScore,
		Feedback:        e.Feedback,
		Strengths:       e.Strengths,
		Improvements:    e.Improvements,
		EvaluatedAt:     e.EvaluatedAt.Format("2006-01-02 15:04:05"),
	}
}

func convertEvaluationsToInfo(evaluations []*entity.Evaluation) []*edumodel.EvaluationInfo {
	result := make([]*edumodel.EvaluationInfo, len(evaluations))
	for i, e := range evaluations {
		result[i] = convertEvaluationToInfo(e)
	}
	return result
}
