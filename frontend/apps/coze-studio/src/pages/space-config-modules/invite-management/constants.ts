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

import type {
  InviteFilterOption,
  InviteRecordItem,
  InviteStatusKey,
} from './types';

export const INVITE_LINK_EXPIRES_AT = '2026-03-06 09:05';
export const INVITE_LINK_URL =
  'https://www.coze.cn/invite/8B8P60Sx7PVviqp2pgfJ?type=1';

export const INVITE_FILTERS: InviteFilterOption[] = [
  { key: 'all', i18nKey: 'space_config_invite_filter_all', fallback: '全部' },
  {
    key: 'joined',
    i18nKey: 'space_config_invite_filter_joined',
    fallback: '已加入',
  },
  {
    key: 'pending',
    i18nKey: 'space_config_invite_filter_pending',
    fallback: '确认中',
  },
  {
    key: 'rejected',
    i18nKey: 'space_config_invite_filter_rejected',
    fallback: '已拒绝',
  },
  {
    key: 'revoked',
    i18nKey: 'space_config_invite_filter_revoked',
    fallback: '已撤销',
  },
  {
    key: 'expired',
    i18nKey: 'space_config_invite_filter_expired',
    fallback: '已过期',
  },
];

export const INVITE_STATUS_STYLE: Record<InviteStatusKey, string> = {
  joined: 'bg-[#EAF7EF] text-[#0F8A45]',
  pending: 'bg-[#FFF6DB] text-[#9B6B00]',
  rejected: 'bg-[#FDECEC] text-[#B13535]',
  revoked: 'bg-[#F2F3F5] text-[#5C6270]',
  expired: 'bg-[#F4F2FF] text-[#6A4BBF]',
};

export const MOCK_INVITE_RECORDS: InviteRecordItem[] = [
  {
    id: 'invite-1',
    nickname: '小王',
    username: 'xiaowang',
    status: 'joined',
    inviteTime: '2026-02-25 10:12',
  },
  {
    id: 'invite-2',
    nickname: 'Annie',
    username: 'annie_case',
    status: 'pending',
    inviteTime: '2026-02-25 14:26',
  },
  {
    id: 'invite-3',
    nickname: '产品同学',
    username: 'pm_zhang',
    status: 'rejected',
    inviteTime: '2026-02-24 18:40',
  },
  {
    id: 'invite-4',
    nickname: '设计同学',
    username: 'design_chen',
    status: 'revoked',
    inviteTime: '2026-02-24 09:03',
  },
  {
    id: 'invite-5',
    nickname: '外部合作方',
    username: 'partner_li',
    status: 'expired',
    inviteTime: '2026-02-23 20:11',
  },
];
