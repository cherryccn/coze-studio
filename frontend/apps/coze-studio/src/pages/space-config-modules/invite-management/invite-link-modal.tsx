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
import { Button, Modal, Switch, Typography } from '@coze-arch/coze-design';

interface InviteLinkModalProps {
  visible: boolean;
  inviteLinkEnabled: boolean;
  inviteLinkURL: string;
  inviteLinkText: string;
  onInviteLinkEnabledChange: (value: boolean) => void;
  onClose: () => void;
  onCopyInviteLink: () => void;
}

export const InviteLinkModal = ({
  visible,
  inviteLinkEnabled,
  inviteLinkURL,
  inviteLinkText,
  onInviteLinkEnabledChange,
  onClose,
  onCopyInviteLink,
}: InviteLinkModalProps) => (
  <Modal
    visible={visible}
    onCancel={onClose}
    onOk={onClose}
    maskClosable={false}
    title={I18n.t(
      'space_config_invite_link_modal_title',
      {},
      '通过分享链接加入工作空间',
    )}
    okText={I18n.t('space_config_invite_link_modal_done', {}, '完成')}
    cancelText={I18n.t('cancel')}
  >
    <div className="coz-bg-max rounded-[12px] border border-solid coz-stroke-primary">
      <div className="flex items-start justify-between gap-[24px] px-[16px] py-[16px]">
        <div className="flex-1 min-w-0">
          <Typography.Text className="coz-fg-primary text-[14px] font-[600]">
            {I18n.t('space_config_invite_link_modal_label', {}, '分享链接')}
          </Typography.Text>
          <Typography.Text className="coz-fg-secondary text-[12px] block mt-[4px]">
            {I18n.t(
              'space_config_invite_link_modal_desc',
              {},
              '开启后，其他人可通过你分享的链接加入你的空间，关闭后链接失效。',
            )}
          </Typography.Text>
        </div>
        <div className="shrink-0 pt-[2px]">
          <Switch
            size="small"
            checked={inviteLinkEnabled}
            onChange={onInviteLinkEnabledChange}
          />
        </div>
      </div>
      <div className="px-[16px] pb-[16px]">
        <div className="rounded-[10px] border border-solid coz-stroke-primary p-[12px]">
          <div className="flex flex-wrap items-start justify-between gap-[12px]">
            <div className="flex-1 min-w-0">
              <Typography.Text className="coz-fg-primary text-[13px] block leading-[20px]">
                {inviteLinkText}
              </Typography.Text>
              <Typography.Text className="coz-fg-secondary text-[13px] block mt-[8px] break-all">
                {inviteLinkEnabled
                  ? inviteLinkURL
                  : I18n.t(
                      'space_config_invite_link_disabled_text',
                      {},
                      '邀请链接已关闭，开启后恢复可用',
                    )}
              </Typography.Text>
            </div>
            <Button
              type="primary"
              size="small"
              disabled={!inviteLinkEnabled}
              onClick={onCopyInviteLink}
            >
              {I18n.t('copy_link', {}, '复制链接')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Modal>
);
