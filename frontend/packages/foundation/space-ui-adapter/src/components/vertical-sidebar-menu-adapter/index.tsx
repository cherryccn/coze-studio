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

import {
  useNavigate,
  useLocation,
  type NavigateFunction,
} from 'react-router-dom';
import React, { useMemo, useCallback } from 'react';

import {
  VerticalSidebarMenu,
  type MenuGroup,
} from '@coze-foundation/space-ui-base';
import { useSpaceStore } from '@coze-foundation/space-store';
import {
  useLogout,
  usePlatformManagementAccess,
} from '@coze-foundation/account-ui-adapter';
import { I18n, type I18nKeysNoOptionsType } from '@coze-arch/i18n';
import {
  IconCozHouse,
  IconCozHouseFill,
  IconCozBot,
  IconCozBotFill,
  IconCozKnowledge,
  IconCozKnowledgeFill,
  IconCozSetting,
  IconCozSettingFill,
  IconCozPlugin,
  IconCozPluginFill,
  IconCozStore,
  IconCozStoreFill,
  IconCozCompass,
  IconCozCompassFill,
} from '@coze-arch/coze-design/icons';

import { useCreateSpace } from '../../hooks/use-create-space';

export interface VerticalSidebarMenuAdapterProps {
  /** 创建按钮点击回调 */
  onCreateClick?: () => void;
}

interface MenuLabels {
  home: string;
  develop: string;
  library: string;
  config: string;
  platform: string;
  template: string;
  plugin: string;
}

const tNoOptions = (key: string, fallback: string) =>
  I18n.t(key as unknown as I18nKeysNoOptionsType, {}, fallback);

const resolveCurrentMenuKey = (pathname: string) => {
  if (pathname.includes('/home')) {
    return 'home';
  }
  if (pathname.includes('/develop')) {
    return 'develop';
  }
  if (pathname.includes('/library')) {
    return 'library';
  }
  if (pathname.includes('/config')) {
    return 'config';
  }
  if (pathname.includes('/template')) {
    return 'template';
  }
  if (pathname.startsWith('/platform')) {
    return 'platform';
  }
  if (pathname.includes('/plugin')) {
    return 'plugin';
  }
  return 'home';
};

const buildMenuLabels = (): MenuLabels => ({
  home: I18n.t('navigation_home', {}, '主页'),
  develop: I18n.t('navigation_workspace_develop', {}, '项目开发'),
  library: I18n.t('navigation_workspace_library', {}, '资源库'),
  config: I18n.t('navigation_space_config', {}, '空间配置'),
  template: I18n.t('navigation_template_store', {}, '模板商店'),
  plugin: I18n.t('navigation_plugin_store', {}, '插件商店'),
  platform: tNoOptions('platform_management_menu_title', '平台管理'),
});

export const buildMenuGroups = ({
  menuLabels,
  navigate,
  spaceId,
  showPlatformManagement,
}: {
  menuLabels: MenuLabels;
  navigate: NavigateFunction;
  spaceId?: string;
  showPlatformManagement: boolean;
}): MenuGroup[] => {
  const workspaceItems = [
    {
      key: 'home',
      icon: <IconCozHouse />,
      activeIcon: <IconCozHouseFill />,
      label: menuLabels.home,
      path: `/space/${spaceId}/home`,
      onClick: () => navigate(`/space/${spaceId}/home`),
    },
    {
      key: 'develop',
      icon: <IconCozBot />,
      activeIcon: <IconCozBotFill />,
      label: menuLabels.develop,
      path: `/space/${spaceId}/develop`,
      onClick: () => navigate(`/space/${spaceId}/develop`),
    },
    {
      key: 'library',
      icon: <IconCozKnowledge />,
      activeIcon: <IconCozKnowledgeFill />,
      label: menuLabels.library,
      path: `/space/${spaceId}/library`,
      onClick: () => navigate(`/space/${spaceId}/library`),
    },
    {
      key: 'config',
      icon: <IconCozSetting />,
      activeIcon: <IconCozSettingFill />,
      label: menuLabels.config,
      path: `/space/${spaceId}/config`,
      badge: true,
      onClick: () => navigate(`/space/${spaceId}/config`),
    },
  ];

  if (showPlatformManagement) {
    workspaceItems.push({
      key: 'platform',
      icon: <IconCozCompass />,
      activeIcon: <IconCozCompassFill />,
      label: menuLabels.platform,
      path: '/platform',
      onClick: () => navigate('/platform'),
    });
  }

  return [
    {
      items: workspaceItems,
    },
    {
      items: [
        {
          key: 'template',
          icon: <IconCozStore />,
          activeIcon: <IconCozStoreFill />,
          label: menuLabels.template,
          path: '/explore/template',
          onClick: () => navigate('/explore/template'),
        },
        {
          key: 'plugin',
          icon: <IconCozPlugin />,
          activeIcon: <IconCozPluginFill />,
          label: menuLabels.plugin,
          path: '/explore/plugin',
          onClick: () => navigate('/explore/plugin'),
        },
      ],
    },
  ];
};

export const VerticalSidebarMenuAdapter: React.FC<
  VerticalSidebarMenuAdapterProps
> = ({ onCreateClick }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { node: logoutModal, open: openLogoutModal } = useLogout();
  const currentSpace = useSpaceStore(state => state.space);
  const spaceList = useSpaceStore(state => state.spaceList);
  const showPlatformManagement = usePlatformManagementAccess();
  const { node: createSpaceModal, open: openCreateSpaceModal } = useCreateSpace(
    {
      autoNavigate: true,
      onSuccess: spaceId => {
        console.log('Workspace created successfully:', spaceId);
      },
    },
  );

  const currentMenuKey = useMemo(
    () => resolveCurrentMenuKey(pathname),
    [pathname],
  );

  const handleLogoClick = useCallback(() => navigate('/'), [navigate]);
  const handleSpaceSwitch = useCallback(
    (spaceId: string) => {
      navigate(`/space/${spaceId}/home`);
    },
    [navigate],
  );

  const handleCreateClick = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
      return;
    }
    console.log('Create button clicked');
  }, [onCreateClick]);

  const handleAddSpace = useCallback(() => {
    openCreateSpaceModal();
  }, [openCreateSpaceModal]);

  const menuLabels = useMemo(() => buildMenuLabels(), []);
  const menuGroups = useMemo(
    () =>
      buildMenuGroups({
        menuLabels,
        navigate,
        spaceId: currentSpace?.id,
        showPlatformManagement,
      }),
    [currentSpace?.id, menuLabels, navigate, showPlatformManagement],
  );

  return (
    <>
      <VerticalSidebarMenu
        onLogoClick={handleLogoClick}
        currentSpace={currentSpace}
        spaceList={spaceList}
        onSpaceSwitch={handleSpaceSwitch}
        onCreateClick={handleCreateClick}
        menuGroups={menuGroups}
        currentMenuKey={currentMenuKey}
        onAddSpace={handleAddSpace}
        onLogoutClick={openLogoutModal}
      />
      {createSpaceModal}
      {logoutModal}
    </>
  );
};
