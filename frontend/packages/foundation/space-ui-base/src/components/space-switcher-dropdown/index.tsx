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

import { type FC, useState, useMemo, type ReactNode } from 'react';

import classNames from 'classnames';
// [修复] 使用项目中正确的图标库
import { IconCozPlus } from '@coze-arch/coze-design/icons';
import { Popover, Avatar, Typography, Button } from '@coze-arch/coze-design';
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

export const SpaceSwitcherDropdown: FC<SpaceSwitcherDropdownProps> = ({
  currentSpace,
  spaceList,
  onSpaceClick,
  onAddSpaceClick,
  children,
  searchPlaceholder = 'Search workspace',
  addSpaceText = 'Add new space',
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [visible, setVisible] = useState(false);

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

  const handleSpaceClick = (spaceId: string) => {
    setVisible(false);
    onSpaceClick(spaceId);
  };

  const dropdownContent = (
    <div className="w-[280px] max-h-[400px] flex flex-col overflow-hidden">
      {/* 搜索框 - 移除搜索图标，使用简单输入框 */}
      <div className="px-[12px] py-[8px] border-b coz-stroke-primary">
        <input
          type="text"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
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
            onClick={() =>
              personalSpace.id && handleSpaceClick(personalSpace.id)
            }
          >
            <Avatar
              className="w-[24px] h-[24px] rounded-[6px] shrink-0"
              src={personalSpace.icon_url}
            />
            <Typography.Text
              ellipsis={{ showTooltip: true, rows: 1 }}
              className="flex-1 text-[14px] font-[500] coz-fg-primary"
            >
              {personalSpace.name}
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
                onClick={() => space.id && handleSpaceClick(space.id)}
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
              No workspace found
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
              setVisible(false);
              onAddSpaceClick();
            }}
          >
            {addSpaceText}
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <Popover
      visible={visible}
      onVisibleChange={setVisible}
      position="bottomLeft"
      trigger="click"
      stopPropagation
      content={dropdownContent}
      className="rounded-[12px]"
    >
      {children}
    </Popover>
  );
};
