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
import {
  Table,
  Button,
  Popconfirm,
  type TableColumnData,
} from '@coze-arch/coze-design';
import { IconDelete } from '@coze-arch/bot-icons';

import type { ClassMember } from '../../types';

interface MembersTableProps {
  members: ClassMember[];
  loading: boolean;
  onRemoveMember: (userId: string) => Promise<void>;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  loading,
  onRemoveMember,
}) => {
  const columns: TableColumnData[] = [
    {
      title: I18n.t('edu_member_name', {}, 'Name'),
      dataIndex: 'userName',
    },
    {
      title: I18n.t('edu_member_email', {}, 'Email'),
      dataIndex: 'userEmail',
    },
    {
      title: I18n.t('edu_joined_at', {}, 'Joined At'),
      dataIndex: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: I18n.t('actions', {}, 'Actions'),
      key: 'actions',
      render: (_: unknown, record: ClassMember) => (
        <Popconfirm
          title={I18n.t('edu_confirm_remove_member', {}, 'Remove this member?')}
          onConfirm={() => onRemoveMember(record.userId)}
        >
          <Button type="danger" size="small" icon={<IconDelete />}>
            {I18n.t('remove', {}, 'Remove')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={members}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  );
};
