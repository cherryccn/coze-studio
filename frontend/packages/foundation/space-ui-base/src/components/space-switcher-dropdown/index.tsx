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

import { type FC, useState, useMemo, useCallback, type ReactNode } from 'react';

import classNames from 'classnames';
import { I18n } from '@coze-arch/i18n';
// [修复] 使用项目中正确的图标库
import { IconCozPlus } from '@coze-arch/coze-design/icons';
import { Dropdown, Avatar, Typography, Button } from '@coze-arch/coze-design';
import { type BotSpace, SpaceType } from '@coze-arch/bot-api/developer_api';

interface SpaceSwitcherDropdownProps {
  /** 当前空间信息 */
  currentSpace: BotSpace;
  /** 所有空间列表 */
  spaceList: BotSpace[];
  /** 点击空间项的回调 */
  onSpaceClick: (spaceId: string) => void;
  /** 点击添加空间的回调 */
  onAddSpaceClick?: () => void;
  /** 触发器自定义内容 */
  children: ReactNode;
  /** 搜索占位符文本 */
  searchPlaceholder?: string;
  /** 添加空间按钮文本 */
  addSpaceText?: string;
}

interface DropdownContentProps {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  personalSpace?: BotSpace;
  teamSpaces: BotSpace[];
  currentSpace: BotSpace;
  onSpaceClick: (spaceId: string) => void;
  addSpaceText: string;
  onAddSpaceClick?: () => void;
}

