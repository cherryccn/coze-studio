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
import { Button, Divider, Switch, Typography } from '@coze-arch/coze-design';

interface SettingsTabContentProps {
  disableExternalJoin: boolean;
  onDisableExternalJoinChange: (value: boolean) => void;
  folderPermissionEnabled: boolean;
  onFolderPermissionEnabledChange: (value: boolean) => void;
  showLeaveSpaceAction?: boolean;
  showOwnerTransferHint?: boolean;
  settingsLoading?: boolean;
  settingsSaving?: boolean;
  leaveSubmitting?: boolean;
  onOpenLeaveModal: () => void;
}

export const SettingsTabContent = ({
  disableExternalJoin,
  onDisableExternalJoinChange,
  folderPermissionEnabled,
  onFolderPermissionEnabledChange,
  showLeaveSpaceAction = true,
  showOwnerTransferHint = false,
  settingsLoading = false,
  settingsSaving = false,
  leaveSubmitting = false,
  onOpenLeaveModal,
}: SettingsTabContentProps) => (
  <div className="flex flex-col gap-[16px] pt-[8px]">
    <div className="coz-bg-max rounded-[12px] border border-solid coz-stroke-primary">
      <div className="flex items-start justify-between gap-[24px] px-[16px] py-[16px]">
        <div className="flex-1 min-w-0">
          <Typography.Text className="coz-fg-primary text-[14px] font-[600]">
            {I18n.t(
              'workspace_admins_settings_permission_title',
              {},
              '禁止外部用户加入当前空间',
            )}
          </Typography.Text>
          <Typography.Text className="coz-fg-secondary text-[12px] block mt-[4px]">
            {I18n.t(
              'workspace_admins_settings_permission_desc',
              {},
              '开启后，仅子用户可加入当前空间',
            )}
          </Typography.Text>
        </div>
        <div className="shrink-0 pt-[2px]">
          <Switch
            size="small"
            checked={disableExternalJoin}
            disabled={settingsLoading || settingsSaving}
            onChange={onDisableExternalJoinChange}
          />
        </div>
      </div>
      <Divider className="mx-[16px] coz-stroke-primary" />
      <div className="flex items-start justify-between gap-[24px] px-[16px] py-[16px]">
        <div className="flex-1 min-w-0">
          <Typography.Text className="coz-fg-primary text-[14px] font-[600]">
            {I18n.t(
              'workspace_folder_permission_settings_title',
              {},
              '新建、编辑文件夹权限',
            )}
          </Typography.Text>
          <Typography.Text className="coz-fg-secondary text-[12px] block mt-[4px]">
            {I18n.t(
              'workspace_folder_permission_settings_desc',
              {},
              '默认开启，开启后仅工作空间所有者/管理员可新建、编辑文件夹；关闭后，空间内所有成员均可进行操作。',
            )}
          </Typography.Text>
        </div>
        <div className="shrink-0 pt-[2px]">
          <Switch
            size="small"
            checked={folderPermissionEnabled}
            disabled={settingsLoading || settingsSaving}
            onChange={onFolderPermissionEnabledChange}
          />
        </div>
      </div>
    </div>

    {showLeaveSpaceAction ? (
      <div className="coz-bg-max rounded-[12px] border border-solid coz-stroke-primary">
        <div className="flex items-start justify-between gap-[24px] px-[16px] py-[16px]">
          <div className="flex-1 min-w-0">
            <Typography.Text className="coz-fg-hglt-red text-[14px] font-[600]">
              {I18n.t('workspace_exit', {}, '离开空间')}
            </Typography.Text>
            <Typography.Text className="coz-fg-secondary text-[12px] block mt-[4px]">
              {I18n.t(
                'workspace_exit_desc',
                {},
                '退出空间后，未提交的草稿版本将无法保留。',
              )}
            </Typography.Text>
          </div>
          <div className="shrink-0 pt-[2px]">
            <Button
              type="danger"
              size="small"
              loading={leaveSubmitting}
              disabled={leaveSubmitting}
              onClick={onOpenLeaveModal}
            >
              {I18n.t('workspace_exit_button', {}, '离开空间')}
            </Button>
          </div>
        </div>
      </div>
    ) : showOwnerTransferHint ? (
      <div className="coz-bg-max rounded-[12px] border border-solid coz-stroke-primary">
        <div className="flex items-start justify-between gap-[24px] px-[16px] py-[16px]">
          <div className="flex-1 min-w-0">
            <Typography.Text className="coz-fg-primary text-[14px] font-[600]">
              {I18n.t('workspace_exit', {}, '离开空间')}
            </Typography.Text>
            <Typography.Text className="coz-fg-secondary text-[12px] block mt-[4px]">
              {I18n.t(
                'space_config_leave_owner_transfer_hint',
                {},
                '当前你是空间所有者，离开前需将数据传输给一位工作空间成员。',
              )}
            </Typography.Text>
          </div>
          <div className="shrink-0 pt-[2px]">
            <Button
              type="danger"
              size="small"
              loading={leaveSubmitting}
              disabled={leaveSubmitting}
              onClick={onOpenLeaveModal}
            >
              {I18n.t('workspace_exit_button', {}, '离开空间')}
            </Button>
          </div>
        </div>
      </div>
    ) : null}
  </div>
);
