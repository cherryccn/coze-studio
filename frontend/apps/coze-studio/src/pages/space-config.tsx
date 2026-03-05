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

import { useNavigate, useParams } from 'react-router-dom';
import { type FC, useState } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Tabs, Typography } from '@coze-arch/coze-design';

import { useSpaceConfigTabs } from './space-config-modules/use-space-config-tabs';
import { useSpaceConfigPageState } from './space-config-modules/use-space-config-page-state';
import { SpaceSummaryCard } from './space-config-modules/space-summary-card';
import { LeaveSpaceModal } from './space-config-modules/leave-space-modal';
import { useInviteManagement } from './space-config-modules/invite-management/use-invite-management';
import { InviteLinkModal } from './space-config-modules/invite-management/invite-link-modal';
import { AddMemberModal } from './space-config-modules/invite-management/add-member-modal';

const { TabPane } = Tabs;

const SpaceConfigPage: FC = () => {
  const navigate = useNavigate();
  const { space_id } = useParams();

  const [iconError, setIconError] = useState(false);
  const [memberRefreshVersion, setMemberRefreshVersion] = useState(0);

  const pageState = useSpaceConfigPageState({
    spaceId: space_id,
    navigate,
  });

  const inviteManagement = useInviteManagement(pageState.currentSpace?.name, {
    onMembersChanged: () => {
      setMemberRefreshVersion(previous => previous + 1);
    },
  });

  const { activeTab, setActiveTab, visibleTabs } = useSpaceConfigTabs({
    spaceId: space_id ?? pageState.currentSpace?.id,
    isOwnerOrAdmin: pageState.isOwnerOrAdmin,
    isPersonalSpace: pageState.isPersonalSpace,
    memberRefreshVersion,
    disableExternalJoin: pageState.disableExternalJoin,
    onDisableExternalJoinChange: pageState.handleDisableExternalJoinChange,
    folderPermissionEnabled: pageState.folderPermissionEnabled,
    onFolderPermissionEnabledChange:
      pageState.handleFolderPermissionEnabledChange,
    showLeaveSpaceAction: pageState.canLeaveSpace,
    showOwnerTransferHint: pageState.shouldShowOwnerTransferHint,
    settingsLoading: pageState.settingsLoading,
    settingsSaving: pageState.settingsSaving,
    leaveSubmitting: pageState.leaveSubmitting,
    onOpenLeaveModal: pageState.handleOpenLeaveModal,
    inviteStatusFilter: inviteManagement.inviteStatusFilter,
    onInviteStatusFilterChange: inviteManagement.setInviteStatusFilter,
    inviteSearchKeyword: inviteManagement.inviteSearchKeyword,
    onInviteSearchKeywordChange: inviteManagement.setInviteSearchKeyword,
    inviteRecords: inviteManagement.inviteRecords,
    onRevokeInvite: inviteManagement.handleRevokeInvite,
    onOpenInviteLinkModal: inviteManagement.openInviteLinkModal,
    onAddMember: inviteManagement.handleAddMember,
  });

  return (
    <div className="w-full h-full px-[24px] py-[24px]">
      <div className="max-w-[1200px]">
        <Typography.Title heading={3} className="mb-[20px]">
          {I18n.t('enterprise_workspace_management_page_title', {}, '空间管理')}
        </Typography.Title>

        <SpaceSummaryCard
          iconUrl={pageState.currentSpace?.icon_url}
          isPersonalSpace={pageState.isPersonalSpace}
          iconError={iconError}
          onIconError={() => setIconError(true)}
          spaceDisplayName={pageState.spaceDisplayName}
          roleName={pageState.roleName}
        />

        {visibleTabs.length ? (
          <div className="coz-mg-card rounded-[12px] px-[16px] py-[12px] border border-solid coz-stroke-primary">
            <Tabs
              activeKey={activeTab}
              onChange={key => setActiveTab(String(key))}
            >
              {visibleTabs.map(tab => (
                <TabPane tab={tab.label} itemKey={tab.key} key={tab.key}>
                  {tab.content}
                </TabPane>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="coz-mg-card rounded-[12px] px-[16px] py-[24px] border border-solid coz-stroke-primary">
            <Typography.Text className="coz-fg-secondary">
              {I18n.t(
                'space_config_no_permission',
                {},
                '暂无权限查看空间配置内容',
              )}
            </Typography.Text>
          </div>
        )}
      </div>

      <InviteLinkModal
        visible={inviteManagement.inviteLinkModalVisible}
        inviteLinkEnabled={inviteManagement.inviteLinkEnabled}
        inviteLinkURL={inviteManagement.inviteLinkURL}
        inviteLinkText={inviteManagement.inviteLinkText}
        onInviteLinkEnabledChange={inviteManagement.setInviteLinkEnabled}
        onClose={inviteManagement.closeInviteLinkModal}
        onCopyInviteLink={inviteManagement.handleCopyInviteLink}
      />

      <AddMemberModal
        visible={inviteManagement.addMemberModalVisible}
        searchKeyword={inviteManagement.addMemberSearchKeyword}
        searching={inviteManagement.addMemberSearchLoading}
        confirming={inviteManagement.addMemberConfirmLoading}
        candidateUsers={inviteManagement.addMemberCandidateUsers}
        selectedUsers={inviteManagement.addMemberSelectedUsers}
        maxSelectableCount={inviteManagement.maxAddMemberCount}
        onSearchKeywordChange={inviteManagement.setAddMemberSearchKeyword}
        onToggleUser={inviteManagement.toggleAddMemberUser}
        onRemoveSelectedUser={inviteManagement.removeAddMemberSelectedUser}
        onCancel={inviteManagement.closeAddMemberModal}
        onConfirm={inviteManagement.confirmAddMember}
      />

      <LeaveSpaceModal
        visible={pageState.leaveModalVisible}
        confirming={pageState.leaveSubmitting}
        requireTransferMember={pageState.requireTransferMemberBeforeLeave}
        transferMemberLoading={pageState.leaveTransferMemberLoading}
        transferMemberOptions={pageState.leaveTransferMemberOptions}
        transferMemberId={pageState.leaveTransferMemberId}
        onTransferMemberChange={pageState.setLeaveTransferMemberId}
        onConfirm={pageState.handleLeaveSpaceConfirm}
        onClose={pageState.handleCloseLeaveModal}
      />
    </div>
  );
};

export default SpaceConfigPage;
