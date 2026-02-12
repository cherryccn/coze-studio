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

// ProjectType 项目类型
type ProjectType int8

const (
	ProjectTypeScript   ProjectType = 1 // 剧本引导学习
	ProjectTypeTemplate ProjectType = 2 // 模板定制开发
	ProjectTypeBot      ProjectType = 3 // 自主Bot开发
)

// ProjectStatus 项目状态
type ProjectStatus string

const (
	ProjectStatusInProgress ProjectStatus = "in_progress" // 进行中
	ProjectStatusCompleted  ProjectStatus = "completed"   // 已完成
	ProjectStatusAbandoned  ProjectStatus = "abandoned"   // 已放弃
)

// StudentProject 学生学习项目实体（支持三种类型）
type StudentProject struct {
	ID           int64  `json:"id" gorm:"primaryKey"`
	UserID       int64  `json:"user_id" gorm:"type:bigint unsigned;not null;index:idx_user_space"`        // 学生ID
	SpaceID      int64  `json:"space_id" gorm:"type:bigint unsigned;not null;index:idx_user_space"`       // 所属空间ID
	ClassID      *int64 `json:"class_id,omitempty" gorm:"type:bigint unsigned;index:idx_class_assignment"` // 所属班级ID
	AssignmentID *int64 `json:"assignment_id,omitempty" gorm:"type:bigint unsigned;index:idx_class_assignment"` // 所属作业ID

	// 项目类型和来源
	ProjectType ProjectType `json:"project_type" gorm:"type:tinyint;not null;index"`                   // 项目类型
	SourceID    int64       `json:"source_id" gorm:"type:bigint unsigned;not null;default:0"` // 来源ID（script_id/template_id/0）

	// 基本信息
	Title       string  `json:"title" gorm:"type:varchar(200);not null"`
	Description *string `json:"description,omitempty" gorm:"type:text"`

	// 关联的Bot（模板和自主开发阶段）
	BotID *int64 `json:"bot_id,omitempty" gorm:"type:bigint unsigned;index"`

	// 进度和状态
	CurrentStage int           `json:"current_stage" gorm:"type:int;not null;default:1"` // 当前阶段（仅剧本类型使用）
	Status       ProjectStatus `json:"status" gorm:"type:varchar(20);not null;default:'in_progress';index"`

	// 评估相关
	TotalScore     *float64 `json:"total_score,omitempty" gorm:"type:decimal(5,2)"`        // 总分
	TeacherComment *string  `json:"teacher_comment,omitempty" gorm:"type:text"`            // 教师评语
	TeacherScore   *float64 `json:"teacher_score,omitempty" gorm:"type:decimal(5,2)"`      // 教师打分

	// 时间戳
	StartedAt   time.Time  `json:"started_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	SubmittedAt *time.Time `json:"submitted_at,omitempty"` // 提交时间（作业）
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (StudentProject) TableName() string {
	return "edu_student_projects"
}

// IsScriptProject 是否为剧本项目
func (p *StudentProject) IsScriptProject() bool {
	return p.ProjectType == ProjectTypeScript
}

// IsTemplateProject 是否为模板项目
func (p *StudentProject) IsTemplateProject() bool {
	return p.ProjectType == ProjectTypeTemplate
}

// IsBotProject 是否为自主Bot项目
func (p *StudentProject) IsBotProject() bool {
	return p.ProjectType == ProjectTypeBot
}

// IsCompleted 是否已完成
func (p *StudentProject) IsCompleted() bool {
	return p.Status == ProjectStatusCompleted
}

// IsInProgress 是否进行中
func (p *StudentProject) IsInProgress() bool {
	return p.Status == ProjectStatusInProgress
}

// IsAssignment 是否为作业
func (p *StudentProject) IsAssignment() bool {
	return p.AssignmentID != nil
}

// MarkAsCompleted 标记为已完成
func (p *StudentProject) MarkAsCompleted() {
	p.Status = ProjectStatusCompleted
	now := time.Now()
	p.CompletedAt = &now
}

// MarkAsSubmitted 标记为已提交（作业）
func (p *StudentProject) MarkAsSubmitted() {
	now := time.Now()
	p.SubmittedAt = &now
}

// SetTotalScore 设置总分
func (p *StudentProject) SetTotalScore(score float64) {
	p.TotalScore = &score
}

// SetTeacherScore 设置教师评分
func (p *StudentProject) SetTeacherScore(score float64, comment string) {
	p.TeacherScore = &score
	p.TeacherComment = &comment
}

// AdvanceStage 进入下一阶段（仅剧本项目）
func (p *StudentProject) AdvanceStage() {
	if p.IsScriptProject() {
		p.CurrentStage++
	}
}
