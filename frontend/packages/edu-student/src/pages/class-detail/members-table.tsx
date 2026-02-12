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

import React from 'react';

import { I18n } from '@coze-arch/i18n';
import { Card, Table } from '@coze-arch/coze-design';

interface ClassMember {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  role: string;
  joinedAt: string;
}

interface MembersTableProps {
  members: ClassMember[];
  loading: boolean;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  loading,
}) => {
  const columns = [
    {
      title: I18n.t('edu_member_name', {}, 'Name'),
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string) => (
        <span className="text-[14px] coz-fg-primary">{text || '-'}</span>
      ),
    },
    {
      title: I18n.t('edu_member_email', {}, 'Email'),
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (text: string) => (
        <span className="text-[14px] coz-fg-secondary">{text || '-'}</span>
      ),
    },
    {
      title: I18n.t('role', {}, 'Role'),
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <span className="text-[14px] coz-fg-tertiary">
          {I18n.t(`role_${role}`, {}, role)}
        </span>
      ),
    },
    {
      title: I18n.t('edu_joined_at', {}, 'Joined At'),
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 180,
      render: (date: string) => (
        <span className="text-[14px] coz-fg-tertiary">
          {new Date(date).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <Card bordered className="mt-[16px]">
      <div className="mb-[16px]">
        <div className="text-[16px] font-[500] coz-fg-primary">
          {I18n.t('edu_members', {}, 'Members')} ({members.length})
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={members}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );
};
