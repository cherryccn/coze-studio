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

package coze

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"

	"github.com/coze-dev/coze-studio/backend/api/internal/httputil"
	"github.com/coze-dev/coze-studio/backend/application/base/ctxutil"
	"github.com/coze-dev/coze-studio/backend/application/platform"
)

type platformBillingOverviewResponse struct {
	Code int32                         `json:"code"`
	Msg  string                        `json:"msg"`
	Data *platform.BillingOverviewResp `json:"data"`
}

type platformBillingRecordsResponse struct {
	Code int32                        `json:"code"`
	Msg  string                       `json:"msg"`
	Data *platform.BillingRecordsResp `json:"data"`
}

type platformBillingRecordsExportRequest struct {
	StartTime      int64   `json:"start_time"`
	EndTime        int64   `json:"end_time"`
	Keyword        string  `json:"keyword"`
	SpaceIDs       []int64 `json:"space_ids"`
	ProjectType    string  `json:"project_type"`
	OrderBy        string  `json:"order_by"`
	OrderDirection string  `json:"order_direction"`
}

type platformBillingRecordsExportResponse struct {
	Code int32                              `json:"code"`
	Msg  string                             `json:"msg"`
	Data *platform.BillingRecordsExportResp `json:"data"`
}

type platformBillingRecordsExportStatusResponse struct {
	Code int32                                    `json:"code"`
	Msg  string                                   `json:"msg"`
	Data *platform.BillingRecordsExportStatusResp `json:"data"`
}

type platformBillingBudgetsResponse struct {
	Code int32                             `json:"code"`
	Msg  string                            `json:"msg"`
	Data *platform.BillingBudgetsQueryResp `json:"data"`
}

type platformBillingBudgetsUpsertRequest struct {
	Rules []platform.BillingBudgetRule `json:"rules"`
}

type platformBillingBudgetsUpsertResponse struct {
	Code int32                             `json:"code"`
	Msg  string                            `json:"msg"`
	Data *platform.BillingBudgetUpsertResp `json:"data"`
}

type platformBillingBudgetAlertsCheckResponse struct {
	Code int32                                 `json:"code"`
	Msg  string                                `json:"msg"`
	Data *platform.BillingBudgetAlertRunResult `json:"data"`
}

type platformStatsOverviewResponse struct {
	Code int32                       `json:"code"`
	Msg  string                      `json:"msg"`
	Data *platform.StatsOverviewResp `json:"data"`
}

type platformStatsRankingsResponse struct {
	Code int32                       `json:"code"`
	Msg  string                      `json:"msg"`
	Data *platform.StatsRankingsResp `json:"data"`
}

