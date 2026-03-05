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

import { type Dispatch, type ReactNode, type SetStateAction } from 'react';

import { I18n } from '@coze-arch/i18n';

import { SettingsTabContent } from './settings-tab-content';
import { PublishTabContent } from './publish-management/publish-tab-content';
import { ModelsTabContent } from './model-management/models-tab-content';
import { MembersTabContent } from './member-management/members-tab-content';
import type {
  InviteFilterKey,
  InviteRecordItem,
} from './invite-management/types';
import { InvitesTabContent } from './invite-management/invites-tab-content';

export interface TabDefinition {
  key: string;
  visible: boolean;
  label: ReactNode;
  content: ReactNode;
}

interface BuildTabDefsOptions {
  spaceId?: string;
  isOwnerOrAdmin: boolean;
  isPersonalSpace: boolean;
  memberRefreshVersion?: number;
  disableExternalJoin: boolean;
  onDisableExternalJoinChange: (value: boolean) => void;
  folderPermissionEnabled: boolean;
  onFolderPermissionEnabledChange: (value: boolean) => void;
  showLeaveSpaceAction: boolean;
  showOwnerTransferHint: boolean;
  settingsLoading: boolean;
  settingsSaving: boolean;
  leaveSubmitting: boolean;
  onOpenLeaveModal: () => void;
  inviteStatusFilter: InviteFilterKey;
  onInviteStatusFilterChange: Dispatch<SetStateAction<InviteFilterKey>>;
  inviteSearchKeyword: string;
  onInviteSearchKeywordChange: Dispatch<SetStateAction<string>>;
  inviteRecords: InviteRecordItem[];
  onRevokeInvite: (inviteUserId: string) => void;
  onOpenInviteLinkModal: () => void;
  onAddMember: () => void;
}

export const buildTabDefs = ({
  spaceId,
  isOwnerOrAdmin,
  isPersonalSpace,
  memberRefreshVersion = 0,
  disableExternalJoin,
  onDisableExternalJoinChange,
  folderPermissionEnabled,
  onFolderPermissionEnabledChange,
  showLeaveSpaceAction,
  showOwnerTransferHint,
  settingsLoading,
  settingsSaving,
  leaveSubmitting,
  onOpenLeaveModal,
  inviteStatusFilter,
  onInviteStatusFilterChange,
  inviteSearchKeyword,
  onInviteSearchKeywordChange,
  inviteRecords,
  onRevokeInvite,
  onOpenInviteLinkModal,
  onAddMember,
}: BuildTabDefsOptions): TabDefinition[] => [
  {
    key: 'publish',
    visible: isOwnerOrAdmin,
    label: I18n.t('app_ide_publish_modal_publish_management', {}, '发布管理'),
    content: <PublishTabContent spaceId={spaceId} />,
  },
  {
    key: 'model',
    visible: isOwnerOrAdmin,
    label: I18n.t('model_list_button_management', {}, '模型管理'),
    content: <ModelsTabContent />,
  },
  {
    key: 'members',
    visible: !isPersonalSpace && isOwnerOrAdmin,
    label: I18n.t('workspace_admins_tab_members', {}, '成员管理'),
    content: (
      <MembersTabContent
        onOpenInviteLinkModal={onOpenInviteLinkModal}
        onAddMember={onAddMember}
        refreshVersion={memberRefreshVersion}
      />
    ),
  },
  {
    key: 'invites',
    visible: !isPersonalSpace && isOwnerOrAdmin,
    label: I18n.t('workspace_admins_tab_invites', {}, '邀请管理'),
    content: (
      <InvitesTabContent
        inviteStatusFilter={inviteStatusFilter}
        onInviteStatusFilterChange={onInviteStatusFilterChange}
        inviteSearchKeyword={inviteSearchKeyword}
        onInviteSearchKeywordChange={onInviteSearchKeywordChange}
        inviteRecords={inviteRecords}
        onRevokeInvite={onRevokeInvite}
        onOpenInviteLinkModal={onOpenInviteLinkModal}
        onAddMember={onAddMember}
      />
    ),
  },
  {
    key: 'settings',
    visible: isOwnerOrAdmin,
    label: I18n.t('workspace_admins_tab_settings', {}, '空间设置'),
    content: (
      <SettingsTabContent
        disableExternalJoin={disableExternalJoin}
        onDisableExternalJoinChange={onDisableExternalJoinChange}
        folderPermissionEnabled={folderPermissionEnabled}
        onFolderPermissionEnabledChange={onFolderPermissionEnabledChange}
        showLeaveSpaceAction={showLeaveSpaceAction}
        showOwnerTransferHint={showOwnerTransferHint}
        settingsLoading={settingsLoading}
        settingsSaving={settingsSaving}
        leaveSubmitting={leaveSubmitting}
        onOpenLeaveModal={onOpenLeaveModal}
      />
    ),
  },
];
