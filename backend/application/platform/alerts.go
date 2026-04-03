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
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/coze-dev/coze-studio/backend/pkg/logs"
	"github.com/coze-dev/coze-studio/backend/pkg/safego"
)

const (
	billingBudgetAlertSentCachePrefix  = "platform_billing_budget_alert_sent_"
	billingBudgetAlertEventCachePrefix = "platform_billing_budget_alert_event_"
	billingBudgetAlertDedupTTL         = 45 * 24 * time.Hour
	billingBudgetAlertDefaultInterval  = 5 * time.Minute
	billingBudgetAlertMinInterval      = time.Minute
)

type BillingBudgetAlertRunResult struct {
	CheckedSpaces   int `json:"checked_spaces"`
	TriggeredAlerts int `json:"triggered_alerts"`
	Deduplicated    int `json:"deduplicated"`
	FailedChecks    int `json:"failed_checks"`
}

type BillingBudgetAlertEvent struct {
	SpaceID         int64  `json:"space_id"`
	SpaceName       string `json:"space_name"`
	BudgetMonth     string `json:"budget_month"`
	AlarmThreshold  int    `json:"alarm_threshold"`
	UsageRate       string `json:"usage_rate"`
	CurrentSpend    string `json:"current_spend"`
	MonthlyBudget   string `json:"monthly_budget"`
	OverLimitPolicy string `json:"over_limit_policy"`
	TriggeredAt     int64  `json:"triggered_at"`
	Message         string `json:"message"`
}

type billingBudgetAlertRuleRow struct {
	SpaceID         int64  `gorm:"column:space_id"`
	SpaceName       string `gorm:"column:space_name"`
	MonthlyBudget   string `gorm:"column:monthly_budget"`
	AlarmThresholds string `gorm:"column:alarm_thresholds"`
	OverLimitPolicy string `gorm:"column:over_limit_policy"`
}

type billingBudgetAlertRule struct {
	SpaceID          int64
	SpaceName        string
	MonthlyBudget    float64
	MonthlyBudgetRaw string
	AlarmThresholds  []int
	OverLimitPolicy  string
}

func (p *PlatformApplicationService) startBudgetAlertWorker() {
	if p == nil || p.db == nil {
		return
	}

	p.budgetAlertOnce.Do(func() {
		if !isBillingBudgetAlertEnabled() {
			logs.Infof("[PlatformBudgetAlert] worker disabled by env")
			return
		}

		interval := resolveBillingBudgetAlertInterval()
		logs.Infof("[PlatformBudgetAlert] worker started, interval=%s", interval)

		safego.Go(context.Background(), func() {
			p.runBudgetAlertCheck(context.Background(), time.Now())

			ticker := time.NewTicker(interval)
			defer ticker.Stop()

			for range ticker.C {
				p.runBudgetAlertCheck(context.Background(), time.Now())
			}
		})
	})
}

func (p *PlatformApplicationService) runBudgetAlertCheck(ctx context.Context, now time.Time) {
	result, err := p.CheckBudgetAlerts(ctx, now)
	if err != nil {
		logs.CtxErrorf(ctx, "[PlatformBudgetAlert] check failed: %v", err)
		return
	}

	if result.TriggeredAlerts > 0 {
		logs.CtxInfof(ctx, "[PlatformBudgetAlert] check done: checked=%d triggered=%d deduplicated=%d failed=%d",
			result.CheckedSpaces, result.TriggeredAlerts, result.Deduplicated, result.FailedChecks)
	}
}

