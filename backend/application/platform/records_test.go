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
	gormtests "gorm.io/gorm/utils/tests"
)

func TestResolveRecordOrderExpr(t *testing.T) {
	t.Run("valid order", func(t *testing.T) {
		got, err := resolveRecordOrderExpr("occurred_at", "desc")
		if err != nil {
			t.Fatalf("resolveRecordOrderExpr returned error: %v", err)
		}
		if got != "br.occurred_at desc" {
			t.Fatalf("unexpected order expr: %s", got)
		}
	})

	t.Run("invalid order_by", func(t *testing.T) {
		_, err := resolveRecordOrderExpr("created_at", "desc")
		if err == nil {
			t.Fatalf("expected error for invalid order_by")
		}
	})

	t.Run("invalid order_direction", func(t *testing.T) {
		_, err := resolveRecordOrderExpr("amount", "down")
		if err == nil {
			t.Fatalf("expected error for invalid order_direction")
		}
	})
}

func TestRecordListSQLKeywordMatchesNameOnly(t *testing.T) {
	db := mustNewDryRunDB(t)
	req := &BillingRecordsReq{
		StartTime:      1,
		EndTime:        2,
		Page:           1,
		Size:           20,
		Keyword:        "demo",
		ProjectType:    "all",
		OrderBy:        "occurred_at",
		OrderDirection: "desc",
	}

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		svc := &PlatformApplicationService{db: tx}
		q := svc.billingRecordBaseQuery(context.Background()).Select("br.id")
		q = withRecordListFilter(q, req)
		return q.Find(&[]BillingRecordItem{})
	})

	expectedFragments := []string{
		"s.name LIKE",
		"sad.name LIKE",
		"ad.name LIKE",
		"wm.name LIKE",
	}
	for _, frag := range expectedFragments {
		if !strings.Contains(sql, frag) {
			t.Fatalf("keyword clause mismatch, missing %q, sql=%s", frag, sql)
		}
	}
	if strings.Contains(sql, "request_id LIKE ?") {
		t.Fatalf("keyword should not match request_id, sql=%s", sql)
	}
	if strings.Contains(sql, "model_id LIKE ?") {
		t.Fatalf("keyword should not match model_id, sql=%s", sql)
	}
	if strings.Contains(sql, "CAST(br.project_id AS CHAR) LIKE ?") {
		t.Fatalf("keyword should not match project_id cast, sql=%s", sql)
	}
}

func TestRecordListSQLProjectNameCaseExpr(t *testing.T) {
	db := mustNewDryRunDB(t)

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		svc := &PlatformApplicationService{db: tx}
		return svc.billingRecordBaseQuery(context.Background()).
			Select("br.id, " + projectNameCaseExpr + " AS project_name").
			Find(&[]BillingRecordItem{})
	})

	expectedFragments := []string{
		"CASE br.project_type",
		"WHEN 'agent' THEN COALESCE(sad.name,'')",
		"WHEN 'app' THEN COALESCE(ad.name,'')",
		"WHEN 'workflow' THEN COALESCE(wm.name,'')",
		"AS project_name",
		"LEFT JOIN single_agent_draft AS sad",
		"LEFT JOIN app_draft AS ad",
		"LEFT JOIN workflow_meta AS wm",
	}
	for _, frag := range expectedFragments {
		if !strings.Contains(sql, frag) {
			t.Fatalf("missing sql fragment %q, sql=%s", frag, sql)
		}
	}
}

func mustNewDryRunDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(
		gormtests.DummyDialector{},
		&gorm.Config{
			DryRun: true,
		},
	)
	if err != nil {
		t.Fatalf("gorm.Open failed: %v", err)
	}

	return db
}
