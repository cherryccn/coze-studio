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

	bizconfig "github.com/coze-dev/coze-studio/backend/bizpkg/config"
	"github.com/coze-dev/coze-studio/backend/domain/user/entity"
	"github.com/coze-dev/coze-studio/backend/pkg/ctxcache"
	"github.com/coze-dev/coze-studio/backend/types/consts"
)

type platformAuthErrorResp struct {
	Code int32  `json:"code"`
	Msg  string `json:"msg"`
}

func TestPlatformAdminAuthMWMissingSessionStandalone(t *testing.T) {
	h := server.Default()
	h.GET("/api/platform/ping", PlatformAdminAuthMW(), func(ctx context.Context, c *app.RequestContext) {
		c.JSON(http.StatusOK, map[string]string{"msg": "ok"})
	})

	w := ut.PerformRequest(h.Engine, "GET", "/api/platform/ping", nil)
	assert.Equal(t, http.StatusUnauthorized, w.Code)

	resp := decodePlatformAuthErrorResp(t, w)
	assert.Equal(t, int32(40101), resp.Code)
}

func TestPlatformAdminAuthMWAllowsLoggedInUserWhenAdminEmailsEmptyStandalone(t *testing.T) {
	oldLoadBaseConfigForAuth := loadBaseConfigForAuth
	loadBaseConfigForAuth = func(context.Context) (*bizconfig.BasicConfiguration, error) {
		return &bizconfig.BasicConfiguration{AdminEmails: ""}, nil
	}
	t.Cleanup(func() {
		loadBaseConfigForAuth = oldLoadBaseConfigForAuth
	})

	h := server.Default()
	h.Use(withPlatformSession("demo@example.com"))
	h.GET("/api/platform/ping", PlatformAdminAuthMW(), func(ctx context.Context, c *app.RequestContext) {
		c.JSON(http.StatusOK, map[string]string{"msg": "ok"})
	})

	w := ut.PerformRequest(h.Engine, "GET", "/api/platform/ping", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestPlatformAdminAuthMWAllowsConfiguredAdminStandalone(t *testing.T) {
	oldLoadBaseConfigForAuth := loadBaseConfigForAuth
	loadBaseConfigForAuth = func(context.Context) (*bizconfig.BasicConfiguration, error) {
		return &bizconfig.BasicConfiguration{AdminEmails: "owner@example.com, demo@example.com"}, nil
	}
	t.Cleanup(func() {
		loadBaseConfigForAuth = oldLoadBaseConfigForAuth
	})

	h := server.Default()
	h.Use(withPlatformSession("Demo@Example.com"))
	h.GET("/api/platform/ping", PlatformAdminAuthMW(), func(ctx context.Context, c *app.RequestContext) {
		c.JSON(http.StatusOK, map[string]string{"msg": "ok"})
	})

	w := ut.PerformRequest(h.Engine, "GET", "/api/platform/ping", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestPlatformAdminAuthMWRejectsNonAdminWhenAdminEmailsConfiguredStandalone(t *testing.T) {
	oldLoadBaseConfigForAuth := loadBaseConfigForAuth
	loadBaseConfigForAuth = func(context.Context) (*bizconfig.BasicConfiguration, error) {
		return &bizconfig.BasicConfiguration{AdminEmails: "owner@example.com, demo@example.com"}, nil
	}
	t.Cleanup(func() {
		loadBaseConfigForAuth = oldLoadBaseConfigForAuth
	})

	h := server.Default()
	h.Use(withPlatformSession("member@example.com"))
	h.GET("/api/platform/ping", PlatformAdminAuthMW(), func(ctx context.Context, c *app.RequestContext) {
		c.JSON(http.StatusOK, map[string]string{"msg": "ok"})
	})

	w := ut.PerformRequest(h.Engine, "GET", "/api/platform/ping", nil)
	assert.Equal(t, http.StatusForbidden, w.Code)

	resp := decodePlatformAuthErrorResp(t, w)
	assert.Equal(t, int32(40301), resp.Code)
}

func withPlatformSession(email string) app.HandlerFunc {
	return func(c context.Context, ctx *app.RequestContext) {
		c = ctxcache.Init(c)
		ctxcache.Store(c, consts.SessionDataKeyInCtx, &entity.Session{
			UserEmail: email,
		})
		ctx.Next(c)
	}
}

func decodePlatformAuthErrorResp(t *testing.T, w *ut.ResponseRecorder) platformAuthErrorResp {
	t.Helper()

	result := w.Result()
	require.NotNil(t, result)

	var resp platformAuthErrorResp
	err := json.Unmarshal(result.Body(), &resp)
	require.NoError(t, err)

	return resp
}
