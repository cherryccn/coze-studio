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
	"encoding/json"
	"net/http"
	"testing"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/common/ut"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/coze-dev/coze-studio/backend/application/platform"
)

type platformErrorResp struct {
	Code int32  `json:"code"`
	Msg  string `json:"msg"`
}

func TestGetPlatformBillingRecordsErrorCodes(t *testing.T) {
	h := server.Default()
	h.GET("/api/platform/billing/records", GetPlatformBillingRecords)

	t.Run("invalid time range", func(t *testing.T) {
		w := ut.PerformRequest(h.Engine, "GET", "/api/platform/billing/records?start_time=2&end_time=1", nil)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		resp := decodePlatformErrorResp(t, w)
		assert.Equal(t, int32(40003), resp.Code)
	})

	t.Run("invalid order_by", func(t *testing.T) {
		w := ut.PerformRequest(h.Engine, "GET", "/api/platform/billing/records?start_time=1&end_time=2&order_by=invalid", nil)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		resp := decodePlatformErrorResp(t, w)
		assert.Equal(t, int32(40002), resp.Code)
	})
}

func TestGetPlatformStatsOverviewInternalErrorCode(t *testing.T) {
	oldSvc := platform.PlatformApplicationSVC
	platform.PlatformApplicationSVC = &platform.PlatformApplicationService{}
	t.Cleanup(func() {
		platform.PlatformApplicationSVC = oldSvc
	})

	h := server.Default()
	h.GET("/api/platform/stats/overview", GetPlatformStatsOverview)

	w := ut.PerformRequest(h.Engine, "GET", "/api/platform/stats/overview?start_time=1&end_time=2", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	resp := decodePlatformErrorResp(t, w)
	assert.Equal(t, int32(50001), resp.Code)
}

func TestPostPlatformBillingBudgetAlertsCheckErrorCodes(t *testing.T) {
	oldSvc := platform.PlatformApplicationSVC
	platform.PlatformApplicationSVC = &platform.PlatformApplicationService{}
	t.Cleanup(func() {
		platform.PlatformApplicationSVC = oldSvc
	})

	h := server.Default()
	h.POST("/api/platform/billing/budgets/alerts/check", PostPlatformBillingBudgetAlertsCheck)

	t.Run("invalid now_ms", func(t *testing.T) {
		w := ut.PerformRequest(h.Engine, "POST", "/api/platform/billing/budgets/alerts/check?now_ms=bad", nil)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		resp := decodePlatformErrorResp(t, w)
		assert.Equal(t, int32(40001), resp.Code)
	})

	t.Run("service not initialized", func(t *testing.T) {
		w := ut.PerformRequest(h.Engine, "POST", "/api/platform/billing/budgets/alerts/check", nil)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		resp := decodePlatformErrorResp(t, w)
		assert.Equal(t, int32(50001), resp.Code)
	})
}

func decodePlatformErrorResp(t *testing.T, w *ut.ResponseRecorder) platformErrorResp {
	t.Helper()

	result := w.Result()
	require.NotNil(t, result)

	var resp platformErrorResp
	err := json.Unmarshal(result.Body(), &resp)
	require.NoError(t, err)

	return resp
}
