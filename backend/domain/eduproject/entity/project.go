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

// StudentProject 学生项目实体
type StudentProject struct {
	ID           int64     `json:"id" gorm:"primaryKey"`
	SpaceID      int64     `json:"space_id" gorm:"type:bigint unsigned;not null;index"`   // 所属空间ID
	StudentID    int64     `json:"student_id" gorm:"index;not null"`      // 关联user表
	ScriptID     int64     `json:"script_id" gorm:"index;not null"`       // 关联edu_scripts表
	Title        string    `json:"title" gorm:"type:varchar(100);not null"`
	CurrentStage int8      `json:"current_stage" gorm:"type:tinyint;not null;default:1"`
	Status       string    `json:"status" gorm:"type:varchar(20);not null;default:'in_progress'"` // in_progress/completed/abandoned
	Progress     int8      `json:"progress" gorm:"type:tinyint;not null;default:0"`               // 进度百分比
	StartedAt    time.Time `json:"started_at" gorm:"autoCreateTime"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (StudentProject) TableName() string {
	return "edu_student_projects"
}

// ProjectStage 项目阶段记录实体
type ProjectStage struct {
	ID             int64      `json:"id" gorm:"primaryKey"`
	ProjectID      int64      `json:"project_id" gorm:"index;not null"`
	StageNumber    int8       `json:"stage_number" gorm:"type:tinyint;not null"`
	StageName      string     `json:"stage_name" gorm:"type:varchar(50);not null"`
	Status         string     `json:"status" gorm:"type:varchar(20);not null;default:'pending'"` // pending/in_progress/completed
	OutputDocument string     `json:"output_document" gorm:"type:longtext"`                      // Markdown文档
	StartedAt      *time.Time `json:"started_at,omitempty"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (ProjectStage) TableName() string {
	return "edu_project_stages"
}

// ProjectStatus 项目状态常量
const (
	ProjectStatusInProgress = "in_progress"
	ProjectStatusCompleted  = "completed"
	ProjectStatusAbandoned  = "abandoned"
)

// StageStatus 阶段状态常量
const (
	StageStatusPending    = "pending"
	StageStatusInProgress = "in_progress"
	StageStatusCompleted  = "completed"
)
