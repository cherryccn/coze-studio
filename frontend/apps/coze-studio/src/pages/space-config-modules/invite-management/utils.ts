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

import type { InviteStatusKey } from './types';

export const getInviteStatusLabel = (status: InviteStatusKey) => {
  switch (status) {
    case 'joined':
      return I18n.t('space_config_invite_filter_joined', {}, '已加入');
    case 'pending':
      return I18n.t('space_config_invite_filter_pending', {}, '确认中');
    case 'rejected':
      return I18n.t('space_config_invite_filter_rejected', {}, '已拒绝');
    case 'revoked':
      return I18n.t('space_config_invite_filter_revoked', {}, '已撤销');
    case 'expired':
      return I18n.t('space_config_invite_filter_expired', {}, '已过期');
    default:
      return I18n.t('space_config_invite_filter_all', {}, '全部');
  }
};
