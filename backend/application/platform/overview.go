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
	"sync"
	"time"

	"github.com/coze-dev/coze-studio/backend/infra/cache"
	"gorm.io/gorm"
)

type BillingOverviewReq struct {
	StartTime      int64
	EndTime        int64
	SpaceIDs       []int64
	ProjectType    string
	TopSpacesOrder string // "asc" or "desc" (default "desc")
}

type BillingOverviewResp struct {
	Cards      BillingOverviewCards `json:"cards"`
	CostTrend  []CostTrendItem      `json:"cost_trend"`
	TokenTrend []TokenTrendItem     `json:"token_trend"`
	TopSpaces  []TopSpaceItem       `json:"top_spaces"`
}

type BillingOverviewCards struct {
	TodayCost        string `json:"today_cost"`
	MonthCost        string `json:"month_cost"`
	TokenConsumption int64  `json:"token_consumption"`
	ActiveSpaceCount int64  `json:"active_space_count"`
}

type CostTrendItem struct {
	Date   string `json:"date"`
	Amount string `json:"amount"`
}

type TokenTrendItem struct {
	Date   string `json:"date"`
	Tokens int64  `json:"tokens"`
}

type TopSpaceItem struct {
	SpaceID   int64  `json:"space_id"`
	SpaceName string `json:"space_name"`
	Amount    string `json:"amount"`
	Tokens    int64  `json:"tokens"`
}

type PlatformApplicationService struct {
	db               *gorm.DB
	cacheCli         cache.Cmdable
	exportTaskMu     sync.RWMutex
	exportTasks      map[string]billingExportTask
	budgetAlertOnce  sync.Once
	budgetAlertMu    sync.Mutex
	budgetAlertMarks map[string]struct{}
}

var PlatformApplicationSVC = &PlatformApplicationService{}

func InitService(db *gorm.DB, cacheCli cache.Cmdable) *PlatformApplicationService {
	PlatformApplicationSVC.db = db
	PlatformApplicationSVC.cacheCli = cacheCli
	if PlatformApplicationSVC.exportTasks == nil {
		PlatformApplicationSVC.exportTasks = make(map[string]billingExportTask)
	}
	if PlatformApplicationSVC.budgetAlertMarks == nil {
		PlatformApplicationSVC.budgetAlertMarks = make(map[string]struct{})
	}
	PlatformApplicationSVC.startBudgetAlertWorker()

	return PlatformApplicationSVC
}