// GetPlatformBillingOverview .
// @router /api/platform/billing/overview [GET]
func GetPlatformBillingOverview(ctx context.Context, c *app.RequestContext) {
	startTime, err := parseRequiredInt64Query(c, "start_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	endTime, err := parseRequiredInt64Query(c, "end_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	if startTime > endTime {
		platformInvalidTimeRangeResponse(c, "start_time must be <= end_time")
		return
	}
	if startTime <= 0 || endTime <= 0 {
		platformBadRequestResponse(c, "start_time and end_time must be positive")
		return
	}

	projectType := string(c.Query("project_type"))
	if projectType == "" {
		projectType = "all"
	}
	if !isValidProjectType(projectType) {
		platformBadRequestResponse(c, "invalid project_type")
		return
	}

	spaceIDs, err := parseInt64CSVQuery(c, "space_ids")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	topSpacesOrder := string(c.Query("top_spaces_order"))
	if topSpacesOrder != "asc" {
		topSpacesOrder = "desc"
	}

	resp, err := platform.PlatformApplicationSVC.GetBillingOverview(ctx, &platform.BillingOverviewReq{
		StartTime:      startTime,
		EndTime:        endTime,
		SpaceIDs:       spaceIDs,
		ProjectType:    projectType,
		TopSpacesOrder: topSpacesOrder,
	})
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformBillingOverviewResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// GetPlatformBillingRecords .
// @router /api/platform/billing/records [GET]
func GetPlatformBillingRecords(ctx context.Context, c *app.RequestContext) {
	startTime, err := parseRequiredInt64Query(c, "start_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	endTime, err := parseRequiredInt64Query(c, "end_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	if startTime > endTime {
		platformInvalidTimeRangeResponse(c, "start_time must be <= end_time")
		return
	}
	if startTime <= 0 || endTime <= 0 {
		platformBadRequestResponse(c, "start_time and end_time must be positive")
		return
	}

	page, err := parseOptionalIntQuery(c, "page", 1)
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if page < 1 {
		platformBadRequestResponse(c, "page is invalid")
		return
	}

	size, err := parseOptionalIntQuery(c, "size", 20)
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if size < 1 || size > 200 {
		platformBadRequestResponse(c, "size is invalid")
		return
	}

	projectType := string(c.Query("project_type"))
	if projectType == "" {
		projectType = "all"
	}
	if !isValidProjectType(projectType) {
		platformBadRequestResponse(c, "invalid project_type")
		return
	}

	spaceIDs, err := parseInt64CSVQuery(c, "space_ids")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	orderBy := strings.TrimSpace(string(c.Query("order_by")))
	if orderBy == "" {
		orderBy = "occurred_at"
	}
	if !isValidOrderBy(orderBy) {
		platformInvalidSortResponse(c, "invalid order_by")
		return
	}

	orderDirection := strings.ToLower(strings.TrimSpace(string(c.Query("order_direction"))))
	if orderDirection == "" {
		orderDirection = "desc"
	}
	if !isValidOrderDirection(orderDirection) {
		platformBadRequestResponse(c, "invalid order_direction")
		return
	}

	keyword := strings.TrimSpace(string(c.Query("keyword")))

	resp, err := platform.PlatformApplicationSVC.GetBillingRecords(ctx, &platform.BillingRecordsReq{
		StartTime:      startTime,
		EndTime:        endTime,
		Page:           page,
		Size:           size,
		Keyword:        keyword,
		SpaceIDs:       spaceIDs,
		ProjectType:    projectType,
		OrderBy:        orderBy,
		OrderDirection: orderDirection,
	})
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformBillingRecordsResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// PostPlatformBillingRecordsExport .
// @router /api/platform/billing/records/export [POST]
func PostPlatformBillingRecordsExport(ctx context.Context, c *app.RequestContext) {
	var req platformBillingRecordsExportRequest
	if err := c.BindAndValidate(&req); err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	if req.StartTime > req.EndTime {
		platformInvalidTimeRangeResponse(c, "start_time must be <= end_time")
		return
	}
	if req.StartTime <= 0 || req.EndTime <= 0 {
		platformBadRequestResponse(c, "start_time and end_time must be positive")
		return
	}

	projectType := strings.TrimSpace(req.ProjectType)
	if projectType == "" {
		projectType = "all"
	}
	if !isValidProjectType(projectType) {
		platformBadRequestResponse(c, "invalid project_type")
		return
	}

	orderBy := strings.TrimSpace(req.OrderBy)
	if orderBy == "" {
		orderBy = "occurred_at"
	}
	if !isValidOrderBy(orderBy) {
		platformInvalidSortResponse(c, "invalid order_by")
		return
	}

	orderDirection := strings.ToLower(strings.TrimSpace(req.OrderDirection))
	if orderDirection == "" {
		orderDirection = "desc"
	}
	if !isValidOrderDirection(orderDirection) {
		platformBadRequestResponse(c, "invalid order_direction")
		return
	}

	resp, err := platform.PlatformApplicationSVC.CreateBillingRecordsExportTask(ctx, &platform.BillingRecordsExportReq{
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		Keyword:        strings.TrimSpace(req.Keyword),
		SpaceIDs:       req.SpaceIDs,
		ProjectType:    projectType,
		OrderBy:        orderBy,
		OrderDirection: orderDirection,
	})
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformBillingRecordsExportResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// GetPlatformBillingRecordsExportStatus .
// @router /api/platform/billing/records/export/status [GET]
func GetPlatformBillingRecordsExportStatus(ctx context.Context, c *app.RequestContext) {
	taskID := strings.TrimSpace(string(c.Query("task_id")))
	if taskID == "" {
		platformBadRequestResponse(c, "task_id is required")
		return
	}

	resp, err := platform.PlatformApplicationSVC.GetBillingRecordsExportTaskStatus(ctx, taskID)
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformBillingRecordsExportStatusResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// GetPlatformBillingRecordsExportDownload .
// @router /api/platform/billing/records/export/download [GET]
func GetPlatformBillingRecordsExportDownload(ctx context.Context, c *app.RequestContext) {
	taskID := strings.TrimSpace(string(c.Query("task_id")))
	if taskID == "" {
		platformBadRequestResponse(c, "task_id is required")
		return
	}

	filePath, fileName, err := platform.PlatformApplicationSVC.GetBillingRecordsExportDownloadFile(ctx, taskID)
	if err != nil {
		platformDownloadErrorResponse(ctx, c, err)
		return
	}

	c.FileAttachment(filePath, fileName)
}

// GetPlatformBillingBudgets .
// @router /api/platform/billing/budgets [GET]
func GetPlatformBillingBudgets(ctx context.Context, c *app.RequestContext) {
	page, err := parseOptionalIntQuery(c, "page", 1)
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if page < 1 {
		platformBadRequestResponse(c, "page is invalid")
		return
	}

	size, err := parseOptionalIntQuery(c, "size", 50)
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if size < 1 || size > 200 {
		platformBadRequestResponse(c, "size is invalid")
		return
	}

	spaceIDs, err := parseInt64CSVQuery(c, "space_ids")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	resp, err := platform.PlatformApplicationSVC.GetBillingBudgets(ctx, &platform.BillingBudgetsQueryReq{
		Page:     page,
		Size:     size,
		SpaceIDs: spaceIDs,
	})
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformBillingBudgetsResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// PostPlatformBillingBudgets .
// @router /api/platform/billing/budgets [POST]
func PostPlatformBillingBudgets(ctx context.Context, c *app.RequestContext) {
	var req platformBillingBudgetsUpsertRequest
	if err := c.BindAndValidate(&req); err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if len(req.Rules) == 0 {
		platformBadRequestResponse(c, "rules is empty")
		return
	}

	operatorID := int64(0)
	if uid := ctxutil.GetUIDFromCtx(ctx); uid != nil {
		operatorID = *uid
	}

	resp, err := platform.PlatformApplicationSVC.SaveBillingBudgets(ctx, &platform.BillingBudgetUpsertReq{
		Rules: req.Rules,
	}, operatorID)
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformBillingBudgetsUpsertResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// PostPlatformBillingBudgetAlertsCheck .
// @router /api/platform/billing/budgets/alerts/check [POST]
func PostPlatformBillingBudgetAlertsCheck(ctx context.Context, c *app.RequestContext) {
	nowMS, err := parseOptionalInt64Query(c, "now_ms", 0)
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if nowMS < 0 {
		platformBadRequestResponse(c, "now_ms is invalid")
		return
	}

	checkTime := time.Now()
	if nowMS > 0 {
		checkTime = time.UnixMilli(nowMS)
	}

	resp, err := platform.PlatformApplicationSVC.CheckBudgetAlerts(ctx, checkTime)
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformBillingBudgetAlertsCheckResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// GetPlatformStatsOverview .
// @router /api/platform/stats/overview [GET]
func GetPlatformStatsOverview(ctx context.Context, c *app.RequestContext) {
	startTime, err := parseRequiredInt64Query(c, "start_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	endTime, err := parseRequiredInt64Query(c, "end_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	if startTime > endTime {
		platformInvalidTimeRangeResponse(c, "start_time must be <= end_time")
		return
	}
	if startTime <= 0 || endTime <= 0 {
		platformBadRequestResponse(c, "start_time and end_time must be positive")
		return
	}

	projectType := strings.TrimSpace(string(c.Query("project_type")))
	if projectType == "" {
		projectType = "all"
	}
	if !isValidProjectType(projectType) {
		platformBadRequestResponse(c, "invalid project_type")
		return
	}

	spaceIDs, err := parseInt64CSVQuery(c, "space_ids")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	resp, err := platform.PlatformApplicationSVC.GetStatsOverview(ctx, &platform.StatsOverviewReq{
		StartTime:   startTime,
		EndTime:     endTime,
		SpaceIDs:    spaceIDs,
		ProjectType: projectType,
	})
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformStatsOverviewResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

// GetPlatformStatsRankings .
// @router /api/platform/stats/rankings [GET]
func GetPlatformStatsRankings(ctx context.Context, c *app.RequestContext) {
	startTime, err := parseRequiredInt64Query(c, "start_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	endTime, err := parseRequiredInt64Query(c, "end_time")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	if startTime > endTime {
		platformInvalidTimeRangeResponse(c, "start_time must be <= end_time")
		return
	}
	if startTime <= 0 || endTime <= 0 {
		platformBadRequestResponse(c, "start_time and end_time must be positive")
		return
	}

	metric := strings.TrimSpace(string(c.Query("metric")))
	if !isValidStatsMetric(metric) {
		platformBadRequestResponse(c, "invalid metric")
		return
	}

	page, err := parseOptionalIntQuery(c, "page", 1)
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if page < 1 {
		platformBadRequestResponse(c, "page is invalid")
		return
	}

	size, err := parseOptionalIntQuery(c, "size", 20)
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}
	if size < 1 || size > 200 {
		platformBadRequestResponse(c, "size is invalid")
		return
	}

	projectType := strings.TrimSpace(string(c.Query("project_type")))
	if projectType == "" {
		projectType = "all"
	}
	if !isValidProjectType(projectType) {
		platformBadRequestResponse(c, "invalid project_type")
		return
	}

	spaceIDs, err := parseInt64CSVQuery(c, "space_ids")
	if err != nil {
		platformBadRequestResponse(c, err.Error())
		return
	}

	resp, err := platform.PlatformApplicationSVC.GetStatsRankings(ctx, &platform.StatsRankingsReq{
		StartTime:   startTime,
		EndTime:     endTime,
		Metric:      metric,
		Page:        page,
		Size:        size,
		SpaceIDs:    spaceIDs,
		ProjectType: projectType,
	})
	if err != nil {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	c.JSON(consts.StatusOK, &platformStatsRankingsResponse{
		Code: 0,
		Msg:  "ok",
		Data: resp,
	})
}

func parseRequiredInt64Query(c *app.RequestContext, key string) (int64, error) {
	raw := strings.TrimSpace(string(c.Query(key)))
	if raw == "" {
		return 0, fmt.Errorf("%s is required", key)
	}
	v, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s is invalid", key)
	}

	return v, nil
}

func parseInt64CSVQuery(c *app.RequestContext, key string) ([]int64, error) {
	raw := strings.TrimSpace(string(c.Query(key)))
	if raw == "" {
		return nil, nil
	}

	parts := strings.Split(raw, ",")
	res := make([]int64, 0, len(parts))
	for _, part := range parts {
		p := strings.TrimSpace(part)
		if p == "" {
			continue
		}

		v, err := strconv.ParseInt(p, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("%s contains invalid id", key)
		}
		if v <= 0 {
			return nil, fmt.Errorf("%s contains non-positive id", key)
		}
		res = append(res, v)
	}

	return res, nil
}

func parseOptionalIntQuery(c *app.RequestContext, key string, defaultValue int) (int, error) {
	raw := strings.TrimSpace(string(c.Query(key)))
	if raw == "" {
		return defaultValue, nil
	}

	v, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fmt.Errorf("%s is invalid", key)
	}

	return v, nil
}

func parseOptionalInt64Query(c *app.RequestContext, key string, defaultValue int64) (int64, error) {
	raw := strings.TrimSpace(string(c.Query(key)))
	if raw == "" {
		return defaultValue, nil
	}

	v, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s is invalid", key)
	}

	return v, nil
}

func isValidProjectType(projectType string) bool {
	switch projectType {
	case "all", "agent", "app", "workflow":
		return true
	default:
		return false
	}
}

func isValidOrderBy(orderBy string) bool {
	switch orderBy {
	case "occurred_at", "amount", "usage_tokens":
		return true
	default:
		return false
	}
}

func isValidOrderDirection(orderDirection string) bool {
	switch orderDirection {
	case "asc", "desc":
		return true
	default:
		return false
	}
}

func isValidOverLimitPolicy(policy string) bool {
	switch policy {
	case "warn", "reject":
		return true
	default:
		return false
	}
}

func isValidStatsMetric(metric string) bool {
	switch metric {
	case "calls", "tokens", "cost", "fail_rate":
		return true
	default:
		return false
	}
}

func platformBadRequestResponse(c *app.RequestContext, errMsg string) {
	httputil.PlatformBadRequest(c, errMsg)
}

func platformInvalidSortResponse(c *app.RequestContext, errMsg string) {
	httputil.PlatformInvalidSort(c, errMsg)
}

func platformInvalidTimeRangeResponse(c *app.RequestContext, errMsg string) {
	httputil.PlatformInvalidTimeRange(c, errMsg)
}

func platformNotFoundResponse(c *app.RequestContext, errMsg string) {
	httputil.PlatformNotFound(c, errMsg)
}

func platformInternalServerErrorResponse(ctx context.Context, c *app.RequestContext, err error) {
	httputil.PlatformInternalError(ctx, c, err)
}

func platformDownloadErrorResponse(ctx context.Context, c *app.RequestContext, err error) {
	if err == nil {
		return
	}

	if errors.Is(err, context.Canceled) {
		platformInternalServerErrorResponse(ctx, c, err)
		return
	}

	msg := strings.TrimSpace(err.Error())
	switch {
	case strings.Contains(msg, "not found"), strings.Contains(msg, "does not exist"):
		platformNotFoundResponse(c, msg)
	case strings.Contains(msg, "not completed"), strings.Contains(msg, "expired"), strings.Contains(msg, "not ready"):
		platformBadRequestResponse(c, msg)
	default:
		platformInternalServerErrorResponse(ctx, c, err)
	}
}
