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
	"fmt"
	"time"

	"gorm.io/gorm"
)

type StatsOverviewReq struct {
	StartTime   int64
	EndTime     int64
	SpaceIDs    []int64
	ProjectType string
}

type StatsOverviewResp struct {
	ActiveSpaceDAU     int64  `json:"active_space_dau"`
	ActiveSpaceWAU     int64  `json:"active_space_wau"`
	ActiveProjectCount int64  `json:"active_project_count"`
	TotalCalls         int64  `json:"total_calls"`
	SuccessRate        string `json:"success_rate"`
	AvgLatencyMS       int64  `json:"avg_latency_ms"`
	TotalTokens        int64  `json:"total_tokens"`
}

type statsOverviewAggRow struct {
	SuccessCalls int64 `gorm:"column:success_calls"`
	TotalCalls   int64 `gorm:"column:total_calls"`
	TotalTokens  int64 `gorm:"column:total_tokens"`
}

func (p *PlatformApplicationService) GetStatsOverview(ctx context.Context, req *StatsOverviewReq) (*StatsOverviewResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}

	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		loc = time.FixedZone("CST", 8*3600)
	}
	startDate := time.UnixMilli(req.StartTime).In(loc).Format(time.DateOnly)
	endDate := time.UnixMilli(req.EndTime).In(loc).Format(time.DateOnly)

	resp := &StatsOverviewResp{
		SuccessRate: "0.0000",
	}

	// active space DAU: end_date day active spaces (at least one successful call).
	qDAU := p.db.WithContext(ctx).
		Table("billing_daily_agg").
		Select("COUNT(DISTINCT space_id)").
		Where("dt = ? AND success_count > 0", endDate)
	qDAU = withStatsDailyAggFilter(qDAU, req)
	if err := qDAU.Scan(&resp.ActiveSpaceDAU).Error; err != nil {
		return nil, err
	}

	// active space WAU: last 7 days active spaces, clipped by current query range.
	wauStart := time.UnixMilli(req.EndTime).In(loc).AddDate(0, 0, -6).Format(time.DateOnly)
	if req.StartTime > time.UnixMilli(req.EndTime).In(loc).AddDate(0, 0, -6).UnixMilli() {
		wauStart = startDate
	}

	qWAU := p.db.WithContext(ctx).
		Table("billing_daily_agg").
		Select("COUNT(DISTINCT space_id)").
		Where("dt BETWEEN ? AND ? AND success_count > 0", wauStart, endDate)
	qWAU = withStatsDailyAggFilter(qWAU, req)
	if err := qWAU.Scan(&resp.ActiveSpaceWAU).Error; err != nil {
		return nil, err
	}

	// active project count: count distinct project identity during the selected window.
	qProject := p.db.WithContext(ctx).
		Table("billing_records").
		Select("COUNT(DISTINCT CONCAT(project_type, ':', project_id))").
		Where("occurred_at BETWEEN ? AND ?", req.StartTime, req.EndTime).
		Where("status = ?", "success")
	qProject = withStatsRecordFilter(qProject, req)
	if err := qProject.Scan(&resp.ActiveProjectCount).Error; err != nil {
		return nil, err
	}

	// summary metrics from daily aggregation table.
	var agg statsOverviewAggRow
	qAgg := p.db.WithContext(ctx).
		Table("billing_daily_agg").
		Select("COALESCE(SUM(success_count),0) AS success_calls, COALESCE(SUM(success_count + fail_count),0) AS total_calls, COALESCE(SUM(total_tokens),0) AS total_tokens").
		Where("dt BETWEEN ? AND ?", startDate, endDate)
	qAgg = withStatsDailyAggFilter(qAgg, req)
	if err := qAgg.Scan(&agg).Error; err != nil {
		return nil, err
	}

	resp.TotalCalls = agg.TotalCalls
	resp.TotalTokens = agg.TotalTokens
	resp.SuccessRate = calcStatsRate(agg.SuccessCalls, agg.TotalCalls)
	// TODO: latency source table/field is not in current billing schema, keep 0 for MVP.
	resp.AvgLatencyMS = 0

	return resp, nil
}

func withStatsDailyAggFilter(db *gorm.DB, req *StatsOverviewReq) *gorm.DB {
	if len(req.SpaceIDs) > 0 {
		db = db.Where("space_id IN ?", req.SpaceIDs)
	}
	if req.ProjectType != "" && req.ProjectType != "all" {
		db = db.Where("project_type = ?", req.ProjectType)
	}

	return db
}

func withStatsRecordFilter(db *gorm.DB, req *StatsOverviewReq) *gorm.DB {
	if len(req.SpaceIDs) > 0 {
		db = db.Where("space_id IN ?", req.SpaceIDs)
	}
	if req.ProjectType != "" && req.ProjectType != "all" {
		db = db.Where("project_type = ?", req.ProjectType)
	}

	return db
}

func calcStatsRate(numerator, denominator int64) string {
	if denominator <= 0 || numerator <= 0 {
		return "0.0000"
	}

	return fmt.Sprintf("%.4f", float64(numerator)/float64(denominator))
}
