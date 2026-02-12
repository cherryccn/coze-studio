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

package entity

import (
	"time"
)

// StageStatus 阶段状态
type StageStatus string

const (
	StageStatusNotStarted StageStatus = "not_started" // 未开始
	StageStatusInProgress StageStatus = "in_progress" // 进行中
	StageStatusCompleted  StageStatus = "completed"   // 已完成
)

// ProjectStage 项目阶段实体
type ProjectStage struct {
	ID        int64 `json:"id" gorm:"primaryKey"`
	ProjectID int64 `json:"project_id" gorm:"type:bigint unsigned;not null;index;uniqueIndex:uk_project_stage"` // 项目ID

	StageOrder int         `json:"stage_order" gorm:"type:int;not null;uniqueIndex:uk_project_stage"` // 阶段序号
	StageName  string      `json:"stage_name" gorm:"type:varchar(100);not null"`                       // 阶段名称
	Status     StageStatus `json:"status" gorm:"type:varchar(20);not null;default:'not_started';index"` // 状态

	// 学生产出
	OutputContent *string `json:"output_content,omitempty" gorm:"type:longtext"` // 产出内容（Markdown）

	// 评估结果
	Score    *float64 `json:"score,omitempty" gorm:"type:decimal(5,2)"` // 阶段得分
	Feedback *string  `json:"feedback,omitempty" gorm:"type:text"`      // AI反馈

	// 时间戳
	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ProjectStage) TableName() string {
	return "edu_project_stages"
}

// IsNotStarted 是否未开始
func (s *ProjectStage) IsNotStarted() bool {
	return s.Status == StageStatusNotStarted
}

// IsInProgress 是否进行中
func (s *ProjectStage) IsInProgress() bool {
	return s.Status == StageStatusInProgress
}

// IsCompleted 是否已完成
func (s *ProjectStage) IsCompleted() bool {
	return s.Status == StageStatusCompleted
}

// Start 开始阶段
func (s *ProjectStage) Start() {
	s.Status = StageStatusInProgress
	now := time.Now()
	s.StartedAt = &now
}

// Complete 完成阶段
func (s *ProjectStage) Complete(outputContent string, score float64, feedback string) {
	s.Status = StageStatusCompleted
	s.OutputContent = &outputContent
	s.Score = &score
	s.Feedback = &feedback
	now := time.Now()
	s.CompletedAt = &now
}

// UpdateOutput 更新产出内容
func (s *ProjectStage) UpdateOutput(content string) {
	s.OutputContent = &content
}

// SetEvaluation 设置评估结果
func (s *ProjectStage) SetEvaluation(score float64, feedback string) {
	s.Score = &score
	s.Feedback = &feedback
}
