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

import React, { useMemo, useState } from 'react';

import cls from 'classnames';
import { I18n } from '@coze-arch/i18n';
import {
  IconCozArrowDown,
  IconCozPlus,
  IconCozPeopleFill,
  IconCozTeamFill,
} from '@coze-arch/coze-design/icons';
import { Avatar, Typography, Button } from '@coze-arch/coze-design';
import { SpaceType, type BotSpace } from '@coze-arch/bot-api/developer_api';

import { SpaceSwitcherDropdown } from '../space-switcher-dropdown';

/** 空间头像组件 - 支持图片加载失败降级 */
interface SpaceAvatarProps {
  space?: BotSpace;
  size?: 'small' | 'large';
}

const SpaceAvatar: React.FC<SpaceAvatarProps> = ({ space, size = 'small' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClass =
    size === 'large' ? 'w-[24px] h-[24px]' : 'w-[20px] h-[20px]';
  const roundedClass = size === 'large' ? 'rounded-[6px]' : 'rounded-[4px]';
  const iconSize = size === 'large' ? 'text-[16px]' : 'text-[14px]';

  // 如果没有图片 URL 或图片加载失败，显示默认图标
  if (!space?.icon_url || imageError) {
    const DefaultIcon =
      space?.space_type === SpaceType.Personal
        ? IconCozPeopleFill
        : IconCozTeamFill;
    return (
      <div
        className={cls(
          sizeClass,
          roundedClass,
          'shrink-0 flex items-center justify-center bg-blue-500 text-white',
        )}
      >
        <DefaultIcon className={iconSize} />
      </div>
    );
  }

  // 显示真实图片
  return (
    <Avatar
      className={cls(sizeClass, roundedClass, 'shrink-0')}
      src={space.icon_url}
      onError={() => setImageError(true)}
    />
  );
};

export interface MenuItem {
  key: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
  path: string;
  badge?: boolean; // 橙色小圆点提示
  onClick?: () => void;
}

export interface MenuGroup {
  items: MenuItem[];
}

export interface VerticalSidebarMenuProps {
  /** Logo 点击事件 */
  onLogoClick?: () => void;
  /** 当前空间信息 */
  currentSpace?: {
    space_id: string;
    name: string;
    icon_url?: string;
    space_type: SpaceType;
  };
  /** 空间列表 */
  spaceList?: Array<{
    space_id: string;
    name: string;
    icon_url?: string;
    space_type: SpaceType;
  }>;
  /** 空间切换回调 */
  onSpaceSwitch?: (spaceId: string) => void;
  /** 创建按钮点击回调 */
  onCreateClick?: () => void;
  /** 菜单分组 */
  menuGroups: MenuGroup[];
  /** 当前选中的菜单key */
  currentMenuKey?: string;
  /** 添加空间回调 */
  onAddSpace?: () => void;
}

export const VerticalSidebarMenu: React.FC<VerticalSidebarMenuProps> = ({
  onLogoClick,
  currentSpace,
  spaceList = [],
  onSpaceSwitch,
  onCreateClick,
  menuGroups,
  currentMenuKey,
  onAddSpace,
}) => {
  // 缓存文本避免渲染时副作用
  const addSpaceText = useMemo(() => {
    const currentLang = I18n.getLanguage?.() || 'zh-CN';
    const isZhCN = currentLang.startsWith('zh');
    return isZhCN
      ? `${I18n.t('add')}${I18n.t('navigation_workspace')}`
      : `${I18n.t('add')} ${I18n.t('navigation_workspace')}`;
  }, []);

  const appName = useMemo(() => I18n.t('app_name_coze', {}, '扣子'), []);
  const createButtonText = useMemo(
    () => I18n.t('button_create', {}, '创建'),
    [],
  );
  const searchPlaceholder = useMemo(
    () => I18n.t('workspace_search_placeholder', {}, '搜索空间'),
    [],
  );

  return (
    <div className="w-[240px] h-full flex flex-col coz-bg-max border-r coz-stroke-primary">
      {/* 顶部区域 */}
      <div className="px-[16px] pt-[16px] pb-[12px]">
        {/* Logo */}
        <div
          className="flex items-center gap-[8px] mb-[12px] cursor-pointer hover:opacity-80"
          onClick={onLogoClick}
        >
          <div className="w-[32px] h-[32px] rounded-[8px] coz-bg-brand flex items-center justify-center">
            <span className="text-[18px] font-bold text-white">扣</span>
          </div>
          <Typography.Title
            heading={5}
            className="!mb-0 coz-fg-primary font-[600]"
          >
            {appName}
          </Typography.Title>
        </div>

        {/* 空间切换下拉框 */}
        <SpaceSwitcherDropdown
          currentSpace={currentSpace}
          spaceList={spaceList}
          onSpaceClick={onSpaceSwitch}
          onAddSpaceClick={onAddSpace}
          searchPlaceholder={searchPlaceholder}
          addSpaceText={addSpaceText}
        >
          <div className="cursor-pointer w-full mb-[12px]">
            <div className="h-[40px] px-[12px] w-full hover:coz-bg-secondary rounded-[8px] flex items-center gap-[8px] transition-colors">
              <SpaceAvatar space={currentSpace} size="small" />
              <Typography.Text
                ellipsis={{ showTooltip: true, rows: 1 }}
                className="flex-1 coz-fg-primary text-[14px] font-[500]"
              >
                {currentSpace?.space_type === SpaceType.Personal
                  ? I18n.t('menu_title_personal_space', {}, currentSpace?.name)
                  : currentSpace?.name || ''}
              </Typography.Text>
              <IconCozArrowDown className="text-[12px] coz-fg-tertiary shrink-0" />
            </div>
          </div>
        </SpaceSwitcherDropdown>

        {/* 创建按钮 */}
        <Button
          theme="light"
          size="large"
          icon={<IconCozPlus />}
          onClick={onCreateClick}
          className="w-full !rounded-[8px] !h-[40px] coz-bg-secondary hover:coz-bg-secondary-hovered"
        >
          <span className="text-white font-[500]">{createButtonText}</span>
        </Button>
      </div>

      {/* 导航菜单主体 */}
      <div className="flex-1 overflow-y-auto px-[8px] pb-[16px]">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <div className="h-[16px]" />}
            <div className="space-y-[4px]">
              {group.items.map(item => {
                const isActive = currentMenuKey === item.key;
                return (
                  <div
                    key={item.key}
                    className={cls(
                      'flex items-center gap-[12px] px-[12px] h-[40px] rounded-[8px] cursor-pointer transition-colors relative',
                      isActive
                        ? 'coz-bg-secondary'
                        : 'hover:coz-bg-secondary-hovered',
                    )}
                    onClick={item.onClick}
                  >
                    <span
                      className={cls(
                        'text-[18px] shrink-0',
                        isActive ? 'coz-fg-brand' : 'coz-fg-secondary',
                      )}
                    >
                      {isActive ? item.activeIcon : item.icon}
                    </span>
                    <Typography.Text
                      className={cls(
                        'flex-1 text-[14px] font-[500]',
                        isActive ? 'coz-fg-primary' : 'coz-fg-secondary',
                      )}
                    >
                      {item.label}
                    </Typography.Text>
                    {item.badge ? (
                      <span className="w-[6px] h-[6px] rounded-full bg-[#FF6B2C] shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
