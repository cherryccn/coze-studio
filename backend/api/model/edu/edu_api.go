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

// ListScriptsRequest 获取剧本列表请求
type ListScriptsRequest struct {
	Keyword    string `json:"keyword" query:"keyword"`       // 搜索关键词
	Difficulty *int8  `json:"difficulty" query:"difficulty"` // 难度筛选
	Page       int    `json:"page" query:"page"`             // 页码
	PageSize   int    `json:"page_size" query:"page_size"`   // 每页数量
}

// ListScriptsResponse 获取剧本列表响应
type ListScriptsResponse struct {
	Code int                `json:"code"`
	Msg  string             `json:"msg"`
	Data *ScriptListData    `json:"data"`
}

// ScriptListData 剧本列表数据
type ScriptListData struct {
	List     []*ScriptItem `json:"list"`
	Total    int64         `json:"total"`
	Page     int           `json:"page"`
	PageSize int           `json:"page_size"`
}

// ScriptItem 剧本项
type ScriptItem struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	NameEn      string `json:"name_en,omitempty"`
	Difficulty  int8   `json:"difficulty"`
	Duration    int    `json:"duration"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
}

// GetScriptRequest 获取剧本详情请求
type GetScriptRequest struct {
	ID int64 `json:"id" path:"id" vd:"$>0"`
}

// GetScriptResponse 获取剧本详情响应
type GetScriptResponse struct {
	Code int          `json:"code"`
	Msg  string       `json:"msg"`
	Data *ScriptDetail `json:"data"`
}

// ScriptDetail 剧本详情
type ScriptDetail struct {
	ID               int64              `json:"id"`
	Name             string             `json:"name"`
	NameEn           string             `json:"name_en,omitempty"`
	Difficulty       int8               `json:"difficulty"`
	Duration         int                `json:"duration"`
	Icon             string             `json:"icon"`
	Description      string             `json:"description"`
	Background       string             `json:"background"`
	Objectives       []string           `json:"objectives"`
	Stages           []ScriptStageInfo  `json:"stages"`
	EvaluationConfig *EvaluationConfig  `json:"evaluation_config,omitempty"`
}

// ScriptStageInfo 剧本阶段信息
type ScriptStageInfo struct {
	Order          int     `json:"order"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	Duration       int     `json:"duration"`
	BotIDs         []int64 `json:"bot_ids"`
	OutputType     string  `json:"output_type"`
	OutputTemplate string  `json:"output_template"`
	Weight         float64 `json:"weight"`
}

// EvaluationConfig 评估配置
type EvaluationConfig struct {
	Dimensions []EvaluationDimension `json:"dimensions"`
}

// EvaluationDimension 评估维度
type EvaluationDimension struct {
	Name   string  `json:"name"`
	Weight float64 `json:"weight"`
}

// CreateProjectRequest 创建项目请求
type CreateProjectRequest struct {
	ScriptID int64  `json:"script_id" vd:"$>0"`
	Title    string `json:"title" vd:"len($)>0"`
}

// CreateProjectResponse 创建项目响应
type CreateProjectResponse struct {
	Code int          `json:"code"`
	Msg  string       `json:"msg"`
	Data *ProjectData `json:"data"`
}

// ProjectData 项目数据
type ProjectData struct {
	ProjectID    int64  `json:"project_id"`
	ScriptID     int64  `json:"script_id"`
	CurrentStage int8   `json:"current_stage"`
	Status       string `json:"status"`
}

// GetMyProjectsResponse 获取我的项目列表响应
type GetMyProjectsResponse struct {
	Code int            `json:"code"`
	Msg  string         `json:"msg"`
	Data []*ProjectItem `json:"data"`
}

// ProjectItem 项目项
type ProjectItem struct {
	ID           int64  `json:"id"`
	ScriptID     int64  `json:"script_id"`
	ScriptName   string `json:"script_name"`
	ScriptIcon   string `json:"script_icon"`
	Title        string `json:"title"`
	CurrentStage int8   `json:"current_stage"`
	Status       string `json:"status"`
	Progress     int8   `json:"progress"`
	StartedAt    string `json:"started_at"`
}

// SendMessageRequest 发送消息请求
type SendMessageRequest struct {
	ProjectID   int64  `json:"project_id" vd:"$>0"`
	StageNumber int8   `json:"stage_number" vd:"$>0"`
	BotID       int64  `json:"bot_id" vd:"$>0"`
	Content     string `json:"content" vd:"len($)>0"`
}

// SendMessageResponse 发送消息响应
type SendMessageResponse struct {
	Code int          `json:"code"`
	Msg  string       `json:"msg"`
	Data *MessageData `json:"data"`
}

// MessageData 消息数据
type MessageData struct {
	MessageID int64      `json:"message_id"`
	BotReply  *BotReply  `json:"bot_reply"`
}

// BotReply Bot回复
type BotReply struct {
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}
