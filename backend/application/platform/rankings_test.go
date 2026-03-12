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
	"strings"
	"testing"

	"gorm.io/gorm"
)

func TestResolveStatsRankingsOrderExpr(t *testing.T) {
	validMetrics := []string{"calls", "tokens", "cost", "fail_rate"}
	for _, metric := range validMetrics {
		got, err := resolveStatsRankingsOrderExpr(metric)
		if err != nil {
			t.Fatalf("metric=%s should be valid, err=%v", metric, err)
		}
		if strings.TrimSpace(got) == "" {
			t.Fatalf("metric=%s got empty order expression", metric)
		}
	}

	if _, err := resolveStatsRankingsOrderExpr("invalid"); err == nil {
		t.Fatalf("invalid metric should return error")
	}
}

func TestStatsRankingsListSQL(t *testing.T) {
	db := mustNewDryRunDB(t)
	req := &StatsRankingsReq{
		StartTime:   1,
		EndTime:     2,
		Metric:      "fail_rate",
		Page:        1,
		Size:        20,
		SpaceIDs:    []int64{10001},
		ProjectType: "agent",
	}

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		svc := &PlatformApplicationService{db: tx}
		q := svc.statsRankingBaseQuery(context.Background()).
			Select(
				"br.project_type AS project_type, br.project_id AS project_id, "+projectNameCaseExpr+" AS project_name, "+
					"COUNT(1) AS calls, "+
					"COALESCE(SUM(br.usage_tokens),0) AS tokens, "+
					"COALESCE(SUM(br.amount),0) AS cost, "+
					"COALESCE(SUM(CASE WHEN br.status != 'success' THEN 1 ELSE 0 END),0) AS failed_calls, "+
					"COUNT(1) AS total_calls, "+
					"CASE WHEN COUNT(1)=0 THEN 0 ELSE SUM(CASE WHEN br.status != 'success' THEN 1 ELSE 0 END) / COUNT(1) END AS fail_rate_value").
			Where("br.occurred_at BETWEEN ? AND ?", req.StartTime, req.EndTime)
		q = withStatsRankingFilter(q, req)
		return q.
			Group("br.project_type, br.project_id, sad.name, ad.name, wm.name").
			Order("fail_rate_value DESC, project_id DESC").
			Find(&[]statsRankingRow{})
	})

	expectedFragments := []string{
		"COUNT(1) AS calls",
		"SUM(br.usage_tokens)",
		"SUM(br.amount)",
		"SUM(CASE WHEN br.status != 'success' THEN 1 ELSE 0 END)",
		"fail_rate_value",
		"project_type =",
		"space_id IN",
		"GROUP BY br.project_type, br.project_id, sad.name, ad.name, wm.name",
	}
	for _, frag := range expectedFragments {
		if !strings.Contains(sql, frag) {
			t.Fatalf("missing sql fragment %q, sql=%s", frag, sql)
		}
	}
}
