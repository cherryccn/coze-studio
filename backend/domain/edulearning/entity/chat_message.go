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
	"database/sql/driver"
	"encoding/json"
	"time"
)

// MessageRole 消息角色
type MessageRole string

const (
	MessageRoleUser      MessageRole = "user"      // 用户（学生）
	MessageRoleAssistant MessageRole = "assistant" // 助手（Bot）
)

// ChatMessage 对话消息实体
type ChatMessage struct {
	ID        int64 `json:"id" gorm:"primaryKey"`
	ProjectID int64 `json:"project_id" gorm:"type:bigint unsigned;not null;index:idx_project_id"` // 项目ID
	StageID   *int64 `json:"stage_id,omitempty" gorm:"type:bigint unsigned;index:idx_project_stage"` // 阶段ID（可选）

	Role    MessageRole     `json:"role" gorm:"type:varchar(20);not null"`    // 角色
	Content string          `json:"content" gorm:"type:text;not null"`        // 消息内容
	Attachments JSONAttachments `json:"attachments,omitempty" gorm:"type:json"` // 附件信息

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime;index:idx_created_at"`
}

// TableName 指定表名
func (ChatMessage) TableName() string {
	return "edu_chat_messages"
}

// IsUserMessage 是否为用户消息
func (m *ChatMessage) IsUserMessage() bool {
	return m.Role == MessageRoleUser
}

// IsAssistantMessage 是否为助手消息
func (m *ChatMessage) IsAssistantMessage() bool {
	return m.Role == MessageRoleAssistant
}

// Attachment 附件
type Attachment struct {
	Type string `json:"type"` // 类型：image, file, etc.
	URL  string `json:"url"`  // 附件URL
	Name string `json:"name"` // 附件名称
	Size int64  `json:"size"` // 文件大小（字节）
}

// JSONAttachments 附件数组（用于JSON序列化）
type JSONAttachments []Attachment

// Value 实现driver.Valuer接口
func (j JSONAttachments) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan 实现sql.Scanner接口
func (j *JSONAttachments) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}
