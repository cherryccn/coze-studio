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
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/common/ut"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/coze-dev/coze-studio/backend/api/model/passport"
	bizconfig "github.com/coze-dev/coze-studio/backend/bizpkg/config"
)

func TestPassportAccountInfoV2ReturnsPlatformManagementAccess(t *testing.T) {
	oldLoadPassportAccountInfoV2 := loadPassportAccountInfoV2
	oldLoadPassportBaseConfig := loadPassportBaseConfig
	t.Cleanup(func() {
		loadPassportAccountInfoV2 = oldLoadPassportAccountInfoV2
		loadPassportBaseConfig = oldLoadPassportBaseConfig
	})

	loadPassportAccountInfoV2 = func(context.Context, *passport.PassportAccountInfoV2Request) (*passport.PassportAccountInfoV2Response, error) {
		screenName := "demo"
		locale := "zh-CN"
		return &passport.PassportAccountInfoV2Response{
			Code: 0,
			Msg:  "ok",
			Data: &passport.User{
				UserIDStr:      1001,
				Name:           "Demo",
				UserUniqueName: "demo_user",
				Email:          "demo@example.com",
				Description:    "desc",
				AvatarURL:      "https://example.com/avatar.png",
				ScreenName:     &screenName,
				Locale:         &locale,
				UserCreateTime: 1736035200,
			},
		}, nil
	}

	tests := []struct {
		name        string
		adminEmails string
		wantAccess  bool
	}{
		{
			name:        "allow when admin emails empty",
			adminEmails: "",
			wantAccess:  true,
		},
		{
			name:        "deny when configured admins do not contain current email",
			adminEmails: "owner@example.com",
			wantAccess:  false,
		},
		{
			name:        "allow when configured admins contain current email",
			adminEmails: "owner@example.com, Demo@example.com ",
			wantAccess:  true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			loadPassportBaseConfig = func(context.Context) (*bizconfig.BasicConfiguration, error) {
				return &bizconfig.BasicConfiguration{AdminEmails: tt.adminEmails}, nil
			}

			h := server.Default()
			h.POST("/passport/account/info/v2/", PassportAccountInfoV2)

			w := ut.PerformRequest(
				h.Engine,
				"POST",
				"/passport/account/info/v2/",
				&ut.Body{Body: strings.NewReader("{}"), Len: len("{}")},
				ut.Header{Key: "Content-Type", Value: "application/json"},
			)
			assert.Equal(t, http.StatusOK, w.Code)

			resp := decodePassportAccountInfoV2Response(t, w)
			assert.Equal(t, int32(0), resp.Code)
			require.NotNil(t, resp.Data)
			assert.Equal(t, "demo@example.com", resp.Data.Email)
			assert.Equal(t, tt.wantAccess, resp.Data.PlatformManagementAccess)
		})
	}
}

func decodePassportAccountInfoV2Response(t *testing.T, w *ut.ResponseRecorder) passportAccountInfoV2Response {
	t.Helper()

	result := w.Result()
	require.NotNil(t, result)

	var resp passportAccountInfoV2Response
	err := json.Unmarshal(result.Body(), &resp)
	require.NoError(t, err)

	return resp
}
