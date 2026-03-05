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

export type MemberFilterKey = 'all' | 'owner' | 'admin' | 'member';

export const MEMBER_ROLE = {
  OWNER: 1,
  ADMIN: 2,
  MEMBER: 3,
} as const;

export type MemberRoleType = (typeof MEMBER_ROLE)[keyof typeof MEMBER_ROLE];

export interface MemberFilterOption {
  key: MemberFilterKey;
  i18nKey: string;
  fallback: string;
}

export interface MemberRecordItem {
  id: string;
  nickname: string;
  username: string;
  roleType: MemberRoleType;
  joinTime: string;
  iconUrl?: string;
  canRemove?: boolean;
}
