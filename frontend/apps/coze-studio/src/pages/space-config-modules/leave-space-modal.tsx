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
import { Modal, Select, Typography } from '@coze-arch/coze-design';

interface LeaveSpaceModalProps {
  visible: boolean;
  confirming?: boolean;
  requireTransferMember?: boolean;
  transferMemberLoading?: boolean;
  transferMemberOptions?: Array<{ label: string; value: string }>;
  transferMemberId?: string;
  onTransferMemberChange?: (value: string) => void;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const LeaveSpaceModal = ({
  visible,
  confirming = false,
  requireTransferMember = false,
  transferMemberLoading = false,
  transferMemberOptions = [],
  transferMemberId,
  onTransferMemberChange,
  onConfirm,
  onClose,
}: LeaveSpaceModalProps) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    onOk={onConfirm}
    maskClosable={!confirming}
    okType="danger"
    title={I18n.t('leave_team_btn', {}, '离开工作空间')}
    okText={I18n.t('workspace_exit_button', {}, '离开空间')}
    cancelText={I18n.t('cancel')}
    okButtonProps={{
      loading: confirming,
      disabled:
        confirming ||
        (requireTransferMember && (!transferMemberId || transferMemberLoading)),
    }}
    cancelButtonProps={{ disabled: confirming }}
  >
    <Typography.Text className="coz-fg-secondary block">
      {I18n.t(
        'bwc_drafts_not_retained_after_leaving_team',
        {},
        '退出工作空间后，未提交的草稿版本将无法保留',
      )}
    </Typography.Text>
    {requireTransferMember ? (
      <div className="mt-[14px]">
        <Typography.Text className="coz-fg-secondary block">
          {I18n.t(
            'space_config_leave_select_transfer_member_desc',
            {},
            '请在退出前选择要将数据传输到的工作空间成员。',
          )}
        </Typography.Text>
        <Typography.Text className="coz-fg-primary text-[16px] font-[600] leading-[24px] block mt-[18px] mb-[8px]">
          {I18n.t(
            'space_config_leave_transfer_member_title',
            {},
            '将数据传输到',
          )}
        </Typography.Text>
        <Select
          className="w-full"
          value={transferMemberId || undefined}
          optionList={transferMemberOptions}
          disabled={transferMemberLoading || confirming}
          placeholder={
            transferMemberLoading
              ? I18n.t('loading')
              : I18n.t(
                  'space_config_leave_transfer_member_placeholder',
                  {},
                  '请选择成员',
                )
          }
          onChange={value => onTransferMemberChange?.(String(value || ''))}
        />
      </div>
    ) : null}
  </Modal>
);
