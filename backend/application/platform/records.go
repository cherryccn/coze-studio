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
	"strings"

	"gorm.io/gorm"
)

type BillingRecordsReq struct {
	StartTime      int64
	EndTime        int64
	Page           int
	Size           int
	Keyword        string
	SpaceIDs       []int64
	ProjectType    string
	OrderBy        string
	OrderDirection string
}

type BillingRecordsResp struct {
	Page  int                 `json:"page"`
	Size  int                 `json:"size"`
	Total int64               `json:"total"`
	List  []BillingRecordItem `json:"list"`
}

type BillingRecordItem struct {
	ID          int64  `json:"id"`
	RequestID   string `json:"request_id"`
	SpaceID     int64  `json:"space_id"`
	SpaceName   string `json:"space_name"`
	ProjectType string `json:"project_type"`
	ProjectID   int64  `json:"project_id"`
	ProjectName string `json:"project_name"`
	ModelID     string `json:"model_id"`
	UsageTokens int64  `json:"usage_tokens"`
	UnitPrice   string `json:"unit_price"`
	Amount      string `json:"amount"`
	Status      string `json:"status"`
	OccurredAt  int64  `json:"occurred_at"`
	CreatedAt   int64  `json:"created_at"`
}

const projectNameCaseExpr = "CASE br.project_type " +
	"WHEN 'agent' THEN COALESCE(sad.name,'') " +
	"WHEN 'app' THEN COALESCE(ad.name,'') " +
	"WHEN 'workflow' THEN COALESCE(wm.name,'') " +
	"ELSE '' END"

func (p *PlatformApplicationService) GetBillingRecords(ctx context.Context, req *BillingRecordsReq) (*BillingRecordsResp, error) {
	if p == nil || p.db == nil {
		return nil, errors.New("platform application service is not initialized")
	}

	orderExpr, err := resolveRecordOrderExpr(req.OrderBy, req.OrderDirection)
	if err != nil {
		return nil, err
	}

	resp := &BillingRecordsResp{
		Page: req.Page,
		Size: req.Size,
		List: make([]BillingRecordItem, 0),
	}

	countDB := p.billingRecordBaseQuery(ctx)
	countDB = withRecordListFilter(countDB, req)
	if err = countDB.Count(&resp.Total).Error; err != nil {
		return nil, err
	}

	if resp.Total == 0 {
		return resp, nil
	}

	queryDB := p.billingRecordBaseQuery(ctx).
		Select("br.id AS id, br.request_id AS request_id, br.space_id AS space_id, COALESCE(s.name,'') AS space_name, br.project_type AS project_type, br.project_id AS project_id, " + projectNameCaseExpr + " AS project_name, br.model_id AS model_id, br.usage_tokens AS usage_tokens, br.unit_price AS unit_price, br.amount AS amount, br.status AS status, br.occurred_at AS occurred_at, br.created_at AS created_at")
	queryDB = withRecordListFilter(queryDB, req)
	if err = queryDB.
		Order(orderExpr).
		Offset((req.Page - 1) * req.Size).
		Limit(req.Size).
		Scan(&resp.List).Error; err != nil {
		return nil, err
	}

	return resp, nil
}

func (p *PlatformApplicationService) billingRecordBaseQuery(ctx context.Context) *gorm.DB {
	return p.db.WithContext(ctx).
		Table("billing_records AS br").
		Joins("LEFT JOIN space AS s ON s.id = br.space_id AND s.deleted_at IS NULL").
		Joins("LEFT JOIN single_agent_draft AS sad ON br.project_type = 'agent' AND sad.agent_id = br.project_id AND sad.deleted_at IS NULL").
		Joins("LEFT JOIN app_draft AS ad ON br.project_type = 'app' AND ad.id = br.project_id AND ad.deleted_at IS NULL").
		Joins("LEFT JOIN workflow_meta AS wm ON br.project_type = 'workflow' AND wm.id = br.project_id AND wm.deleted_at IS NULL")
}

func withRecordListFilter(db *gorm.DB, req *BillingRecordsReq) *gorm.DB {
	db = db.Where("br.occurred_at BETWEEN ? AND ?", req.StartTime, req.EndTime)
	if len(req.SpaceIDs) > 0 {
		db = db.Where("br.space_id IN ?", req.SpaceIDs)
	}
	if req.ProjectType != "" && req.ProjectType != "all" {
		db = db.Where("br.project_type = ?", req.ProjectType)
	}

	keyword := strings.TrimSpace(req.Keyword)
	if keyword != "" {
		likeKeyword := "%" + keyword + "%"
		db = db.Where("(s.name LIKE ? OR sad.name LIKE ? OR ad.name LIKE ? OR wm.name LIKE ?)",
			likeKeyword, likeKeyword, likeKeyword, likeKeyword)
	}

	return db
}

func resolveRecordOrderExpr(orderBy, orderDirection string) (string, error) {
	var column string
	switch orderBy {
	case "occurred_at":
		column = "br.occurred_at"
	case "amount":
		column = "br.amount"
	case "usage_tokens":
		column = "br.usage_tokens"
	default:
		return "", fmt.Errorf("invalid order_by")
	}

	switch orderDirection {
	case "asc":
	case "desc":
	default:
		return "", fmt.Errorf("invalid order_direction")
	}

	return fmt.Sprintf("%s %s", column, orderDirection), nil
}
