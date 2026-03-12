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

	"gorm.io/gorm"
)

type StatsRankingsReq struct {
	StartTime   int64
	EndTime     int64
	Metric      string
	Page        int
	Size        int
	SpaceIDs    []int64
	ProjectType string
}

type StatsRankingsResp struct {
	Page  int                `json:"page"`
	Size  int                `json:"size"`
	Total int64              `json:"total"`
	List  []StatsRankingItem `json:"list"`
}

type StatsRankingItem struct {
	ProjectID   int64  `json:"project_id"`
	ProjectName string `json:"project_name"`
	ProjectType string `json:"project_type"`
	Calls       int64  `json:"calls"`
	Tokens      int64  `json:"tokens"`
	Cost        string `json:"cost"`
	FailRate    string `json:"fail_rate"`
}

type statsRankingRow struct {
	ProjectType   string  `gorm:"column:project_type"`
	ProjectID     int64   `gorm:"column:project_id"`
	ProjectName   string  `gorm:"column:project_name"`
	Calls         int64   `gorm:"column:calls"`
	Tokens        int64   `gorm:"column:tokens"`
	Cost          string  `gorm:"column:cost"`
	FailedCalls   int64   `gorm:"column:failed_calls"`
	TotalCalls    int64   `gorm:"column:total_calls"`
	FailRateValue float64 `gorm:"column:fail_rate_value"`
}

func (p *PlatformApplicationService) GetStatsRankings(ctx context.Context, req *StatsRankingsReq) (*StatsRankingsResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}

	orderExpr, err := resolveStatsRankingsOrderExpr(req.Metric)
	if err != nil {
		return nil, err
	}

	resp := &StatsRankingsResp{
		Page: req.Page,
		Size: req.Size,
		List: make([]StatsRankingItem, 0),
	}

	countQuery := p.statsRankingBaseQuery(ctx).
		Select("br.project_type, br.project_id").
		Where("br.occurred_at BETWEEN ? AND ?", req.StartTime, req.EndTime)
	countQuery = withStatsRankingFilter(countQuery, req)
	countQuery = countQuery.Group("br.project_type, br.project_id")

	if err := p.db.WithContext(ctx).Table("(?) AS t", countQuery).Count(&resp.Total).Error; err != nil {
		return nil, err
	}
	if resp.Total == 0 {
		return resp, nil
	}

	rows := make([]statsRankingRow, 0, req.Size)
	listQuery := p.statsRankingBaseQuery(ctx).
		Select(
			"br.project_type AS project_type, br.project_id AS project_id, "+projectNameCaseExpr+" AS project_name, "+
				"COUNT(1) AS calls, "+
				"COALESCE(SUM(br.usage_tokens),0) AS tokens, "+
				"COALESCE(SUM(br.amount),0) AS cost, "+
				"COALESCE(SUM(CASE WHEN br.status != 'success' THEN 1 ELSE 0 END),0) AS failed_calls, "+
				"COUNT(1) AS total_calls, "+
				"CASE WHEN COUNT(1)=0 THEN 0 ELSE SUM(CASE WHEN br.status != 'success' THEN 1 ELSE 0 END) / COUNT(1) END AS fail_rate_value").
		Where("br.occurred_at BETWEEN ? AND ?", req.StartTime, req.EndTime)
	listQuery = withStatsRankingFilter(listQuery, req)

	if err := listQuery.
		Group("br.project_type, br.project_id, sad.name, ad.name, wm.name").
		Order(orderExpr).
		Offset((req.Page - 1) * req.Size).
		Limit(req.Size).
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	resp.List = make([]StatsRankingItem, 0, len(rows))
	for _, row := range rows {
		resp.List = append(resp.List, StatsRankingItem{
			ProjectID:   row.ProjectID,
			ProjectName: row.ProjectName,
			ProjectType: row.ProjectType,
			Calls:       row.Calls,
			Tokens:      row.Tokens,
			Cost:        row.Cost,
			FailRate:    calcStatsRate(row.FailedCalls, row.TotalCalls),
		})
	}

	return resp, nil
}

func (p *PlatformApplicationService) statsRankingBaseQuery(ctx context.Context) *gorm.DB {
	return p.db.WithContext(ctx).
		Table("billing_records AS br").
		Joins("LEFT JOIN single_agent_draft AS sad ON br.project_type = 'agent' AND sad.agent_id = br.project_id AND sad.deleted_at IS NULL").
		Joins("LEFT JOIN app_draft AS ad ON br.project_type = 'app' AND ad.id = br.project_id AND ad.deleted_at IS NULL").
		Joins("LEFT JOIN workflow_meta AS wm ON br.project_type = 'workflow' AND wm.id = br.project_id AND wm.deleted_at IS NULL")
}

func withStatsRankingFilter(db *gorm.DB, req *StatsRankingsReq) *gorm.DB {
	if len(req.SpaceIDs) > 0 {
		db = db.Where("br.space_id IN ?", req.SpaceIDs)
	}
	if req.ProjectType != "" && req.ProjectType != "all" {
		db = db.Where("br.project_type = ?", req.ProjectType)
	}

	return db
}

func resolveStatsRankingsOrderExpr(metric string) (string, error) {
	switch metric {
	case "calls":
		return "calls DESC, project_id DESC", nil
	case "tokens":
		return "tokens DESC, project_id DESC", nil
	case "cost":
		return "cost DESC, project_id DESC", nil
	case "fail_rate":
		return "fail_rate_value DESC, project_id DESC", nil
	default:
		return "", fmt.Errorf("invalid metric")
	}
}