const DropdownContent: FC<DropdownContentProps> = ({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  personalSpace,
  teamSpaces,
  currentSpace,
  onSpaceClick,
  addSpaceText,
  onAddSpaceClick,
}) => (
  <div className="w-[280px] max-h-[400px] flex flex-col overflow-hidden rounded-[12px]">
    {/* 搜索框 - 移除搜索图标，使用简单输入框 */}
    <div className="px-[12px] py-[8px] border-b coz-stroke-primary">
      <input
        type="text"
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full h-[32px] px-[12px] rounded-[6px] coz-bg-secondary coz-fg-primary text-[14px] outline-none border-none"
        onClick={e => e.stopPropagation()}
      />
    </div>

    {/* 空间列表 */}
    <div className="flex-1 overflow-y-auto px-[8px] py-[8px]">
      {/* 个人空间 */}
      {personalSpace ? (
        <div
          className={classNames(
            'flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px] cursor-pointer',
            'hover:coz-mg-secondary-hovered',
            currentSpace.id === personalSpace.id && 'coz-bg-primary',
          )}
          onClick={() => personalSpace.id && onSpaceClick(personalSpace.id)}
        >
          <Avatar
            className="w-[24px] h-[24px] rounded-[6px] shrink-0"
            src={personalSpace.icon_url}
          />
          <Typography.Text
            ellipsis={{ showTooltip: true, rows: 1 }}
            className="flex-1 text-[14px] font-[500] coz-fg-primary"
          >
            {I18n.t('menu_title_personal_space', {}, personalSpace.name)}
          </Typography.Text>
          {currentSpace.id === personalSpace.id && (
            <div className="w-[4px] h-[4px] rounded-full coz-bg-brand" />
          )}
        </div>
      ) : null}

      {/* 团队空间列表 */}
      {teamSpaces.length > 0 && (
        <div className="mt-[4px]">
          {teamSpaces.map(space => (
            <div
              key={space.id}
              className={classNames(
                'flex items-center gap-[8px] px-[8px] py-[6px] rounded-[6px] cursor-pointer',
                'hover:coz-mg-secondary-hovered',
                currentSpace.id === space.id && 'coz-bg-primary',
              )}
              onClick={() => space.id && onSpaceClick(space.id)}
            >
              <Avatar
                className="w-[24px] h-[24px] rounded-[6px] shrink-0"
                src={space.icon_url}
              />
              <Typography.Text
                ellipsis={{ showTooltip: true, rows: 1 }}
                className="flex-1 text-[14px] font-[500] coz-fg-primary"
              >
                {space.name}
              </Typography.Text>
              {currentSpace.id === space.id && (
                <div className="w-[4px] h-[4px] rounded-full coz-bg-brand" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!personalSpace && teamSpaces.length === 0 && (
        <div className="py-[24px] text-center">
          <Typography.Text className="text-[14px] coz-fg-tertiary">
            {I18n.t(
              'app_publish_connector_space_mcp_config_dialog_no_results_found',
              {},
              'No results found',
            )}
          </Typography.Text>
        </div>
      )}
    </div>

    {/* 添加新空间按钮 */}
    {onAddSpaceClick ? (
      <div className="px-[12px] py-[8px] border-t coz-stroke-primary">
        <Button
          className="w-full"
          color="secondary"
          icon={<IconCozPlus />}
          onClick={e => {
            e.stopPropagation();
            onAddSpaceClick();
          }}
        >
          {addSpaceText}
        </Button>
      </div>
    ) : null}
  </div>
);

export const SpaceSwitcherDropdown: FC<SpaceSwitcherDropdownProps> = ({
  currentSpace,
  spaceList,
  onSpaceClick,
  onAddSpaceClick,
  children,
  searchPlaceholder,
  addSpaceText,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [visible, setVisible] = useState(false);

  // 使用 useMemo 缓存 i18n 默认值，避免每次渲染都调用 I18n.t()
  const finalSearchPlaceholder = useMemo(
    () =>
      searchPlaceholder ??
      I18n.t('workspace_search_placeholder', {}, 'Search your workspace'),
    [searchPlaceholder],
  );
  const finalAddSpaceText = useMemo(
    () => addSpaceText ?? I18n.t('add', {}, 'Add'),
    [addSpaceText],
  );

  // 过滤和分组空间列表
  const { personalSpace, teamSpaces } = useMemo(() => {
    const filtered = spaceList.filter(space =>
      space.name?.toLowerCase().includes(searchValue.toLowerCase()),
    );

    return {
      personalSpace: filtered.find(
        space => space.space_type === SpaceType.Personal,
      ),
      teamSpaces: filtered.filter(space => space.space_type === SpaceType.Team),
    };
  }, [spaceList, searchValue]);

  const handleSpaceClick = useCallback(
    (spaceId: string) => {
      setVisible(false);
      onSpaceClick(spaceId);
    },
    [onSpaceClick],
  );

  const handleAddSpaceClick = useCallback(() => {
    setVisible(false);
    onAddSpaceClick?.();
  }, [onAddSpaceClick]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // 使用 useMemo 缓存 Popover content，避免不必要的重新渲染
  // 只在 visible 为 true 时才渲染，减少不必要的计算
  const dropdownContent = useMemo(
    () =>
      visible ? (
        <DropdownContent
          searchValue={searchValue}
          searchPlaceholder={finalSearchPlaceholder}
          onSearchChange={handleSearchChange}
          personalSpace={personalSpace}
          teamSpaces={teamSpaces}
          currentSpace={currentSpace}
          onSpaceClick={handleSpaceClick}
          addSpaceText={finalAddSpaceText}
          onAddSpaceClick={onAddSpaceClick ? handleAddSpaceClick : undefined}
        />
      ) : null,
    [
      visible,
      searchValue,
      finalSearchPlaceholder,
      handleSearchChange,
      personalSpace,
      teamSpaces,
      currentSpace,
      handleSpaceClick,
      finalAddSpaceText,
      onAddSpaceClick,
      handleAddSpaceClick,
    ],
  );

  return (
    <Dropdown
      trigger="custom"
      position="bottomLeft"
      visible={visible}
      onVisibleChange={setVisible}
      onClickOutSide={() => {
        setVisible(false);
      }}
      render={dropdownContent}
    >
      <div onClick={() => setVisible(!visible)}>{children}</div>
    </Dropdown>
  );
};