func (p *PlatformApplicationService) CheckBudgetAlerts(ctx context.Context, now time.Time) (*BillingBudgetAlertRunResult, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}
	if ctx == nil {
		ctx = context.Background()
	}
	if now.IsZero() {
		now = time.Now()
	}

	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil || loc == nil {
		loc = time.FixedZone("CST", 8*3600)
	}
	monthKey, monthStartMS, monthEndMS := currentMonthBounds(now.In(loc), loc)

	rules, err := p.listEnabledBudgetAlertRules(ctx)
	if err != nil {
		return nil, err
	}

	result := &BillingBudgetAlertRunResult{}
	for _, rule := range rules {
		result.CheckedSpaces++

		monthlySpend, err := p.queryMonthlySpaceSpend(ctx, rule.SpaceID, monthStartMS, monthEndMS)
		if err != nil {
			result.FailedChecks++
			continue
		}

		usageRate := calculateBudgetUsageRate(monthlySpend, rule.MonthlyBudget)
		triggered := collectTriggeredBudgetThresholds(rule.AlarmThresholds, usageRate)
		for _, threshold := range triggered {
			firstTrigger, markErr := p.tryMarkBudgetAlertSent(ctx, monthKey, rule.SpaceID, threshold)
			if markErr != nil {
				result.FailedChecks++
				continue
			}
			if !firstTrigger {
				result.Deduplicated++
				continue
			}

			event := buildBillingBudgetAlertEvent(rule, monthKey, threshold, monthlySpend, usageRate, now.In(loc))
			if err = p.persistBudgetAlertEvent(ctx, event); err != nil {
				logs.CtxWarnf(ctx, "[PlatformBudgetAlert] persist event failed, space_id=%d threshold=%d err=%v",
					rule.SpaceID, threshold, err)
			}
			logs.CtxInfof(ctx, "[PlatformBudgetAlert] %s", event.Message)
			result.TriggeredAlerts++
		}
	}

	return result, nil
}

func (p *PlatformApplicationService) listEnabledBudgetAlertRules(ctx context.Context) ([]billingBudgetAlertRule, error) {
	rows := make([]billingBudgetAlertRuleRow, 0)
	if err := p.db.WithContext(ctx).
		Table("billing_budget_rules AS b").
		Select("b.space_id AS space_id, COALESCE(s.name,'') AS space_name, b.monthly_budget AS monthly_budget, b.alarm_thresholds AS alarm_thresholds, b.over_limit_policy AS over_limit_policy").
		Joins("LEFT JOIN space AS s ON s.id = b.space_id AND s.deleted_at IS NULL").
		Where("b.enabled = 1").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	rules := make([]billingBudgetAlertRule, 0, len(rows))
	for _, row := range rows {
		monthlyBudget, err := parseBudgetAmount(row.MonthlyBudget)
		if err != nil || monthlyBudget <= 0 {
			continue
		}
		thresholds := normalizeBudgetThresholds(parseBudgetThresholds(row.AlarmThresholds))
		if len(thresholds) == 0 {
			continue
		}

		rules = append(rules, billingBudgetAlertRule{
			SpaceID:          row.SpaceID,
			SpaceName:        row.SpaceName,
			MonthlyBudget:    monthlyBudget,
			MonthlyBudgetRaw: strings.TrimSpace(row.MonthlyBudget),
			AlarmThresholds:  thresholds,
			OverLimitPolicy:  strings.TrimSpace(row.OverLimitPolicy),
		})
	}

	return rules, nil
}

func (p *PlatformApplicationService) queryMonthlySpaceSpend(ctx context.Context, spaceID int64, startMS, endMS int64) (float64, error) {
	var total float64
	err := p.db.WithContext(ctx).
		Table("billing_records").
		Select("COALESCE(SUM(amount),0)").
		Where("space_id = ? AND occurred_at BETWEEN ? AND ?", spaceID, startMS, endMS).
		Scan(&total).Error
	if err != nil {
		return 0, err
	}

	return total, nil
}

func (p *PlatformApplicationService) tryMarkBudgetAlertSent(ctx context.Context, monthKey string, spaceID int64, threshold int) (bool, error) {
	key := makeBillingBudgetAlertSentKey(monthKey, spaceID, threshold)
	if p.cacheCli != nil {
		seq, err := p.cacheCli.Incr(ctx, key).Result()
		if err != nil {
			return false, err
		}
		if seq == 1 {
			_ = p.cacheCli.Expire(ctx, key, billingBudgetAlertDedupTTL).Err()
			return true, nil
		}

		return false, nil
	}

	p.budgetAlertMu.Lock()
	defer p.budgetAlertMu.Unlock()

	if p.budgetAlertMarks == nil {
		p.budgetAlertMarks = make(map[string]struct{})
	}
	if _, exists := p.budgetAlertMarks[key]; exists {
		return false, nil
	}

	p.budgetAlertMarks[key] = struct{}{}
	return true, nil
}

func (p *PlatformApplicationService) persistBudgetAlertEvent(ctx context.Context, event *BillingBudgetAlertEvent) error {
	if event == nil || p.cacheCli == nil {
		return nil
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}

	key := makeBillingBudgetAlertEventKey(event.BudgetMonth, event.SpaceID, event.AlarmThreshold)
	return p.cacheCli.Set(ctx, key, string(payload), billingBudgetAlertDedupTTL).Err()
}

