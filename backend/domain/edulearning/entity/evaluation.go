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

// EvaluationType 评估类型
type EvaluationType int8

const (
	EvaluationTypeAI      EvaluationType = 1 // AI自动评估
	EvaluationTypeTeacher EvaluationType = 2 // 教师评估
)

// Evaluation 评估结果实体
type Evaluation struct {
	ID        int64 `json:"id" gorm:"primaryKey"`
	ProjectID int64 `json:"project_id" gorm:"type:bigint unsigned;not null;index"` // 项目ID
	UserID    int64 `json:"user_id" gorm:"type:bigint unsigned;not null;index"`    // 被评估学生ID

	// 评估类型
	EvaluationType EvaluationType `json:"evaluation_type" gorm:"type:tinyint;not null;index"` // 评估类型
	EvaluatorID    *int64         `json:"evaluator_id,omitempty" gorm:"type:bigint unsigned"` // 评估者ID（教师）

	// 评估维度
	DimensionScores JSONDimensionScores `json:"dimension_scores,omitempty" gorm:"type:json"` // 各维度得分

	// 总分
	TotalScore float64 `json:"total_score" gorm:"type:decimal(5,2);not null"` // 总分
	MaxScore   float64 `json:"max_score" gorm:"type:decimal(5,2);not null;default:100"` // 满分

	// 反馈
	Feedback     *string         `json:"feedback,omitempty" gorm:"type:text"`     // 评估反馈
	Strengths    JSONStringArray `json:"strengths,omitempty" gorm:"type:json"`    // 优点列表
	Improvements JSONStringArray `json:"improvements,omitempty" gorm:"type:json"` // 改进建议列表

	EvaluatedAt time.Time `json:"evaluated_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (Evaluation) TableName() string {
	return "edu_evaluations"
}

// JSONStringArray 字符串数组类型（用于优点和改进建议）
type JSONStringArray []string

// Value 实现driver.Valuer接口
func (j JSONStringArray) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
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

// IsAIEvaluation 是否为AI评估
func (e *Evaluation) IsAIEvaluation() bool {
	return e.EvaluationType == EvaluationTypeAI
}

// IsTeacherEvaluation 是否为教师评估
func (e *Evaluation) IsTeacherEvaluation() bool {
	return e.EvaluationType == EvaluationTypeTeacher
}

// GetScorePercentage 获取得分百分比
func (e *Evaluation) GetScorePercentage() float64 {
	if e.MaxScore == 0 {
		return 0
	}
	return (e.TotalScore / e.MaxScore) * 100
}

// DimensionScore 维度得分
type DimensionScore struct {
	Name     string  `json:"name"`     // 维度名称
	Score    float64 `json:"score"`    // 得分
	MaxScore float64 `json:"max_score"` // 满分
	Weight   float64 `json:"weight"`   // 权重
	Feedback *string `json:"feedback,omitempty"` // 维度反馈
}

// JSONDimensionScores 维度得分JSON类型
type JSONDimensionScores map[string]DimensionScore

// Value 实现driver.Valuer接口
func (j JSONDimensionScores) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan 实现sql.Scanner接口
func (j *JSONDimensionScores) Scan(value interface{}) error {
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
