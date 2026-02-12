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

import React, { useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconCozHouse,
  IconCozHouseFill,
  IconCozBot,
  IconCozBotFill,
  IconCozKnowledge,
  IconCozKnowledgeFill,
  IconCozDocument,
  IconCozDocumentFill,
  IconCozSetting,
  IconCozSettingFill,
  IconCozAreaChart,
  IconCozAreaChartFill,
  IconCozAsynchronousTask,
  IconCozAsynchronousTaskFill,
  IconCozPlugin,
  IconCozPluginFill,
  IconCozStore,
  IconCozStoreFill,
  IconCozPeople,
  IconCozPeopleFill,
  IconCozApp,
  IconCozAppFill,
} from '@coze-arch/coze-design/icons';
import { I18n } from '@coze-arch/i18n';
import { useSpaceStore } from '@coze-foundation/space-store';

import {
  VerticalSidebarMenu,
  type MenuGroup,
} from '@coze-foundation/space-ui-base';

import { useCreateSpace } from '../../hooks/use-create-space';

export interface VerticalSidebarMenuAdapterProps {
  /** 创建按钮点击回调 */
  onCreateClick?: () => void;
}

export const VerticalSidebarMenuAdapter: React.FC<VerticalSidebarMenuAdapterProps> = ({
  onCreateClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 获取当前空间和空间列表
  const currentSpace = useSpaceStore(state => state.space);
  const spaceList = useSpaceStore(state => state.spaceList);

  // 创建空间模态框
  const { node: createSpaceModal, open: openCreateSpaceModal } = useCreateSpace({
    autoNavigate: true,
    onSuccess: spaceId => {
      console.log('Workspace created successfully:', spaceId);
    },
  });

  // 从URL路径提取当前激活的菜单key
  const currentMenuKey = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/home')) return 'home';
    if (path.includes('/develop')) return 'develop';
    if (path.includes('/library')) return 'library';
    if (path.includes('/task')) return 'task';
    if (path.includes('/test')) return 'test';
    if (path.includes('/config')) return 'config';
    if (path.includes('/template')) return 'template';
    if (path.includes('/plugin')) return 'plugin';
    if (path.includes('/community')) return 'community';
    if (path.includes('/api')) return 'api';
    if (path.includes('/doc')) return 'doc';
    if (path.includes('/management')) return 'management';
    return 'home';
  }, [location.pathname]);

  // Logo点击处理
  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // 空间切换处理
  const handleSpaceSwitch = useCallback(
    (spaceId: string) => {
      navigate(`/space/${spaceId}/home`);
    },
    [navigate],
  );

  // 创建按钮点击处理
  const handleCreateClick = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      console.log('Create button clicked');
    }
  }, [onCreateClick]);

  // 添加空间处理
  const handleAddSpace = useCallback(() => {
    openCreateSpaceModal();
  }, [openCreateSpaceModal]);

  // 使用 useMemo 缓存菜单项文本
  const menuLabels = useMemo(() => ({
    home: I18n.t('navigation_home', {}, '主页'),
    develop: I18n.t('navigation_workspace_develop', {}, '项目开发'),
    library: I18n.t('navigation_workspace_library', {}, '资源库'),
    task: I18n.t('navigation_task_center', {}, '任务中心'),
    test: I18n.t('navigation_effect_test', {}, '效果评测'),
    config: I18n.t('navigation_space_config', {}, '空间配置'),
    template: I18n.t('navigation_template_store', {}, '模板商店'),
    plugin: I18n.t('navigation_plugin_store', {}, '插件商店'),
    community: I18n.t('navigation_community', {}, '作品社区'),
    api: I18n.t('navigation_api_management', {}, 'API 管理'),
    doc: I18n.t('navigation_doc_center', {}, '文档中心'),
    management: I18n.t('navigation_general_management', {}, '通用管理'),
  }), []);

  // 定义菜单分组
  const menuGroups = useMemo<MenuGroup[]>(() => {
    const spaceId = currentSpace?.space_id;

    return [
      // 第一组：主要工作区菜单
      {
        items: [
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
            key: 'task',
            icon: <IconCozAsynchronousTask />,
            activeIcon: <IconCozAsynchronousTaskFill />,
            label: menuLabels.task,
            path: `/space/${spaceId}/task`,
            onClick: () => navigate(`/space/${spaceId}/task`),
          },
          {
            key: 'test',
            icon: <IconCozAreaChart />,
            activeIcon: <IconCozAreaChartFill />,
            label: menuLabels.test,
            path: `/space/${spaceId}/test`,
            onClick: () => navigate(`/space/${spaceId}/test`),
          },
          {
            key: 'config',
            icon: <IconCozSetting />,
            activeIcon: <IconCozSettingFill />,
            label: menuLabels.config,
            path: `/space/${spaceId}/config`,
            badge: true, // 显示橙色小圆点
            onClick: () => navigate(`/space/${spaceId}/config`),
          },
        ],
      },
      // 第二组：商店和社区
      {
        items: [
          {
            key: 'template',
            icon: <IconCozStore />,
            activeIcon: <IconCozStoreFill />,
            label: menuLabels.template,
            path: '/template',
            onClick: () => navigate('/template'),
          },
          {
            key: 'plugin',
            icon: <IconCozPlugin />,
            activeIcon: <IconCozPluginFill />,
            label: menuLabels.plugin,
            path: '/plugin',
            onClick: () => navigate('/plugin'),
          },
          {
            key: 'community',
            icon: <IconCozPeople />,
            activeIcon: <IconCozPeopleFill />,
            label: menuLabels.community,
            path: '/community',
            onClick: () => navigate('/community'),
          },
        ],
      },
      // 第三组：管理和文档
      {
        items: [
          {
            key: 'api',
            icon: <IconCozApp />,
            activeIcon: <IconCozAppFill />,
            label: menuLabels.api,
            path: '/api',
            onClick: () => navigate('/api'),
          },
          {
            key: 'doc',
            icon: <IconCozDocument />,
            activeIcon: <IconCozDocumentFill />,
            label: menuLabels.doc,
            path: '/doc',
            onClick: () => navigate('/doc'),
          },
          {
            key: 'management',
            icon: <IconCozSetting />,
            activeIcon: <IconCozSettingFill />,
            label: menuLabels.management,
            path: '/management',
            onClick: () => navigate('/management'),
          },
        ],
      },
    ];
  }, [currentSpace?.space_id, menuLabels, navigate]);

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
      />
      {createSpaceModal}
    </>
  );
};
