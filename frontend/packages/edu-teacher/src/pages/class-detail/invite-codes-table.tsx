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

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { I18n } from '@coze-arch/i18n';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  type TableColumnData,
} from '@coze-arch/coze-design';
import { IconCopy } from '@coze-arch/bot-icons';

interface InviteCode {
  id: string;
  code: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

interface InviteCodesTableProps {
  inviteCodes: InviteCode[];
  loading: boolean;
  onCopyCode: (code: string) => void;
}

const { Text } = Typography;

export const InviteCodesTable: React.FC<InviteCodesTableProps> = ({
  inviteCodes,
  loading,
  onCopyCode,
}) => {
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>('');

  const handleShowQRCode = (code: string) => {
    setSelectedCode(code);
    setQrCodeModalVisible(true);
  };

  const columns: TableColumnData[] = [
    {
      title: I18n.t('edu_invite_code', {}, 'Code'),
      dataIndex: 'code',
      render: (code: string) => (
        <Space>
          <Text code>{code}</Text>
          <Button
            size="small"
            icon={<IconCopy />}
            onClick={() => onCopyCode(code)}
          />
        </Space>
      ),
    },
    {
      title: I18n.t('edu_used_count', {}, 'Used / Max'),
      key: 'usage',
      render: (_: unknown, record: InviteCode) =>
        `${record.usedCount} / ${record.maxUses || '∞'}`,
    },
    {
      title: I18n.t('edu_created_at', {}, 'Created'),
      dataIndex: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: I18n.t('status', {}, 'Status'),
      dataIndex: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'grey'}>
          {isActive
            ? I18n.t('active', {}, 'Active')
            : I18n.t('inactive', {}, 'Inactive')}
        </Tag>
      ),
    },
    {
      title: I18n.t('actions', {}, 'Actions'),
      key: 'actions',
      render: (_: unknown, record: InviteCode) => (
        <Button
          size="small"
          onClick={() => handleShowQRCode(record.code)}
        >
          {I18n.t('edu_show_qrcode', {}, 'QR Code')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={inviteCodes}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={I18n.t('edu_invite_code_qrcode', {}, 'Invite Code QR Code')}
        visible={qrCodeModalVisible}
        onCancel={() => setQrCodeModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => onCopyCode(selectedCode)}>
              {I18n.t('copy_code', {}, 'Copy Code')}
            </Button>
            <Button
              theme="solid"
              type="primary"
              onClick={() => setQrCodeModalVisible(false)}
            >
              {I18n.t('close', {}, 'Close')}
            </Button>
          </Space>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px',
          }}
        >
          <QRCodeSVG
            value={selectedCode}
            size={256}
            level="H"
            includeMargin
          />
          <Text
            style={{
              marginTop: '16px',
              fontSize: '14px',
              color: 'var(--semi-color-text-2)',
            }}
          >
            {I18n.t(
              'edu_scan_qrcode_to_join',
              {},
              'Scan this QR code to join the class',
            )}
          </Text>
          <Text
            code
            style={{
              marginTop: '8px',
              fontSize: '16px',
            }}
          >
            {selectedCode}
          </Text>
        </div>
      </Modal>
    </>
  );
};
