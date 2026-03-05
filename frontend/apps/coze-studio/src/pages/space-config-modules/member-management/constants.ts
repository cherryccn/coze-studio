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
  MEMBER_ROLE,
  type MemberFilterOption,
  type MemberRecordItem,
} from './types';

export const MEMBER_FILTERS: MemberFilterOption[] = [
  { key: 'all', i18nKey: 'space_config_member_filter_all', fallback: '全部' },
  {
    key: 'owner',
    i18nKey: 'space_config_member_filter_owner',
    fallback: '创建人',
  },
  {
    key: 'admin',
    i18nKey: 'space_config_member_filter_admin',
    fallback: '管理员',
  },
  {
    key: 'member',
    i18nKey: 'space_config_member_filter_member',
    fallback: '成员',
  },
];

export const MEMBER_ROLE_SELECT_OPTIONS = [
  {
    value: MEMBER_ROLE.ADMIN,
    i18nKey: 'team_management_role_admin',
    fallback: '管理员',
  },
  {
    value: MEMBER_ROLE.MEMBER,
    i18nKey: 'team_management_role_member',
    fallback: '成员',
  },
];

export const MOCK_MEMBER_RECORDS: MemberRecordItem[] = [
  {
    id: 'member-1',
    nickname: '空间所有者',
    username: 'owner_user',
    roleType: MEMBER_ROLE.OWNER,
    joinTime: '2026-02-20 09:12',
    canRemove: false,
  },
  {
    id: 'member-2',
    nickname: 'Annie',
    username: 'annie_case',
    roleType: MEMBER_ROLE.ADMIN,
    joinTime: '2026-02-22 14:08',
    canRemove: true,
  },
  {
    id: 'member-3',
    nickname: '产品同学',
    username: 'pm_zhang',
    roleType: MEMBER_ROLE.MEMBER,
    joinTime: '2026-02-23 18:40',
    canRemove: true,
  },
  {
    id: 'member-4',
    nickname: '设计同学',
    username: 'design_chen',
    roleType: MEMBER_ROLE.MEMBER,
    joinTime: '2026-02-24 11:31',
    canRemove: true,
  },
];
