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

package middleware

import (
	"context"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"

	"github.com/coze-dev/coze-studio/backend/api/internal/httputil"
	"github.com/coze-dev/coze-studio/backend/bizpkg/config"
	"github.com/coze-dev/coze-studio/backend/bizpkg/platformaccess"
	"github.com/coze-dev/coze-studio/backend/domain/user/entity"
	"github.com/coze-dev/coze-studio/backend/pkg/ctxcache"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
	"github.com/coze-dev/coze-studio/backend/types/consts"
)

var loadBaseConfigForAuth = func(ctx context.Context) (*config.BasicConfiguration, error) {
	return config.Base().GetBaseConfig(ctx)
}

func PlatformAdminAuthMW() app.HandlerFunc {
	return func(c context.Context, ctx *app.RequestContext) {
		session, ok := ctxcache.Get[*entity.Session](c, consts.SessionDataKeyInCtx)
		if !ok || session == nil {
			logs.Errorf("[PlatformAdminAuthMW] session data is nil")
			httputil.PlatformUnauthorized(ctx, "session is invalid or expired")
			return
		}

		baseConf, err := loadBaseConfigForAuth(c)
		if err != nil {
			logs.Errorf("[PlatformAdminAuthMW] get base config failed, err: %v", err)
			httputil.PlatformInternalError(c, ctx, err)
			return
		}

		if platformaccess.HasPlatformManagementAccess(session.UserEmail, baseConf.AdminEmails) {
			if strings.TrimSpace(baseConf.AdminEmails) == "" {
				logs.CtxWarnf(c, "[PlatformAdminAuthMW] admin emails is empty, fallback to logged-in access")
			}
			ctx.Next(c)
			return
		}

		httputil.PlatformForbidden(ctx, "the account does not have platform management permission")
	}
}

func isPlatformAPIPath(path string) bool {
	return strings.HasPrefix(path, "/api/platform/")
}
