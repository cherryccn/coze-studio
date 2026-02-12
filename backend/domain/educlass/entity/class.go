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

// Class 班级实体
type Class struct {
	ID          int64      `json:"id" gorm:"primaryKey"`
	SpaceID     int64      `json:"space_id" gorm:"type:bigint unsigned;not null;index"` // 所属空间ID
	Name        string     `json:"name" gorm:"type:varchar(100);not null"`              // 班级名称
	Code        string     `json:"code" gorm:"type:varchar(50);uniqueIndex;not null"`   // 班级代码（唯一）
	Description string     `json:"description" gorm:"type:text"`                        // 班级描述
	TeacherID   int64      `json:"teacher_id" gorm:"index;not null"`                    // 主讲教师ID
	TeamSpaceID int64      `json:"team_space_id" gorm:"index"`                          // 关联的Team Space ID
	Semester    string     `json:"semester" gorm:"type:varchar(50)"`                    // 学期（如：2024春季）
	StartDate   *time.Time `json:"start_date,omitempty"`                                // 开课日期
	EndDate     *time.Time `json:"end_date,omitempty"`                                  // 结课日期
	Status      string     `json:"status" gorm:"type:varchar(20);not null;default:'active'"` // active/archived/deleted
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Class) TableName() string {
	return "edu_classes"
}

// ClassMember 班级成员实体
type ClassMember struct {
	ID        int64     `json:"id" gorm:"primaryKey"`
	ClassID   int64     `json:"class_id" gorm:"index:idx_class_user;not null"`           // 班级ID
	UserID    int64     `json:"user_id" gorm:"index:idx_class_user;not null"`            // 用户ID
	Role      string    `json:"role" gorm:"type:varchar(20);not null;default:'student'"` // teacher/assistant/student
	StudentNo string    `json:"student_no" gorm:"type:varchar(50)"`                      // 学号
	JoinedAt  time.Time `json:"joined_at" gorm:"autoCreateTime"`                         // 加入时间
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (ClassMember) TableName() string {
	return "edu_class_members"
}

// ClassInviteCode 班级邀请码实体
type ClassInviteCode struct {
	ID        int64      `json:"id" gorm:"primaryKey"`
	ClassID   int64      `json:"class_id" gorm:"index;not null"`                        // 班级ID
	Code      string     `json:"code" gorm:"type:varchar(32);uniqueIndex;not null"`     // 邀请码
	Role      string     `json:"role" gorm:"type:varchar(20);not null;default:'student'"` // 邀请码对应的角色
	MaxUses   int        `json:"max_uses" gorm:"default:0"`                             // 最大使用次数，0表示无限制
	UsedCount int        `json:"used_count" gorm:"default:0"`                           // 已使用次数
	ExpiresAt *time.Time `json:"expires_at,omitempty"`                                  // 过期时间
	CreatedBy int64      `json:"created_by" gorm:"not null"`                            // 创建者ID
	CreatedAt time.Time  `json:"created_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (ClassInviteCode) TableName() string {
	return "edu_class_invite_codes"
}

// 班级状态常量
const (
	ClassStatusActive   = "active"   // 活跃中
	ClassStatusArchived = "archived" // 已归档
	ClassStatusDeleted  = "deleted"  // 已删除
)

// 成员角色常量
const (
	MemberRoleTeacher   = "teacher"   // 教师
	MemberRoleAssistant = "assistant" // 助教
	MemberRoleStudent   = "student"   // 学生
)
