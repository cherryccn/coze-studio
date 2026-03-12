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
	"net/http"

	"github.com/cloudwego/hertz/pkg/app"

	"github.com/coze-dev/coze-studio/backend/api/model/passport"
	"github.com/coze-dev/coze-studio/backend/application/user"
	"github.com/coze-dev/coze-studio/backend/bizpkg/config"
	"github.com/coze-dev/coze-studio/backend/bizpkg/platformaccess"
)

var loadPassportBaseConfig = func(ctx context.Context) (*config.BasicConfiguration, error) {
	return config.Base().GetBaseConfig(ctx)
}

var loadPassportAccountInfoV2 = func(ctx context.Context, req *passport.PassportAccountInfoV2Request) (*passport.PassportAccountInfoV2Response, error) {
	return user.UserApplicationSVC.PassportAccountInfoV2(ctx, req)
}

type passportAccountInfoV2Data struct {
	UserIDStr                int64                 `json:"user_id_str,string"`
	Name                     string                `json:"name"`
	UserUniqueName           string                `json:"user_unique_name"`
	Email                    string                `json:"email"`
	Description              string                `json:"description"`
	AvatarURL                string                `json:"avatar_url"`
	ScreenName               *string               `json:"screen_name,omitempty"`
	AppUserInfo              *passport.AppUserInfo `json:"app_user_info,omitempty"`
	Locale                   *string               `json:"locale,omitempty"`
	UserCreateTime           int64                 `json:"user_create_time"`
	PlatformManagementAccess bool                  `json:"platform_management_access"`
}

type passportAccountInfoV2Response struct {
	Data *passportAccountInfoV2Data `json:"data"`
	Code int32                      `json:"code"`
	Msg  string                     `json:"msg"`
}

// PassportAccountInfoV2 .
// @router /passport/account/info/v2/ [POST]
func PassportAccountInfoV2(ctx context.Context, c *app.RequestContext) {
	var err error
	var req passport.PassportAccountInfoV2Request
	err = c.BindAndValidate(&req)
	if err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}

	resp, err := loadPassportAccountInfoV2(ctx, &req)
	if err != nil {
		internalServerErrorResponse(ctx, c, err)
		return
	}

	baseConf, err := loadPassportBaseConfig(ctx)
	if err != nil {
		internalServerErrorResponse(ctx, c, err)
		return
	}

	platformManagementAccess := platformaccess.HasPlatformManagementAccess(
		resp.GetData().GetEmail(),
		baseConf.GetAdminEmails(),
	)

	c.JSON(http.StatusOK, &passportAccountInfoV2Response{
		Data: &passportAccountInfoV2Data{
			UserIDStr:                resp.GetData().GetUserIDStr(),
			Name:                     resp.GetData().GetName(),
			UserUniqueName:           resp.GetData().GetUserUniqueName(),
			Email:                    resp.GetData().GetEmail(),
			Description:              resp.GetData().GetDescription(),
			AvatarURL:                resp.GetData().GetAvatarURL(),
			ScreenName:               resp.GetData().ScreenName,
			AppUserInfo:              resp.GetData().GetAppUserInfo(),
			Locale:                   resp.GetData().Locale,
			UserCreateTime:           resp.GetData().GetUserCreateTime(),
			PlatformManagementAccess: platformManagementAccess,
		},
		Code: resp.GetCode(),
		Msg:  resp.GetMsg(),
	})
}