func (p *PlatformApplicationService) GetBillingOverview(ctx context.Context, req *BillingOverviewReq) (*BillingOverviewResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}

	resp := &BillingOverviewResp{
		Cards: BillingOverviewCards{
			TodayCost: "0",
			MonthCost: "0",
		},
		CostTrend:  make([]CostTrendItem, 0),
		TokenTrend: make([]TokenTrendItem, 0),
		TopSpaces:  make([]TopSpaceItem, 0),
	}

	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		loc = time.FixedZone("CST", 8*3600)
	}
	now := time.Now().In(loc)

	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).UnixMilli()
	todayEnd := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, int(time.Millisecond-time.Nanosecond), loc).UnixMilli()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc).UnixMilli()

	todayStart, todayEnd = clipRange(todayStart, todayEnd, req.StartTime, req.EndTime)
	monthStart, _ = clipRange(monthStart, req.EndTime, req.StartTime, req.EndTime)

	// today cost
	if todayStart <= todayEnd {
		q := p.db.WithContext(ctx).Table("billing_records").Select("COALESCE(SUM(amount),0)")
		q = withRecordFilter(q, req, todayStart, todayEnd)
		if err := q.Scan(&resp.Cards.TodayCost).Error; err != nil {
			return nil, err
		}
	}

	// month cost
	if monthStart <= req.EndTime {
		q := p.db.WithContext(ctx).Table("billing_records").Select("COALESCE(SUM(amount),0)")
		q = withRecordFilter(q, req, monthStart, req.EndTime)
		if err := q.Scan(&resp.Cards.MonthCost).Error; err != nil {
			return nil, err
		}
	}

	// token consumption
	qToken := p.db.WithContext(ctx).Table("billing_records").Select("COALESCE(SUM(usage_tokens),0)")
	qToken = withRecordFilter(qToken, req, req.StartTime, req.EndTime)
	if err := qToken.Scan(&resp.Cards.TokenConsumption).Error; err != nil {
		return nil, err
	}

	// active space count
	qActive := p.db.WithContext(ctx).Table("billing_records").Select("COUNT(DISTINCT space_id)").Where("status = ?", "success")
	qActive = withRecordFilter(qActive, req, req.StartTime, req.EndTime)
	if err := qActive.Scan(&resp.Cards.ActiveSpaceCount).Error; err != nil {
		return nil, err
	}

	startDate := time.UnixMilli(req.StartTime).In(loc).Format(time.DateOnly)
	endDate := time.UnixMilli(req.EndTime).In(loc).Format(time.DateOnly)

	// cost trend
	qCostTrend := p.db.WithContext(ctx).
		Table("billing_daily_agg").
		Select("dt AS date, COALESCE(SUM(total_amount),0) AS amount").
		Where("dt BETWEEN ? AND ?", startDate, endDate)
	qCostTrend = withDailyAggFilter(qCostTrend, req)
	if err := qCostTrend.Group("dt").Order("dt ASC").Scan(&resp.CostTrend).Error; err != nil {
		return nil, err
	}

	// token trend
	qTokenTrend := p.db.WithContext(ctx).
		Table("billing_daily_agg").
		Select("dt AS date, COALESCE(SUM(total_tokens),0) AS tokens").
		Where("dt BETWEEN ? AND ?", startDate, endDate)
	qTokenTrend = withDailyAggFilter(qTokenTrend, req)
	if err := qTokenTrend.Group("dt").Order("dt ASC").Scan(&resp.TokenTrend).Error; err != nil {
		return nil, err
	}

	// top spaces
	topSpacesOrderDir := "DESC"
	if req.TopSpacesOrder == "asc" {
		topSpacesOrderDir = "ASC"
	}
	qTop := p.db.WithContext(ctx).
		Table("billing_daily_agg AS b").
		Select("b.space_id AS space_id, COALESCE(s.name,'') AS space_name, COALESCE(SUM(b.total_amount),0) AS amount, COALESCE(SUM(b.total_tokens),0) AS tokens").
		Joins("LEFT JOIN space AS s ON s.id = b.space_id AND s.deleted_at IS NULL").
		Where("b.dt BETWEEN ? AND ?", startDate, endDate)
	qTop = withDailyAggFilterWithAlias(qTop, req, "b")
	if err := qTop.
		Group("b.space_id, s.name").
		Order("SUM(b.total_amount) " + topSpacesOrderDir).
		Limit(10).
		Scan(&resp.TopSpaces).Error; err != nil {
		return nil, err
	}

	return resp, nil
}

func withRecordFilter(db *gorm.DB, req *BillingOverviewReq, startTime, endTime int64) *gorm.DB {
	db = db.Where("occurred_at BETWEEN ? AND ?", startTime, endTime)
	if len(req.SpaceIDs) > 0 {
		db = db.Where("space_id IN ?", req.SpaceIDs)
	}
	if req.ProjectType != "" && req.ProjectType != "all" {
		db = db.Where("project_type = ?", req.ProjectType)
	}

	return db
}

func withDailyAggFilter(db *gorm.DB, req *BillingOverviewReq) *gorm.DB {
	if len(req.SpaceIDs) > 0 {
		db = db.Where("space_id IN ?", req.SpaceIDs)
	}
	if req.ProjectType != "" && req.ProjectType != "all" {
		db = db.Where("project_type = ?", req.ProjectType)
	}

	return db
}

func withDailyAggFilterWithAlias(db *gorm.DB, req *BillingOverviewReq, alias string) *gorm.DB {
	if len(req.SpaceIDs) > 0 {
		db = db.Where(alias+".space_id IN ?", req.SpaceIDs)
	}
	if req.ProjectType != "" && req.ProjectType != "all" {
		db = db.Where(alias+".project_type = ?", req.ProjectType)
	}

	return db
}

func clipRange(fromStart, fromEnd, reqStart, reqEnd int64) (int64, int64) {
	if reqStart > fromStart {
		fromStart = reqStart
	}
	if reqEnd < fromEnd {
		fromEnd = reqEnd
	}

	return fromStart, fromEnd
}
