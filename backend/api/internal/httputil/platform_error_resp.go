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

package httputil

import (
	"context"
	"errors"
	"net/http"

	"github.com/cloudwego/hertz/pkg/app"

	"github.com/coze-dev/coze-studio/backend/pkg/errorx"
	"github.com/coze-dev/coze-studio/backend/pkg/logs"
	"github.com/coze-dev/coze-studio/backend/types/errno"
)

const (
	PlatformCodeInvalidParam     int32 = 40001
	PlatformCodeInvalidSort      int32 = 40002
	PlatformCodeInvalidTimeRange int32 = 40003
	PlatformCodeUnauthorized     int32 = 40101
	PlatformCodeForbidden        int32 = 40301
	PlatformCodeNotFound         int32 = 40401
	PlatformCodeConflict         int32 = 40901
	PlatformCodeInternal         int32 = 50001
)

type platformErrorData struct {
	Code int32  `json:"code"`
	Msg  string `json:"msg"`
}

func PlatformBadRequest(c *app.RequestContext, errMsg string) {
	c.AbortWithStatusJSON(http.StatusBadRequest, platformErrorData{Code: PlatformCodeInvalidParam, Msg: errMsg})
}

func PlatformInvalidSort(c *app.RequestContext, errMsg string) {
	c.AbortWithStatusJSON(http.StatusBadRequest, platformErrorData{Code: PlatformCodeInvalidSort, Msg: errMsg})
}

func PlatformInvalidTimeRange(c *app.RequestContext, errMsg string) {
	c.AbortWithStatusJSON(http.StatusBadRequest, platformErrorData{Code: PlatformCodeInvalidTimeRange, Msg: errMsg})
}

func PlatformUnauthorized(c *app.RequestContext, errMsg string) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, platformErrorData{Code: PlatformCodeUnauthorized, Msg: errMsg})
}

func PlatformForbidden(c *app.RequestContext, errMsg string) {
	c.AbortWithStatusJSON(http.StatusForbidden, platformErrorData{Code: PlatformCodeForbidden, Msg: errMsg})
}

func PlatformNotFound(c *app.RequestContext, errMsg string) {
	c.AbortWithStatusJSON(http.StatusNotFound, platformErrorData{Code: PlatformCodeNotFound, Msg: errMsg})
}

func PlatformConflict(c *app.RequestContext, errMsg string) {
	c.AbortWithStatusJSON(http.StatusConflict, platformErrorData{Code: PlatformCodeConflict, Msg: errMsg})
}

func PlatformInternalError(ctx context.Context, c *app.RequestContext, err error) {
	if err != nil {
		logs.CtxErrorf(ctx, "[PlatformInternalError] error: %v", err)
	}
	c.AbortWithStatusJSON(http.StatusInternalServerError, platformErrorData{Code: PlatformCodeInternal, Msg: "internal server error"})
}

func IsUserAuthenticationError(err error) bool {
	var statusErr errorx.StatusError
	if !errors.As(err, &statusErr) {
		return false
	}

	return statusErr.Code() == errno.ErrUserAuthenticationFailed
}
