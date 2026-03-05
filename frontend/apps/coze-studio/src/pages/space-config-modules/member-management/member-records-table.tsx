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
import {
  IconCozMinusCircle,
  IconCozPeopleFill,
} from '@coze-arch/coze-design/icons';
import { Divider, Select, Typography } from '@coze-arch/coze-design';

import {
  MEMBER_ROLE,
  type MemberRecordItem,
  type MemberRoleType,
} from './types';
import { MEMBER_ROLE_SELECT_OPTIONS } from './constants';

interface MemberRecordsTableProps {
  loading: boolean;
  memberRecords: MemberRecordItem[];
  updatingMemberId?: string;
  removingMemberId?: string;
  onRoleChange: (memberId: string, roleType: MemberRoleType) => void;
  onRemoveMember: (memberId: string) => void;
}

const MEMBER_RECORD_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1.4fr) 220px 240px 140px',
};

const formatJoinTime = (time?: string) => {
  if (!time || time === '--') {
    return '--';
  }

  if (!/^\d+$/.test(time)) {
    return time;
  }

  const timestamp = Number(time);
  if (Number.isNaN(timestamp)) {
    return time;
  }

  const date = new Date(time.length === 10 ? timestamp * 1000 : timestamp);
  if (Number.isNaN(date.getTime())) {
    return time;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getRoleLabel = (roleType: MemberRoleType) => {
  switch (roleType) {
    case MEMBER_ROLE.OWNER:
      return I18n.t('team_management_role_owner', {}, '所有者');
    case MEMBER_ROLE.ADMIN:
      return I18n.t('team_management_role_admin', {}, '管理员');
    default:
      return I18n.t('team_management_role_member', {}, '成员');
  }
};

const UserCircleAvatar = ({
  iconUrl,
  nickname,
}: {
  iconUrl?: string;
  nickname: string;
}) => (
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
    {iconUrl ? (
      <img
        src={iconUrl}
        alt={nickname}
        className="w-full h-full object-cover"
      />
    ) : (
      <IconCozPeopleFill className="text-[14px]" />
    )}
  </div>
);

const MemberTableHeader = () => (
  <div
    className="grid items-center gap-[12px] px-[16px] py-[10px] coz-bg-secondary text-left"
    style={MEMBER_RECORD_GRID_STYLE}
  >
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary pl-[36px]">
      {I18n.t('space_config_members_table_nickname', {}, '昵称')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_members_table_username', {}, '用户名')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_members_table_role', {}, '角色')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_members_table_join_time', {}, '加入时间')}
    </Typography.Text>
    <Typography.Text className="text-[12px] font-[500] leading-[18px] coz-fg-secondary">
      {I18n.t('space_config_members_table_action', {}, '操作')}
    </Typography.Text>
  </div>
);

const MemberRecordRow = ({
  member,
  updatingMemberId,
  removingMemberId,
  onRoleChange,
  onRemoveMember,
}: {
  member: MemberRecordItem;
  updatingMemberId?: string;
  removingMemberId?: string;
  onRoleChange: (memberId: string, roleType: MemberRoleType) => void;
  onRemoveMember: (memberId: string) => void;
}) => {
  const removable = Boolean(member.canRemove);
  const removing = removingMemberId === member.id;

  return (
    <div
      className="grid items-center gap-[12px] px-[16px] py-[12px] transition-colors hover:coz-bg-secondary text-left"
      style={MEMBER_RECORD_GRID_STYLE}
    >
      <div className="min-w-0 flex items-center gap-[8px]">
        <UserCircleAvatar iconUrl={member.iconUrl} nickname={member.nickname} />
        <Typography.Text className="coz-fg-primary text-[14px] font-[500] leading-[22px] block truncate">
          {member.nickname}
        </Typography.Text>
      </div>
      <div className="min-w-0">
        <Typography.Text className="coz-fg-secondary text-[14px] leading-[22px] block truncate">
          {member.username === '--' ? '--' : `@${member.username}`}
        </Typography.Text>
      </div>
      <div className="min-w-0">
        {member.roleType === MEMBER_ROLE.OWNER ? (
          <Typography.Text className="coz-fg-primary text-[14px] font-[500] leading-[22px] block truncate">
            {getRoleLabel(member.roleType)}
          </Typography.Text>
        ) : (
          <Select
            className="w-[120px]"
            value={member.roleType}
            disabled={updatingMemberId === member.id}
            optionList={MEMBER_ROLE_SELECT_OPTIONS.map(option => ({
              value: option.value,
              label: I18n.t(option.i18nKey, {}, option.fallback),
            }))}
            onChange={value => onRoleChange(member.id, value as MemberRoleType)}
          />
        )}
      </div>
      <Typography.Text className="coz-fg-secondary text-[14px] leading-[22px] block truncate">
        {formatJoinTime(member.joinTime)}
      </Typography.Text>
      <div>
        <button
          type="button"
          className="w-[28px] h-[28px] rounded-[8px] border border-solid coz-stroke-primary inline-flex items-center justify-center transition-colors hover:coz-bg-secondary disabled:cursor-not-allowed disabled:opacity-[0.5]"
          onClick={() => onRemoveMember(member.id)}
          disabled={!removable || removing}
          aria-label={I18n.t(
            'space_config_members_action_remove',
            {},
            '移除成员',
          )}
        >
          <IconCozMinusCircle
            className={`text-[14px] ${removable ? 'text-[#1D61F0]' : 'text-[#8F959E]'}`}
          />
        </button>
      </div>
    </div>
  );
};

const MemberLoading = () => (
  <div className="px-[16px] py-[40px] text-center">
    <Typography.Text className="coz-fg-secondary text-[14px]">
      {I18n.t('space_config_members_loading', {}, '加载中...')}
    </Typography.Text>
  </div>
);

const MemberEmpty = () => (
  <div className="px-[16px] py-[40px] text-center">
    <Typography.Text className="coz-fg-secondary text-[14px]">
      {I18n.t('space_config_members_empty', {}, '暂无符合条件的成员')}
    </Typography.Text>
  </div>
);

export const MemberRecordsTable = ({
  loading,
  memberRecords,
  updatingMemberId,
  removingMemberId,
  onRoleChange,
  onRemoveMember,
}: MemberRecordsTableProps) => (
  <div className="coz-bg-max rounded-[12px] border border-solid coz-stroke-primary overflow-hidden">
    <div>
      <MemberTableHeader />
      <Divider className="mx-[16px] coz-stroke-primary" />
      {loading ? (
        <MemberLoading />
      ) : memberRecords.length ? (
        memberRecords.map((item, index) => (
          <Fragment key={item.id}>
            <MemberRecordRow
              member={item}
              updatingMemberId={updatingMemberId}
              removingMemberId={removingMemberId}
              onRoleChange={onRoleChange}
              onRemoveMember={onRemoveMember}
            />
            {index !== memberRecords.length - 1 ? (
              <Divider className="mx-[16px] coz-stroke-primary" />
            ) : null}
          </Fragment>
        ))
      ) : (
        <MemberEmpty />
      )}
    </div>
  </div>
);
