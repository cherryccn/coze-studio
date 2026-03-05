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

import { I18n } from '@coze-arch/i18n';
import { IconCozPlus, IconCozShare } from '@coze-arch/coze-design/icons';
import { Button, Input, Select } from '@coze-arch/coze-design';

import type { InviteFilterKey } from './types';
import { INVITE_FILTERS } from './constants';

interface InviteFilterBarProps {
  inviteStatusFilter: InviteFilterKey;
  onInviteStatusFilterChange: (value: InviteFilterKey) => void;
  inviteSearchKeyword: string;
  onInviteSearchKeywordChange: (value: string) => void;
  onOpenInviteLinkModal: () => void;
  onAddMember: () => void;
}

export const InviteFilterBar = ({
  inviteStatusFilter,
  onInviteStatusFilterChange,
  inviteSearchKeyword,
  onInviteSearchKeywordChange,
  onOpenInviteLinkModal,
  onAddMember,
}: InviteFilterBarProps) => (
  <div className="flex flex-wrap items-center justify-between gap-[12px]">
    <div className="flex items-center">
      <Select
        className="w-[140px]"
        value={inviteStatusFilter}
        optionList={INVITE_FILTERS.map(filter => ({
          value: filter.key,
          label: I18n.t(filter.i18nKey, {}, filter.fallback),
        }))}
        onChange={value => onInviteStatusFilterChange(value as InviteFilterKey)}
      />
    </div>
    <div className="flex flex-wrap items-center justify-end gap-[10px]">
      <Input
        value={inviteSearchKeyword}
        onChange={onInviteSearchKeywordChange}
        className="w-[220px] md:w-[300px]"
        showClear
        placeholder={I18n.t(
          'space_config_invites_search_placeholder',
          {},
          '搜索昵称/用户名',
        )}
      />
      <Button
        onClick={onOpenInviteLinkModal}
        className="px-[16px] border border-solid coz-stroke-primary"
        style={{ backgroundColor: '#F2F3F5', color: '#1F2329' }}
      >
        <span className="inline-flex items-center gap-[6px]">
          <IconCozShare className="text-[14px]" />
          {I18n.t('space_config_invite_link_button', {}, '邀请链接')}
        </span>
      </Button>
      <Button type="primary" onClick={onAddMember} className="px-[16px]">
        <span className="inline-flex items-center gap-[6px]">
          <IconCozPlus className="text-[14px]" />
          {I18n.t('team_add_member', {}, '添加成员')}
        </span>
      </Button>
    </div>
  </div>
);
