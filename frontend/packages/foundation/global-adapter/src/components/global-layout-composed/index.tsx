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

import { useParams } from 'react-router-dom';
import { type FC, type PropsWithChildren } from 'react';

import { VerticalSidebarMenuAdapter } from '@coze-foundation/space-ui-adapter';
import { GlobalLayout } from '@coze-foundation/layout';
import { useCreateBotAction } from '@coze-foundation/global';
import { RequireAuthContainer } from '@coze-foundation/account-ui-adapter';
import { usePlatformManagementAccess } from '@coze-foundation/account-adapter';
import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import {
  IconCozPlusCircle,
  IconCozWorkspace,
  IconCozWorkspaceFill,
  IconCozCompass,
  IconCozCompassFill,
  IconCozDocument,
  IconCozSetting,
  IconCozSettingFill,
} from '@coze-arch/coze-design/icons';
import { useRouteConfig } from '@coze-arch/bot-hooks';

import { useHasSider } from './hooks/use-has-sider';
import { AccountDropdown } from '../account-dropdown';

// 启用新的垂直侧边栏菜单
const USE_VERTICAL_SIDEBAR = true;
const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

export const buildGlobalLayoutMenus = ({
  showPlatformManagement,
}: {
  showPlatformManagement: boolean;
}) => {
  const menus = [
    {
      title: I18n.t('navigation_workspace'),
      icon: <IconCozWorkspace />,
      activeIcon: <IconCozWorkspaceFill />,
      path: '/space',
      dataTestId: 'layout_workspace-button',
    },
    {
      title: I18n.t('menu_title_store'),
      icon: <IconCozCompass />,
      activeIcon: <IconCozCompassFill />,
      path: '/explore',
      dataTestId: 'layout_explore-button',
    },
  ];

  if (showPlatformManagement) {
    menus.push({
      title: tNoOptions('platform_management_menu_title', '平台管理'),
      icon: <IconCozSetting />,
      activeIcon: <IconCozSettingFill />,
      path: '/platform',
      dataTestId: 'layout_platform-management-button',
    });
  }

  return menus;
};

export const GlobalLayoutComposed: FC<PropsWithChildren> = ({ children }) => {
  const config = useRouteConfig();
  const hasSider = useHasSider();
  const { space_id } = useParams();
  const showPlatformManagement = usePlatformManagementAccess();

  const { createBot, createBotModal } = useCreateBotAction({
    currentSpaceId: space_id,
  });

  // 如果启用新的垂直侧边栏且需要侧边栏
  if (USE_VERTICAL_SIDEBAR && hasSider) {
    return (
      <RequireAuthContainer
        needLogin={!!config.requireAuth}
        loginOptional={!!config.requireAuthOptional}
      >
        <div className="flex h-screen w-screen overflow-hidden coz-bg-plus">
          {/* 新的垂直侧边导航菜单 */}
          <VerticalSidebarMenuAdapter onCreateClick={createBot} />

          {/* 主内容区域 */}
          <div className="flex-1 overflow-auto">
            {children}
            {createBotModal}
          </div>
        </div>
      </RequireAuthContainer>
    );
  }

  // 使用原来的布局（兼容旧版本）
  return (
    <RequireAuthContainer
      needLogin={!!config.requireAuth}
      loginOptional={!!config.requireAuthOptional}
    >
      <GlobalLayout
        hasSider={hasSider}
        banner={null}
        actions={[
          {
            tooltip: I18n.t('creat_tooltip_create'),
            icon: <IconCozPlusCircle />,
            onClick: createBot,
            dataTestId: 'layout_create-agent-button',
          },
        ]}
        menus={buildGlobalLayoutMenus({ showPlatformManagement })}
        extras={[
          {
            icon: <IconCozDocument />,
            tooltip: I18n.t('menu_documents'),
            onClick: () => {
              // cp-disable-next-line
              window.open('https://www.coze.cn/open/docs/guides');
            },
            dataTestId: 'layout_document-button',
          },
        ]}
        footer={<AccountDropdown />}
      >
        {children}
        {createBotModal}
      </GlobalLayout>
    </RequireAuthContainer>
  );
};
