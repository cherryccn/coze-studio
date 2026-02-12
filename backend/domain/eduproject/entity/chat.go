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

// ChatMessage 对话消息实体
type ChatMessage struct {
	ID             int64          `json:"id" gorm:"primaryKey"`
	ProjectID      int64          `json:"project_id" gorm:"index;not null"`
	StageNumber    int8           `json:"stage_number" gorm:"type:tinyint;not null"`
	ConversationID string         `json:"conversation_id,omitempty" gorm:"type:varchar(50)"` // 可选，关联现有conversation
	SenderType     string         `json:"sender_type" gorm:"type:varchar(20);not null"`      // student/bot
	SenderID       *int64         `json:"sender_id,omitempty"`
	SenderName     string         `json:"sender_name" gorm:"type:varchar(50);not null"`
	Content        string         `json:"content" gorm:"type:text;not null"`
	Attachments    JSONAttachment `json:"attachments,omitempty" gorm:"type:json"`
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (ChatMessage) TableName() string {
	return "edu_chat_messages"
}

// Attachment 附件结构
type Attachment struct {
	Name string `json:"name"`
	URL  string `json:"url"`
	Type string `json:"type"` // image/file/etc.
}

// JSONAttachment 附件数组类型
type JSONAttachment []Attachment

// Value 实现driver.Valuer接口
func (j JSONAttachment) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan 实现sql.Scanner接口
func (j *JSONAttachment) Scan(value interface{}) error {
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

// SenderType 发送者类型常量
const (
	SenderTypeStudent = "student"
	SenderTypeBot     = "bot"
)
