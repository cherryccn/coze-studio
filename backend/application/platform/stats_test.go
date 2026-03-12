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
	"strings"
	"testing"

	"gorm.io/gorm"
)

func TestCalcStatsRate(t *testing.T) {
	if got := calcStatsRate(0, 0); got != "0.0000" {
		t.Fatalf("unexpected zero rate: %s", got)
	}
	if got := calcStatsRate(1, 3); got != "0.3333" {
		t.Fatalf("unexpected 1/3 rate: %s", got)
	}
	if got := calcStatsRate(2, 3); got != "0.6667" {
		t.Fatalf("unexpected 2/3 rate: %s", got)
	}
}

func TestStatsOverviewAggSQL(t *testing.T) {
	db := mustNewDryRunDB(t)
	req := &StatsOverviewReq{
		StartTime:   1,
		EndTime:     2,
		SpaceIDs:    []int64{1, 2},
		ProjectType: "agent",
	}

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		q := tx.Table("billing_daily_agg").
			Select("COALESCE(SUM(success_count),0) AS success_calls, COALESCE(SUM(success_count + fail_count),0) AS total_calls, COALESCE(SUM(total_tokens),0) AS total_tokens").
			Where("dt BETWEEN ? AND ?", "2026-03-01", "2026-03-09")
		q = withStatsDailyAggFilter(q, req)
		return q.Find(&statsOverviewAggRow{})
	})

	expectedFragments := []string{
		"SUM(success_count + fail_count)",
		"SUM(total_tokens)",
		"space_id IN",
		"project_type =",
	}
	for _, frag := range expectedFragments {
		if !strings.Contains(sql, frag) {
			t.Fatalf("missing sql fragment %q, sql=%s", frag, sql)
		}
	}
}

func TestStatsOverviewProjectSQL(t *testing.T) {
	db := mustNewDryRunDB(t)
	req := &StatsOverviewReq{
		StartTime:   1,
		EndTime:     2,
		SpaceIDs:    []int64{10001},
		ProjectType: "workflow",
	}

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		q := tx.Table("billing_records").
			Select("COUNT(DISTINCT CONCAT(project_type, ':', project_id))").
			Where("occurred_at BETWEEN ? AND ?", req.StartTime, req.EndTime).
			Where("status = ?", "success")
		q = withStatsRecordFilter(q, req)
		return q.Find(&[]map[string]any{})
	})

	expectedFragments := []string{
		"COUNT(DISTINCT CONCAT(project_type, ':', project_id))",
		"status = \"success\"",
		"occurred_at BETWEEN",
		"space_id IN",
		"project_type =",
	}
	for _, frag := range expectedFragments {
		if !strings.Contains(sql, frag) {
			t.Fatalf("missing sql fragment %q, sql=%s", frag, sql)
		}
	}
}
