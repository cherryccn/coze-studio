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
  type MemberInfo,
  SpaceInviteStatus,
} from '@coze-arch/bot-api/playground_api';

import type {
  AddMemberCandidateItem,
  InviteFilterKey,
  InviteStatusKey,
} from './types';

export const mapFilterToStatus = (filter: InviteFilterKey) => {
  switch (filter) {
    case 'joined':
      return SpaceInviteStatus.Joined;
    case 'pending':
      return SpaceInviteStatus.Confirming;
    case 'rejected':
      return SpaceInviteStatus.Rejected;
    case 'revoked':
      return SpaceInviteStatus.Revoked;
    case 'expired':
      return SpaceInviteStatus.Expired;
    default:
      return undefined;
  }
};

export const mapStatusToKey = (status?: SpaceInviteStatus): InviteStatusKey => {
  switch (status) {
    case SpaceInviteStatus.Joined:
      return 'joined';
    case SpaceInviteStatus.Confirming:
      return 'pending';
    case SpaceInviteStatus.Rejected:
      return 'rejected';
    case SpaceInviteStatus.Revoked:
      return 'revoked';
    case SpaceInviteStatus.Expired:
      return 'expired';
    default:
      return 'pending';
  }
};

export const formatTimestamp = (timestamp?: string) => {
  if (!timestamp || !/^\d+$/.test(timestamp)) {
    return '--';
  }
  const value = Number(timestamp);
  if (Number.isNaN(value) || value <= 0) {
    return '--';
  }
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const mapMemberInfoToCandidate = (
  memberInfo: MemberInfo,
): AddMemberCandidateItem => ({
  id: memberInfo.user_id || '',
  nickname: memberInfo.name || '--',
  username: memberInfo.user_name || '--',
  iconUrl: memberInfo.icon_url || undefined,
  isJoined: Boolean(memberInfo.is_join),
  isInviting: Boolean(memberInfo.is_confirming),
});
