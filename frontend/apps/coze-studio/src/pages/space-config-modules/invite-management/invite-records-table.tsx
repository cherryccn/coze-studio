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

import { type CSSProperties, Fragment } from 'react';

import { I18n } from '@coze-arch/i18n';
import { IconCozPeopleFill } from '@coze-arch/coze-design/icons';
import { Divider, Typography } from '@coze-arch/coze-design';

import { getInviteStatusLabel } from './utils';
import type { InviteRecordItem, InviteStatusKey } from './types';
import { INVITE_STATUS_STYLE } from './constants';

interface InviteRecordsTableProps {
  inviteRecords: InviteRecordItem[];
  onRevokeInvite: (inviteUserId: string) => void;
}

const INVITE_RECORD_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'minmax(0, 2.3fr) minmax(0, 1.4fr) 304px 224px 200px',
};

const UserCircleAvatar = () => (
  <div
    className="rounded-full overflow-hidden bg-blue-500 flex-none flex items-center justify-center text-white"
    style={{
      width: 28,
      height: 28,
      minWidth: 28,
      minHeight: 28,
      maxWidth: 28,
      maxHeight: 28,
    }}
  >
    <IconCozPeopleFill className="text-[14px]" />
  </div>
);

const getInviteActionText = (status: InviteStatusKey) => {
  if (status === 'pending') {
    return I18n.t('space_config_invites_action_revoke', {}, '撤销邀请');
  }

  return I18n.t('space_config_invites_action_none', {}, '--');
};

const InviteTableHeader = () => (
  <div
    className="grid items-center gap-[12px] px-[16px] py-[10px] coz-bg-secondary text-left"
    style={INVITE_RECORD_GRID_STYLE}
  >
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary pl-[36px]">
      {I18n.t('space_config_invites_table_nickname', {}, '昵称')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_invites_table_username', {}, '用户名')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_invites_table_time', {}, '邀请时间')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_invites_table_status', {}, '邀请状态')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_invites_table_action', {}, '操作')}
    </Typography.Text>
  </div>
);

const InviteRecordRow = ({
  invite,
  onRevokeInvite,
}: {
  invite: InviteRecordItem;
  onRevokeInvite: (inviteUserId: string) => void;
}) => (
  <div
    className="grid items-center gap-[12px] px-[16px] py-[12px] transition-colors hover:coz-bg-secondary text-left"
    style={INVITE_RECORD_GRID_STYLE}
  >
    <div className="min-w-0 flex items-center gap-[8px]">
      <UserCircleAvatar />
      <Typography.Text className="coz-fg-primary text-[14px] font-[500] leading-[22px] block truncate">
        {invite.nickname}
      </Typography.Text>
    </div>
    <div className="min-w-0">
      <Typography.Text className="coz-fg-secondary text-[14px] leading-[22px] block truncate">
        @{invite.username}
      </Typography.Text>
    </div>
    <Typography.Text className="coz-fg-secondary text-[14px] leading-[22px] block truncate">
      {invite.inviteTime}
    </Typography.Text>
    <div className="justify-self-start">
      <span
        className={`inline-flex items-center rounded-full px-[8px] py-[2px] text-[13px] font-[500] leading-[20px] ${INVITE_STATUS_STYLE[invite.status]}`}
      >
        {getInviteStatusLabel(invite.status)}
      </span>
    </div>
    {invite.status === 'pending' ? (
      <button
        type="button"
        className="text-[14px] font-[500] leading-[22px] text-[#1D61F0] cursor-pointer bg-transparent border-0 p-0 text-left"
        onClick={() => onRevokeInvite(invite.id)}
      >
        {getInviteActionText(invite.status)}
      </button>
    ) : (
      <Typography.Text className="coz-fg-secondary text-[14px] leading-[22px]">
        {getInviteActionText(invite.status)}
      </Typography.Text>
    )}
  </div>
);

const InviteEmpty = () => (
  <div className="px-[16px] py-[40px] text-center">
    <Typography.Text className="coz-fg-secondary text-[14px]">
      {I18n.t('space_config_invites_empty', {}, '暂无符合条件的邀请记录')}
    </Typography.Text>
  </div>
);

export const InviteRecordsTable = ({
  inviteRecords,
  onRevokeInvite,
}: InviteRecordsTableProps) => (
  <div className="coz-bg-max rounded-[12px] border border-solid coz-stroke-primary overflow-hidden">
    <div>
      <InviteTableHeader />
      <Divider className="mx-[16px] coz-stroke-primary" />
      {inviteRecords.length ? (
        inviteRecords.map((item, index) => (
          <Fragment key={item.id}>
            <InviteRecordRow invite={item} onRevokeInvite={onRevokeInvite} />
            {index !== inviteRecords.length - 1 ? (
              <Divider className="mx-[16px] coz-stroke-primary" />
            ) : null}
          </Fragment>
        ))
      ) : (
        <InviteEmpty />
      )}
    </div>
  </div>
);
