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

package platform

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"
)

type BillingBudgetsQueryReq struct {
	Page     int
	Size     int
	SpaceIDs []int64
}

type BillingBudgetsQueryResp struct {
	Page  int                `json:"page"`
	Size  int                `json:"size"`
	Total int64              `json:"total"`
	List  []BillingBudgetDTO `json:"list"`
}

type BillingBudgetDTO struct {
	ID              int64  `json:"id"`
	SpaceID         int64  `json:"space_id"`
	SpaceName       string `json:"space_name"`
	MonthlyBudget   string `json:"monthly_budget"`
	AlarmThresholds []int  `json:"alarm_thresholds"`
	OverLimitPolicy string `json:"over_limit_policy"`
	Enabled         bool   `json:"enabled"`
	UpdatedBy       int64  `json:"updated_by"`
	UpdatedAt       int64  `json:"updated_at"`
}

type BillingBudgetUpsertReq struct {
	Rules []BillingBudgetRule `json:"rules"`
}

type BillingBudgetRule struct {
	SpaceID         int64  `json:"space_id"`
	MonthlyBudget   string `json:"monthly_budget"`
	AlarmThresholds []int  `json:"alarm_thresholds"`
	OverLimitPolicy string `json:"over_limit_policy"`
	Enabled         bool   `json:"enabled"`
}

type BillingBudgetUpsertResp struct {
	SuccessCount int                      `json:"success_count"`
	Failed       []BillingBudgetSaveError `json:"failed"`
}

type BillingBudgetSaveError struct {
	SpaceID int64  `json:"space_id"`
	Msg     string `json:"msg"`
}

type billingBudgetRow struct {
	ID             int64  `gorm:"column:id"`
	SpaceID        int64  `gorm:"column:space_id"`
	SpaceName      string `gorm:"column:space_name"`
	MonthlyBudget  string `gorm:"column:monthly_budget"`
	AlarmThreshold string `gorm:"column:alarm_thresholds"`
	OverLimit      string `gorm:"column:over_limit_policy"`
	Enabled        int64  `gorm:"column:enabled"`
	UpdatedBy      int64  `gorm:"column:updated_by"`
	UpdatedAt      int64  `gorm:"column:updated_at"`
}

func (p *PlatformApplicationService) GetBillingBudgets(ctx context.Context, req *BillingBudgetsQueryReq) (*BillingBudgetsQueryResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}

	resp := &BillingBudgetsQueryResp{
		Page: req.Page,
		Size: req.Size,
		List: make([]BillingBudgetDTO, 0),
	}

	countDB := p.db.WithContext(ctx).Table("billing_budget_rules AS b")
	if len(req.SpaceIDs) > 0 {
		countDB = countDB.Where("b.space_id IN ?", req.SpaceIDs)
	}
	if err := countDB.Count(&resp.Total).Error; err != nil {
		return nil, err
	}
	if resp.Total == 0 {
		return resp, nil
	}

	rows := make([]billingBudgetRow, 0, req.Size)
	queryDB := p.db.WithContext(ctx).
		Table("billing_budget_rules AS b").
		Select("b.id AS id, b.space_id AS space_id, COALESCE(s.name,'') AS space_name, b.monthly_budget AS monthly_budget, b.alarm_thresholds AS alarm_thresholds, b.over_limit_policy AS over_limit_policy, b.enabled AS enabled, b.updated_by AS updated_by, b.updated_at AS updated_at").
		Joins("LEFT JOIN space AS s ON s.id = b.space_id AND s.deleted_at IS NULL")
	if len(req.SpaceIDs) > 0 {
		queryDB = queryDB.Where("b.space_id IN ?", req.SpaceIDs)
	}
	if err := queryDB.
		Order("b.updated_at DESC").
		Offset((req.Page - 1) * req.Size).
		Limit(req.Size).
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	resp.List = make([]BillingBudgetDTO, 0, len(rows))
	for _, row := range rows {
		resp.List = append(resp.List, BillingBudgetDTO{
			ID:              row.ID,
			SpaceID:         row.SpaceID,
			SpaceName:       row.SpaceName,
			MonthlyBudget:   row.MonthlyBudget,
			AlarmThresholds: parseBudgetThresholds(row.AlarmThreshold),
			OverLimitPolicy: row.OverLimit,
			Enabled:         row.Enabled == 1,
			UpdatedBy:       row.UpdatedBy,
			UpdatedAt:       row.UpdatedAt,
		})
	}

	return resp, nil
}

