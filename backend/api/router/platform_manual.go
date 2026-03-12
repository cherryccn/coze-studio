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

package router

import (
	"github.com/cloudwego/hertz/pkg/app/server"

	cozehandler "github.com/coze-dev/coze-studio/backend/api/handler/coze"
	"github.com/coze-dev/coze-studio/backend/api/middleware"
)

// RegisterManualRoutes registers manually maintained routes that are not in current IDL.
func RegisterManualRoutes(r *server.Hertz) {
	platformGroup := r.Group("/api/platform", middleware.PlatformAdminAuthMW())
	{
		platformGroup.GET("/billing/overview", cozehandler.GetPlatformBillingOverview)
		platformGroup.GET("/billing/records", cozehandler.GetPlatformBillingRecords)
		platformGroup.POST("/billing/records/export", cozehandler.PostPlatformBillingRecordsExport)
		platformGroup.GET("/billing/records/export/status", cozehandler.GetPlatformBillingRecordsExportStatus)
		platformGroup.GET("/billing/records/export/download", cozehandler.GetPlatformBillingRecordsExportDownload)
		platformGroup.GET("/billing/budgets", cozehandler.GetPlatformBillingBudgets)
		platformGroup.POST("/billing/budgets", cozehandler.PostPlatformBillingBudgets)
		platformGroup.POST("/billing/budgets/alerts/check", cozehandler.PostPlatformBillingBudgetAlertsCheck)
		platformGroup.GET("/stats/overview", cozehandler.GetPlatformStatsOverview)
		platformGroup.GET("/stats/rankings", cozehandler.GetPlatformStatsRankings)
	}
}
