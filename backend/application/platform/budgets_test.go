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
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestValidateBudgetRule(t *testing.T) {
	valid := BillingBudgetRule{
		SpaceID:         1,
		MonthlyBudget:   "5000.00",
		AlarmThresholds: []int{70, 90, 100},
		OverLimitPolicy: "warn",
		Enabled:         true,
	}
	if err := validateBudgetRule(valid); err != nil {
		t.Fatalf("validateBudgetRule returned error for valid rule: %v", err)
	}

	invalidCases := []BillingBudgetRule{
		{SpaceID: 0, MonthlyBudget: "1", AlarmThresholds: []int{70}, OverLimitPolicy: "warn"},
		{SpaceID: 1, MonthlyBudget: "", AlarmThresholds: []int{70}, OverLimitPolicy: "warn"},
		{SpaceID: 1, MonthlyBudget: "abc", AlarmThresholds: []int{70}, OverLimitPolicy: "warn"},
		{SpaceID: 1, MonthlyBudget: "1", AlarmThresholds: []int{70}, OverLimitPolicy: "invalid"},
		{SpaceID: 1, MonthlyBudget: "1", AlarmThresholds: nil, OverLimitPolicy: "warn"},
		{SpaceID: 1, MonthlyBudget: "1", AlarmThresholds: []int{0}, OverLimitPolicy: "warn"},
		{SpaceID: 1, MonthlyBudget: "1", AlarmThresholds: []int{101}, OverLimitPolicy: "warn"},
	}

	for idx, c := range invalidCases {
		if err := validateBudgetRule(c); err == nil {
			t.Fatalf("case %d should be invalid", idx)
		}
	}
}

func TestBudgetThresholdTransform(t *testing.T) {
	thresholds := []int{70, 90, 100}
	raw := stringifyBudgetThresholds(thresholds)
	if raw != "70,90,100" {
		t.Fatalf("unexpected stringify result: %s", raw)
	}

	parsed := parseBudgetThresholds(raw)
	if len(parsed) != len(thresholds) {
		t.Fatalf("unexpected parsed length: %d", len(parsed))
	}
	for i := range thresholds {
		if parsed[i] != thresholds[i] {
			t.Fatalf("unexpected threshold at index %d: %d", i, parsed[i])
		}
	}

	parsedFromDirty := parseBudgetThresholds("70, bad, 90, ,100")
	if len(parsedFromDirty) != 3 {
		t.Fatalf("unexpected parsed length from dirty input: %d", len(parsedFromDirty))
	}
}

func TestGetBillingBudgetsKeepThresholdAndPolicy(t *testing.T) {
	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("create sqlmock failed: %v", err)
	}
	defer sqlDB.Close()

	db, err := gorm.Open(mysql.New(mysql.Config{
		Conn:                      sqlDB,
		SkipInitializeWithVersion: true,
	}), &gorm.Config{})
	if err != nil {
		t.Fatalf("open gorm db failed: %v", err)
	}

	mock.ExpectQuery(regexp.QuoteMeta("SELECT count(*) FROM billing_budget_rules AS b WHERE b.space_id IN (?)")).
		WithArgs(int64(10001)).
		WillReturnRows(sqlmock.NewRows([]string{"count(*)"}).AddRow(1))
	mock.ExpectQuery("SELECT .*alarm_thresholds.*over_limit_policy.*FROM billing_budget_rules AS b.*").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "space_id", "space_name", "monthly_budget", "alarm_thresholds", "over_limit_policy", "enabled", "updated_by", "updated_at",
		}).AddRow(1, 10001, "Space-A", "5000.00", "70,90,100", "warn", 1, 999, 1773023587762))

	svc := &PlatformApplicationService{db: db}
	resp, err := svc.GetBillingBudgets(context.Background(), &BillingBudgetsQueryReq{
		Page:     1,
		Size:     50,
		SpaceIDs: []int64{10001},
	})
	if err != nil {
		t.Fatalf("GetBillingBudgets returned error: %v", err)
	}
	if resp.Total != 1 || len(resp.List) != 1 {
		t.Fatalf("unexpected response size, total=%d len=%d", resp.Total, len(resp.List))
	}

	item := resp.List[0]
	if item.OverLimitPolicy != "warn" {
		t.Fatalf("unexpected over_limit_policy: %s", item.OverLimitPolicy)
	}
	if len(item.AlarmThresholds) != 3 {
		t.Fatalf("unexpected thresholds length: %d", len(item.AlarmThresholds))
	}
	if item.AlarmThresholds[0] != 70 || item.AlarmThresholds[1] != 90 || item.AlarmThresholds[2] != 100 {
		t.Fatalf("unexpected thresholds value: %#v", item.AlarmThresholds)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}
