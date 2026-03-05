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

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  InviteFilterKey,
  InviteRecordItem,
} from './invite-management/types';
import { buildTabDefs, type TabDefinition } from './build-tab-defs';

interface UseSpaceConfigTabsOptions {
  spaceId?: string;
  isOwnerOrAdmin: boolean;
  isPersonalSpace: boolean;
  memberRefreshVersion: number;
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

export const useSpaceConfigTabs = ({
  spaceId,
  isOwnerOrAdmin,
  isPersonalSpace,
  memberRefreshVersion,
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
}: UseSpaceConfigTabsOptions) => {
  const [activeTab, setActiveTab] = useState('publish');

  const tabDefs = useMemo<TabDefinition[]>(
    () =>
      buildTabDefs({
        spaceId,
        isOwnerOrAdmin,
        isPersonalSpace,
        memberRefreshVersion,
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
      }),
    [
      disableExternalJoin,
      folderPermissionEnabled,
      inviteRecords,
      inviteSearchKeyword,
      inviteStatusFilter,
      isOwnerOrAdmin,
      isPersonalSpace,
      leaveSubmitting,
      memberRefreshVersion,
      onAddMember,
      onDisableExternalJoinChange,
      onFolderPermissionEnabledChange,
      onInviteSearchKeywordChange,
      onInviteStatusFilterChange,
      onOpenInviteLinkModal,
      onOpenLeaveModal,
      onRevokeInvite,
      settingsLoading,
      settingsSaving,
      showLeaveSpaceAction,
      showOwnerTransferHint,
      spaceId,
    ],
  );

  const visibleTabs = useMemo(
    () => tabDefs.filter(tab => tab.visible),
    [tabDefs],
  );

  useEffect(() => {
    if (!visibleTabs.find(tab => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? '');
    }
  }, [activeTab, visibleTabs]);

  return {
    activeTab,
    setActiveTab,
    visibleTabs,
  };
};