func currentMonthBounds(now time.Time, loc *time.Location) (monthKey string, startMS, endMS int64) {
	if loc == nil {
		loc = time.Local
	}

	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	nextMonth := monthStart.AddDate(0, 1, 0)
	monthEnd := nextMonth.Add(-time.Millisecond)

	return monthStart.Format("2006-01"), monthStart.UnixMilli(), monthEnd.UnixMilli()
}

func parseBudgetAmount(raw string) (float64, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0, errors.New("monthly_budget is empty")
	}

	return strconv.ParseFloat(raw, 64)
}

func normalizeBudgetThresholds(thresholds []int) []int {
	if len(thresholds) == 0 {
		return []int{}
	}

	sort.Ints(thresholds)
	result := make([]int, 0, len(thresholds))
	last := -1
	for _, threshold := range thresholds {
		if threshold <= 0 || threshold > 100 {
			continue
		}
		if threshold == last {
			continue
		}

		result = append(result, threshold)
		last = threshold
	}

	return result
}

func calculateBudgetUsageRate(spend, monthlyBudget float64) float64 {
	if monthlyBudget <= 0 {
		return 0
	}

	return spend * 100 / monthlyBudget
}

func collectTriggeredBudgetThresholds(thresholds []int, usageRate float64) []int {
	result := make([]int, 0, len(thresholds))
	for _, threshold := range thresholds {
		if usageRate >= float64(threshold) {
			result = append(result, threshold)
		}
	}

	return result
}

func buildBillingBudgetAlertEvent(rule billingBudgetAlertRule, monthKey string, threshold int, spend float64, usageRate float64, now time.Time) *BillingBudgetAlertEvent {
	policyText := "仅告警"
	if strings.EqualFold(rule.OverLimitPolicy, "reject") {
		policyText = "拒绝新增调用"
	}

	spaceName := strings.TrimSpace(rule.SpaceName)
	if spaceName == "" {
		spaceName = fmt.Sprintf("space-%d", rule.SpaceID)
	}

	usageRateText := strconv.FormatFloat(usageRate, 'f', 2, 64)
	spendText := strconv.FormatFloat(spend, 'f', 2, 64)

	return &BillingBudgetAlertEvent{
		SpaceID:         rule.SpaceID,
		SpaceName:       spaceName,
		BudgetMonth:     monthKey,
		AlarmThreshold:  threshold,
		UsageRate:       usageRateText,
		CurrentSpend:    spendText,
		MonthlyBudget:   rule.MonthlyBudgetRaw,
		OverLimitPolicy: rule.OverLimitPolicy,
		TriggeredAt:     now.UnixMilli(),
		Message: fmt.Sprintf(
			"[平台预算告警] 空间 %s（ID:%d）在 %s 的预算使用率达到 %s%%（阈值 %d%%，已使用 %s / %s），策略：%s。",
			spaceName, rule.SpaceID, monthKey, usageRateText, threshold, spendText, rule.MonthlyBudgetRaw, policyText,
		),
	}
}

func makeBillingBudgetAlertSentKey(monthKey string, spaceID int64, threshold int) string {
	return fmt.Sprintf("%s%s_%d_%d", billingBudgetAlertSentCachePrefix, monthKey, spaceID, threshold)
}

func makeBillingBudgetAlertEventKey(monthKey string, spaceID int64, threshold int) string {
	return fmt.Sprintf("%s%s_%d_%d", billingBudgetAlertEventCachePrefix, monthKey, spaceID, threshold)
}

func resolveBillingBudgetAlertInterval() time.Duration {
	raw := strings.TrimSpace(os.Getenv("PLATFORM_BUDGET_ALERT_INTERVAL_SEC"))
	if raw == "" {
		return billingBudgetAlertDefaultInterval
	}

	seconds, err := strconv.Atoi(raw)
	if err != nil {
		return billingBudgetAlertDefaultInterval
	}
	if seconds < int(billingBudgetAlertMinInterval.Seconds()) {
		return billingBudgetAlertMinInterval
	}

	return time.Duration(seconds) * time.Second
}

func isBillingBudgetAlertEnabled() bool {
	raw := strings.TrimSpace(strings.ToLower(os.Getenv("PLATFORM_BUDGET_ALERT_ENABLED")))
	switch raw {
	case "", "1", "true", "on", "yes":
		return true
	case "0", "false", "off", "no":
		return false
	default:
		return true
	}
}
