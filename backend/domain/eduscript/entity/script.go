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

// Script 教育剧本实体
type Script struct {
	ID               int64            `json:"id" gorm:"primaryKey"`
	SpaceID          int64            `json:"space_id" gorm:"type:bigint unsigned;not null;index"`     // 所属空间ID
	OwnerID          int64            `json:"owner_id" gorm:"type:bigint unsigned;not null;index"`     // 创建者用户ID
	Name             string           `json:"name" gorm:"type:varchar(100);not null"`
	NameEn           string           `json:"name_en" gorm:"type:varchar(100)"`
	Difficulty       int8             `json:"difficulty" gorm:"type:tinyint;not null;default:2"` // 1=简单 2=中等 3=困难
	Duration         int              `json:"duration" gorm:"type:int;not null;default:2"`       // 预计课时（分钟）
	Icon             string           `json:"icon" gorm:"type:varchar(50);default:'📊'"`
	Description      string           `json:"description" gorm:"type:varchar(500)"`
	Visibility       string           `json:"visibility" gorm:"type:enum('private','team','public');not null;default:'team'"` // 可见性
	Background       string           `json:"background" gorm:"type:text"`
	Objectives       JSONStringArray  `json:"objectives" gorm:"type:json"`            // 学习目标数组
	Stages           ScriptStages     `json:"stages" gorm:"type:json;not null"`       // 阶段配置数组
	BotIDs           JSONInt64Array   `json:"bot_ids" gorm:"type:json"`               // 关联的Bot ID数组
	EvaluationConfig EvaluationConfig `json:"evaluation_config" gorm:"type:json"`     // 评分配置
	Status           int8             `json:"status" gorm:"type:tinyint;default:1"`   // 1=启用 0=禁用
	CreatedAt        time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Script) TableName() string {
	return "edu_scripts"
}

// ScriptStage 剧本阶段
type ScriptStage struct {
	Order          int            `json:"order"`
	Name           string         `json:"name"`
	Description    string         `json:"description"`
	Duration       int            `json:"duration"`        // 预计时长（分钟）
	BotIDs         []int64        `json:"bot_ids"`         // 该阶段涉及的Bot ID
	OutputType     string         `json:"output_type"`     // 输出类型：markdown, pdf, etc.
	OutputTemplate string         `json:"output_template"` // 输出模板名称
	Weight         float64        `json:"weight"`          // 阶段权重（用于评分）
}

// ScriptStages 阶段数组（用于JSON序列化）
type ScriptStages []ScriptStage

// Value 实现driver.Valuer接口
func (s ScriptStages) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan 实现sql.Scanner接口
func (s *ScriptStages) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, s)
}

// EvaluationDimension 评估维度
type EvaluationDimension struct {
	Name   string  `json:"name"`
	Weight float64 `json:"weight"`
}

// EvaluationConfig 评估配置
type EvaluationConfig struct {
	Dimensions []EvaluationDimension `json:"dimensions"`
}

// Value 实现driver.Valuer接口
func (e EvaluationConfig) Value() (driver.Value, error) {
	return json.Marshal(e)
}

// Scan 实现sql.Scanner接口
func (e *EvaluationConfig) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, e)
}

// JSONStringArray 字符串数组类型（用于学习目标）
type JSONStringArray []string

// Value 实现driver.Valuer接口
func (j JSONStringArray) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// Scan 实现sql.Scanner接口
func (j *JSONStringArray) Scan(value interface{}) error {
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

// JSONInt64Array int64数组类型（用于Bot IDs）
type JSONInt64Array []int64

// Value 实现driver.Valuer接口
func (j JSONInt64Array) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// Scan 实现sql.Scanner接口
func (j *JSONInt64Array) Scan(value interface{}) error {
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