func (p *PlatformApplicationService) SaveBillingBudgets(ctx context.Context, req *BillingBudgetUpsertReq, operatorID int64) (*BillingBudgetUpsertResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}
	if req == nil || len(req.Rules) == 0 {
		return nil, errors.New("rules is empty")
	}

	resp := &BillingBudgetUpsertResp{
		Failed: make([]BillingBudgetSaveError, 0),
	}
	nowMS := time.Now().UnixMilli()

	for _, rule := range req.Rules {
		if err := validateBudgetRule(rule); err != nil {
			resp.Failed = append(resp.Failed, BillingBudgetSaveError{
				SpaceID: rule.SpaceID,
				Msg:     err.Error(),
			})
			continue
		}

		enabled := 0
		if rule.Enabled {
			enabled = 1
		}
		thresholds := stringifyBudgetThresholds(rule.AlarmThresholds)

		err := p.db.WithContext(ctx).Exec(`
			INSERT INTO billing_budget_rules
				(space_id, monthly_budget, alarm_thresholds, over_limit_policy, enabled, updated_by, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE
				monthly_budget = VALUES(monthly_budget),
				alarm_thresholds = VALUES(alarm_thresholds),
				over_limit_policy = VALUES(over_limit_policy),
				enabled = VALUES(enabled),
				updated_by = VALUES(updated_by),
				updated_at = VALUES(updated_at)
		`, rule.SpaceID, rule.MonthlyBudget, thresholds, rule.OverLimitPolicy, enabled, operatorID, nowMS).Error
		if err != nil {
			resp.Failed = append(resp.Failed, BillingBudgetSaveError{
				SpaceID: rule.SpaceID,
				Msg:     err.Error(),
			})
			continue
		}

		resp.SuccessCount++
	}

	return resp, nil
}

func validateBudgetRule(rule BillingBudgetRule) error {
	if rule.SpaceID <= 0 {
		return errors.New("space_id is invalid")
	}
	if strings.TrimSpace(rule.MonthlyBudget) == "" {
		return errors.New("monthly_budget is empty")
	}
	if _, err := strconv.ParseFloat(strings.TrimSpace(rule.MonthlyBudget), 64); err != nil {
		return errors.New("monthly_budget is invalid")
	}
	if !isValidBudgetOverLimitPolicy(rule.OverLimitPolicy) {
		return errors.New("over_limit_policy is invalid")
	}
	if len(rule.AlarmThresholds) == 0 {
		return errors.New("alarm_thresholds is empty")
	}
	for _, threshold := range rule.AlarmThresholds {
		if threshold <= 0 || threshold > 100 {
			return errors.New("alarm_thresholds contains invalid value")
		}
	}

	return nil
}

func stringifyBudgetThresholds(thresholds []int) string {
	if len(thresholds) == 0 {
		return ""
	}

	parts := make([]string, 0, len(thresholds))
	for _, threshold := range thresholds {
		parts = append(parts, strconv.Itoa(threshold))
	}

	return strings.Join(parts, ",")
}

func parseBudgetThresholds(raw string) []int {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return []int{}
	}

	parts := strings.Split(raw, ",")
	res := make([]int, 0, len(parts))
	for _, part := range parts {
		p := strings.TrimSpace(part)
		if p == "" {
			continue
		}
		val, err := strconv.Atoi(p)
		if err != nil {
			continue
		}
		res = append(res, val)
	}

	return res
}

func isValidBudgetOverLimitPolicy(policy string) bool {
	switch policy {
	case "warn", "reject":
		return true
	default:
		return false
	}
}
