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

// Common response types
type BaseResponse struct {
	Code int32  `json:"code"`
	Msg  string `json:"msg"`
}

// ========== Project APIs ==========

// ProjectCreateRequest 创建项目请求（新版）
type ProjectCreateRequest struct {
	SpaceID      int64  `json:"space_id" vd:"$>0"`
	ProjectType  int8   `json:"project_type" vd:"$>=1 && $<=3"` // 1=script, 2=template, 3=bot
	SourceID     int64  `json:"source_id"`                      // script_id or template_id
	Title        string `json:"title" vd:"len($)>0 && len($)<=200"`
	Description  string `json:"description"`
	ClassID      *int64 `json:"class_id"`      // optional
	AssignmentID *int64 `json:"assignment_id"` // optional
}

// ProjectCreateResponse 创建项目响应（新版）
type ProjectCreateResponse struct {
	BaseResponse
	Data *ProjectInfo `json:"data"`
}

// ProjectInfo 项目信息
type ProjectInfo struct {
	ID           int64   `json:"id"`
	UserID       int64   `json:"user_id"`
	SpaceID      int64   `json:"space_id"`
	ProjectType  int8    `json:"project_type"`
	SourceID     int64   `json:"source_id"`
	Title        string  `json:"title"`
	Description  *string `json:"description,omitempty"`
	BotID        *int64  `json:"bot_id,omitempty"`
	CurrentStage int     `json:"current_stage"`
	Status       string  `json:"status"`
	TotalScore   *float64 `json:"total_score,omitempty"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

// GetProjectRequest 获取项目详情请求
type GetProjectRequest struct {
	ProjectID int64 `path:"project_id" vd:"$>0"`
}

// GetProjectResponse 获取项目详情响应
type GetProjectResponse struct {
	BaseResponse
	Data *ProjectDetail `json:"data"`
}

// ProjectDetail 项目详情
type ProjectDetail struct {
	*ProjectInfo
	Stages      []*StageInfo      `json:"stages,omitempty"`
	Evaluations []*EvaluationInfo `json:"evaluations,omitempty"`
}

// StageInfo 阶段信息
type StageInfo struct {
	ID            int64   `json:"id"`
	ProjectID     int64   `json:"project_id"`
	StageOrder    int     `json:"stage_order"`
	StageName     string  `json:"stage_name"`
	Status        string  `json:"status"`
	OutputContent *string `json:"output_content,omitempty"`
	Score         *float64 `json:"score,omitempty"`
	Feedback      *string `json:"feedback,omitempty"`
	StartedAt     *string `json:"started_at,omitempty"`
	CompletedAt   *string `json:"completed_at,omitempty"`
}

// ListProjectsRequest 获取项目列表请求
type ListProjectsRequest struct {
	SpaceID      *int64 `query:"space_id"`
	ProjectType  *int8  `query:"project_type"`
	Status       *string `query:"status"`
	Keyword      string `query:"keyword"`
	Page         int    `query:"page"`
	PageSize     int    `query:"page_size"`
}

// ListProjectsResponse 获取项目列表响应
type ListProjectsResponse struct {
	BaseResponse
	Data *ProjectListData `json:"data"`
}

// ProjectListData 项目列表数据
type ProjectListData struct {
	List     []*ProjectInfo `json:"list"`
	Total    int64          `json:"total"`
	Page     int            `json:"page"`
	PageSize int            `json:"page_size"`
}

// UpdateStageOutputRequest 更新阶段产出请求
type UpdateStageOutputRequest struct {
	StageID int64  `json:"stage_id" vd:"$>0"`
	Content string `json:"content" vd:"len($)>0"`
}

// UpdateStageOutputResponse 更新阶段产出响应
type UpdateStageOutputResponse struct {
	BaseResponse
}

// CompleteStageRequest 完成阶段请求
type CompleteStageRequest struct {
	ProjectID     int64  `json:"project_id" vd:"$>0"`
	StageOrder    int    `json:"stage_order" vd:"$>0"`
	OutputContent string `json:"output_content" vd:"len($)>0"`
}

// CompleteStageResponse 完成阶段响应
type CompleteStageResponse struct {
	BaseResponse
	Data *StageCompletionData `json:"data"`
}

// StageCompletionData 阶段完成数据
type StageCompletionData struct {
	StageID    int64   `json:"stage_id"`
	Score      float64 `json:"score"`
	Feedback   string  `json:"feedback"`
	NextStage  *int    `json:"next_stage,omitempty"`
	Evaluation *EvaluationInfo `json:"evaluation,omitempty"`
}

// ========== Evaluation APIs ==========

// EvaluationInfo 评估信息
type EvaluationInfo struct {
	ID              int64                       `json:"id"`
	ProjectID       int64                       `json:"project_id"`
	UserID          int64                       `json:"user_id"`
	EvaluationType  int8                        `json:"evaluation_type"` // 1=AI, 2=Teacher
	EvaluatorID     *int64                      `json:"evaluator_id,omitempty"`
	DimensionScores map[string]DimensionScore   `json:"dimension_scores,omitempty"`
	TotalScore      float64                     `json:"total_score"`
	MaxScore        float64                     `json:"max_score"`
	Feedback        *string                     `json:"feedback,omitempty"`
	Strengths       []string                    `json:"strengths,omitempty"`
	Improvements    []string                    `json:"improvements,omitempty"`
	EvaluatedAt     string                      `json:"evaluated_at"`
}

// DimensionScore 维度得分
type DimensionScore struct {
	Name     string  `json:"name"`
	Score    float64 `json:"score"`
	MaxScore float64 `json:"max_score"`
	Weight   float64 `json:"weight"`
	Feedback *string `json:"feedback,omitempty"`
}

// CreateTeacherEvaluationRequest 创建教师评估请求
type CreateTeacherEvaluationRequest struct {
	ProjectID       int64                     `json:"project_id" vd:"$>0"`
	DimensionScores map[string]DimensionScore `json:"dimension_scores" vd:"len($)>0"`
	Feedback        string                    `json:"feedback" vd:"len($)>0"`
	Strengths       []string                  `json:"strengths"`
	Improvements    []string                  `json:"improvements"`
}

// CreateTeacherEvaluationResponse 创建教师评估响应
type CreateTeacherEvaluationResponse struct {
	BaseResponse
	Data *EvaluationInfo `json:"data"`
}

// GetEvaluationsRequest 获取评估列表请求
type GetEvaluationsRequest struct {
	ProjectID int64 `path:"project_id" vd:"$>0"`
}

// GetEvaluationsResponse 获取评估列表响应
type GetEvaluationsResponse struct {
	BaseResponse
	Data []*EvaluationInfo `json:"data"`
}

// ========== Template APIs ==========

// CreateTemplateRequest 创建模板请求
type CreateTemplateRequest struct {
	SpaceID            int64   `json:"space_id" vd:"$>0"`
	BotID              int64   `json:"bot_id" vd:"$>0"`
	Title              string  `json:"title" vd:"len($)>0 && len($)<=200"`
	Description        *string `json:"description"`
	Visibility         string  `json:"visibility" vd:"$=='private' || $=='team' || $=='public'"`
	ScenarioCategory   string  `json:"scenario_category" vd:"len($)>0"`
	CustomizationGuide *string `json:"customization_guide"`
}

// CreateTemplateResponse 创建模板响应
type CreateTemplateResponse struct {
	BaseResponse
	Data *TemplateInfo `json:"data"`
}

// TemplateInfo 模板信息
type TemplateInfo struct {
	ID                 int64   `json:"id"`
	SpaceID            int64   `json:"space_id"`
	CreatorID          int64   `json:"creator_id"`
	BotID              int64   `json:"bot_id"`
	Title              string  `json:"title"`
	Description        *string `json:"description,omitempty"`
	Visibility         string  `json:"visibility"`
	ScenarioCategory   string  `json:"scenario_category"`
	CustomizationGuide *string `json:"customization_guide,omitempty"`
	CreatedAt          string  `json:"created_at"`
	UpdatedAt          string  `json:"updated_at"`
}

// ListTemplatesRequest 获取模板列表请求
type ListTemplatesRequest struct {
	SpaceID          *int64  `query:"space_id"`
	ScenarioCategory *string `query:"scenario_category"`
	Visibility       *string `query:"visibility"`
	Keyword          string  `query:"keyword"`
	Page             int     `query:"page"`
	PageSize         int     `query:"page_size"`
}

// ListTemplatesResponse 获取模板列表响应
type ListTemplatesResponse struct {
	BaseResponse
	Data *TemplateListData `json:"data"`
}

// TemplateListData 模板列表数据
type TemplateListData struct {
	List     []*TemplateInfo `json:"list"`
	Total    int64           `json:"total"`
	Page     int             `json:"page"`
	PageSize int             `json:"page_size"`
}

// ========== Assignment APIs ==========

// CreateAssignmentRequest 创建作业请求
type CreateAssignmentRequest struct {
	ClassID        int64   `json:"class_id" vd:"$>0"`
	AssignmentType int8    `json:"assignment_type" vd:"$>=1 && $<=3"` // 1=script, 2=template, 3=bot
	SourceID       int64   `json:"source_id"`
	Title          string  `json:"title" vd:"len($)>0 && len($)<=200"`
	Description    *string `json:"description"`
	DueDate        *string `json:"due_date"` // ISO 8601 format
}

// CreateAssignmentResponse 创建作业响应
type CreateAssignmentResponse struct {
	BaseResponse
	Data *AssignmentInfo `json:"data"`
}

// AssignmentInfo 作业信息
type AssignmentInfo struct {
	ID             int64   `json:"id"`
	ClassID        int64   `json:"class_id"`
	TeacherID      int64   `json:"teacher_id"`
	AssignmentType int8    `json:"assignment_type"`
	SourceID       int64   `json:"source_id"`
	Title          string  `json:"title"`
	Description    *string `json:"description,omitempty"`
	DueDate        *string `json:"due_date,omitempty"`
	SubmittedCount int64   `json:"submitted_count"`
	TotalStudents  int64   `json:"total_students"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}

// ListAssignmentsRequest 获取作业列表请求
type ListAssignmentsRequest struct {
	ClassID        *int64 `query:"class_id"`
	AssignmentType *int8  `query:"assignment_type"`
	Page           int    `query:"page"`
	PageSize       int    `query:"page_size"`
}

// ListAssignmentsResponse 获取作业列表响应
type ListAssignmentsResponse struct {
	BaseResponse
	Data *AssignmentListData `json:"data"`
}

// AssignmentListData 作业列表数据
type AssignmentListData struct {
	List     []*AssignmentInfo `json:"list"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}
