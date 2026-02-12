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

// EvaluationResult 评估结果实体
type EvaluationResult struct {
	ID                    int64                  `json:"id" gorm:"primaryKey"`
	ProjectID             int64                  `json:"project_id" gorm:"index;not null"`
	StageNumber           *int8                  `json:"stage_number,omitempty" gorm:"type:tinyint"` // NULL表示总评
	TotalScore            float64                `json:"total_score" gorm:"type:decimal(5,2);not null"`
	DimensionScores       DimensionScoreMap      `json:"dimension_scores" gorm:"type:json;not null"`
	AIFeedback            string                 `json:"ai_feedback,omitempty" gorm:"type:text"`
	TeacherFeedback       string                 `json:"teacher_feedback,omitempty" gorm:"type:text"`
	TeacherAdjustedScore  *float64               `json:"teacher_adjusted_score,omitempty" gorm:"type:decimal(5,2)"`
	EvaluatedAt           time.Time              `json:"evaluated_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (EvaluationResult) TableName() string {
	return "edu_evaluation_results"
}

// DimensionScore 维度得分
type DimensionScore struct {
	Name     string  `json:"name"`
	Score    float64 `json:"score"`
	Weight   float64 `json:"weight"`
	Feedback string  `json:"feedback,omitempty"` // 该维度的评语
}

// DimensionScoreMap 维度得分映射（用于JSON序列化）
type DimensionScoreMap map[string]DimensionScore

// Value 实现driver.Valuer接口
func (d DimensionScoreMap) Value() (driver.Value, error) {
	return json.Marshal(d)
}

// Scan 实现sql.Scanner接口
func (d *DimensionScoreMap) Scan(value interface{}) error {
	if value == nil {
		*d = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, d)
}
