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
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestNormalizeBudgetThresholds(t *testing.T) {
	input := []int{90, 70, 70, 100, 0, 101}
	got := normalizeBudgetThresholds(input)
	want := []int{70, 90, 100}

	if len(got) != len(want) {
		t.Fatalf("unexpected thresholds length: got=%d want=%d", len(got), len(want))
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected threshold at %d: got=%d want=%d", i, got[i], want[i])
		}
	}
}

func TestCollectTriggeredBudgetThresholds(t *testing.T) {
	thresholds := []int{70, 90, 100}

	got := collectTriggeredBudgetThresholds(thresholds, 89.99)
	if len(got) != 1 || got[0] != 70 {
		t.Fatalf("unexpected result for 89.99: %#v", got)
	}

	got = collectTriggeredBudgetThresholds(thresholds, 100)
	if len(got) != 3 {
		t.Fatalf("unexpected result for 100: %#v", got)
	}
}

func TestTryMarkBudgetAlertSentInMemory(t *testing.T) {
	svc := &PlatformApplicationService{}

	first, err := svc.tryMarkBudgetAlertSent(context.Background(), "2026-03", 10001, 70)
	if err != nil {
		t.Fatalf("first mark failed: %v", err)
	}
	if !first {
		t.Fatalf("first mark should return true")
	}

	second, err := svc.tryMarkBudgetAlertSent(context.Background(), "2026-03", 10001, 70)
	if err != nil {
		t.Fatalf("second mark failed: %v", err)
	}
	if second {
		t.Fatalf("second mark should return false")
	}
}

func TestCurrentMonthBounds(t *testing.T) {
	loc, _ := time.LoadLocation("Asia/Shanghai")
	now := time.Date(2026, 3, 10, 12, 0, 0, 0, loc)

	monthKey, startMS, endMS := currentMonthBounds(now, loc)
	if monthKey != "2026-03" {
		t.Fatalf("unexpected month key: %s", monthKey)
	}

	start := time.UnixMilli(startMS).In(loc)
	end := time.UnixMilli(endMS).In(loc)
	if start.Day() != 1 || start.Hour() != 0 || start.Minute() != 0 {
		t.Fatalf("unexpected month start: %s", start)
	}
	if end.Day() != 31 || end.Hour() != 23 || end.Minute() != 59 {
		t.Fatalf("unexpected month end: %s", end)
	}
}

func TestCheckBudgetAlertsDeduplicate(t *testing.T) {
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

	loc, _ := time.LoadLocation("Asia/Shanghai")
	now := time.Date(2026, 3, 10, 12, 0, 0, 0, loc)
	_, startMS, endMS := currentMonthBounds(now, loc)

	mock.ExpectQuery("SELECT .*alarm_thresholds.*over_limit_policy.*FROM .*billing_budget_rules.*").
		WillReturnRows(sqlmock.NewRows([]string{
			"space_id", "space_name", "monthly_budget", "alarm_thresholds", "over_limit_policy",
		}).AddRow(10001, "Space-A", "100.00", "70,90,100", "warn"))
	mock.ExpectQuery("SELECT .*COALESCE\\(SUM\\(amount\\),0\\).*FROM .*billing_records.*space_id = \\?.*occurred_at BETWEEN \\? AND \\?").
		WithArgs(int64(10001), startMS, endMS).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(95))

	mock.ExpectQuery("SELECT .*alarm_thresholds.*over_limit_policy.*FROM .*billing_budget_rules.*").
		WillReturnRows(sqlmock.NewRows([]string{
			"space_id", "space_name", "monthly_budget", "alarm_thresholds", "over_limit_policy",
		}).AddRow(10001, "Space-A", "100.00", "70,90,100", "warn"))
	mock.ExpectQuery("SELECT .*COALESCE\\(SUM\\(amount\\),0\\).*FROM .*billing_records.*space_id = \\?.*occurred_at BETWEEN \\? AND \\?").
		WithArgs(int64(10001), startMS, endMS).
		WillReturnRows(sqlmock.NewRows([]string{"sum"}).AddRow(95))

	svc := &PlatformApplicationService{
		db:               db,
		budgetAlertMarks: make(map[string]struct{}),
	}

	first, err := svc.CheckBudgetAlerts(context.Background(), now)
	if err != nil {
		t.Fatalf("first check failed: %v", err)
	}
	if first.CheckedSpaces != 1 || first.TriggeredAlerts != 2 || first.Deduplicated != 0 || first.FailedChecks != 0 {
		t.Fatalf("unexpected first check result: %#v", first)
	}

	second, err := svc.CheckBudgetAlerts(context.Background(), now)
	if err != nil {
		t.Fatalf("second check failed: %v", err)
	}
	if second.CheckedSpaces != 1 || second.TriggeredAlerts != 0 || second.Deduplicated != 2 || second.FailedChecks != 0 {
		t.Fatalf("unexpected second check result: %#v", second)
	}

	if err = mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}
