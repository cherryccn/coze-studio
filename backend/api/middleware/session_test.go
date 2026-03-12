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
	"encoding/json"
	"net/http"
	"testing"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/common/ut"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type middlewareErrorResp struct {
	Code int32  `json:"code"`
	Msg  string `json:"msg"`
}

func TestSessionAuthMWPlatformCode(t *testing.T) {
	h := server.Default()
	h.Use(SessionAuthMW())
	h.GET("/api/platform/ping", func(ctx context.Context, c *app.RequestContext) {
		c.JSON(http.StatusOK, map[string]string{"msg": "ok"})
	})

	w := ut.PerformRequest(h.Engine, "GET", "/api/platform/ping", nil)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	resp := decodeMiddlewareErrorResp(t, w)
	assert.Equal(t, int32(40101), resp.Code)
}

func TestSessionAuthMWNonPlatformCode(t *testing.T) {
	h := server.Default()
	h.Use(SessionAuthMW())
	h.GET("/api/ping", func(ctx context.Context, c *app.RequestContext) {
		c.JSON(http.StatusOK, map[string]string{"msg": "ok"})
	})

	w := ut.PerformRequest(h.Engine, "GET", "/api/ping", nil)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	resp := decodeMiddlewareErrorResp(t, w)
	assert.Equal(t, int32(401), resp.Code)
}

func TestPlatformAdminAuthMWMissingSession(t *testing.T) {
	h := server.Default()
	h.GET("/api/platform/ping", PlatformAdminAuthMW(), func(ctx context.Context, c *app.RequestContext) {
		c.JSON(http.StatusOK, map[string]string{"msg": "ok"})
	})

	w := ut.PerformRequest(h.Engine, "GET", "/api/platform/ping", nil)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	resp := decodeMiddlewareErrorResp(t, w)
	assert.Equal(t, int32(40101), resp.Code)
}

func decodeMiddlewareErrorResp(t *testing.T, w *ut.ResponseRecorder) middlewareErrorResp {
	t.Helper()

	result := w.Result()
	require.NotNil(t, result)

	var resp middlewareErrorResp
	err := json.Unmarshal(result.Body(), &resp)
	require.NoError(t, err)

	return resp
}
