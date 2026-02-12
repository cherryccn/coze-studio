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

// Template Bot模板实体
type Template struct {
	ID                  int64  `json:"id" gorm:"primaryKey"`
	SpaceID             int64  `json:"space_id" gorm:"type:bigint unsigned;not null;index"`        // 所属空间ID
	CreatorID           int64  `json:"creator_id" gorm:"type:bigint unsigned;not null;index"`      // 创建者ID
	BotID               int64  `json:"bot_id" gorm:"type:bigint unsigned;not null;index"`          // 关联的Bot ID
	Title               string `json:"title" gorm:"type:varchar(200);not null"`                   // 模板标题
	Description         *string `json:"description,omitempty" gorm:"type:text"`                   // 模板描述
	Visibility          string  `json:"visibility" gorm:"type:enum('private','team','public');not null;default:'team'"` // 可见性
	ScenarioCategory    string  `json:"scenario_category" gorm:"type:varchar(50);not null;index"` // 场景类别
	CustomizationGuide  *string `json:"customization_guide,omitempty" gorm:"type:text"`           // 定制指南（Markdown）
	CreatedAt           time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Template) TableName() string {
	return "edu_templates"
}

// Class 班级实体
type Class struct {
	ID          int64   `json:"id" gorm:"primaryKey"`
	SpaceID     int64   `json:"space_id" gorm:"type:bigint unsigned;not null;index"`   // 所属空间ID
	TeacherID   int64   `json:"teacher_id" gorm:"type:bigint unsigned;not null;index"` // 教师ID
	ClassName   string  `json:"class_name" gorm:"type:varchar(100);not null"`         // 班级名称
	Description *string `json:"description,omitempty" gorm:"type:text"`               // 班级描述
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Class) TableName() string {
	return "edu_classes"
}

// ClassMember 班级成员实体
type ClassMember struct {
	ID       int64     `json:"id" gorm:"primaryKey"`
	ClassID  int64     `json:"class_id" gorm:"type:bigint unsigned;not null;index:idx_class_user;uniqueIndex:uk_class_user"` // 班级ID
	UserID   int64     `json:"user_id" gorm:"type:bigint unsigned;not null;index:idx_class_user;uniqueIndex:uk_class_user"`  // 用户ID
	JoinedAt time.Time `json:"joined_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (ClassMember) TableName() string {
	return "edu_class_members"
}

// Assignment 作业实体
type Assignment struct {
	ID             int64      `json:"id" gorm:"primaryKey"`
	ClassID        int64      `json:"class_id" gorm:"type:bigint unsigned;not null;index"`   // 班级ID
	TeacherID      int64      `json:"teacher_id" gorm:"type:bigint unsigned;not null;index"` // 教师ID
	AssignmentType ProjectType `json:"assignment_type" gorm:"type:tinyint;not null;index"`   // 作业类型（1=剧本/2=模板/3=Bot）
	SourceID       int64      `json:"source_id" gorm:"type:bigint unsigned;not null;default:0"` // 来源ID（script_id/template_id/0）
	Title          string     `json:"title" gorm:"type:varchar(200);not null"`              // 作业标题
	Description    *string    `json:"description,omitempty" gorm:"type:text"`               // 作业描述
	DueDate        *time.Time `json:"due_date,omitempty"`                                   // 截止日期
	CreatedAt      time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Assignment) TableName() string {
	return "edu_assignments"
}
