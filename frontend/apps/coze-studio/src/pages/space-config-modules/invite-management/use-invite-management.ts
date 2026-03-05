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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Toast } from '@coze-arch/coze-design';
import { SpaceApiV2 } from '@coze-arch/bot-space-api';
import {
  InviteFunc,
  type MemberInfo,
  SpaceRoleType,
} from '@coze-arch/bot-api/playground_api';

import type {
  AddMemberCandidateItem,
  InviteFilterKey,
  InviteRecordItem,
} from './types';
import {
  formatTimestamp,
  mapFilterToStatus,
  mapMemberInfoToCandidate,
  mapStatusToKey,
} from './invite-management-utils';
import { INVITE_LINK_URL } from './constants';

const MAX_ADD_MEMBER_COUNT = 95;

const useInviteListControl = (
  inviteStatusFilter: InviteFilterKey,
  inviteSearchKeyword: string,
) => {
  const [inviteRecords, setInviteRecords] = useState<InviteRecordItem[]>([]);

  const fetchInviteList = useCallback(async () => {
    try {
      const response = await SpaceApiV2.GetSpaceInviteManageList({
        space_invite_status: mapFilterToStatus(inviteStatusFilter),
        search_word: inviteSearchKeyword.trim() || undefined,
        page: 1,
        size: 100,
      });
      if (response?.code && response.code !== 0) {
        throw new Error(response.msg || 'load invite list failed');
      }
      const records = (response.data?.space_invite_manage_info_list || []).map(
        item => ({
          id: item.invite_user_id,
          nickname: item.invite_nick_name || '--',
          username: item.invite_user_name || '--',
          status: mapStatusToKey(item.space_invite_status),
          inviteTime: formatTimestamp(item.invite_date),
        }),
      );
      setInviteRecords(records.filter(item => item.id));
    } catch {
      Toast.error(
        I18n.t(
          'space_config_invites_load_failed',
          {},
          '邀请记录加载失败，请稍后重试',
        ),
      );
    }
  }, [inviteSearchKeyword, inviteStatusFilter]);

  useEffect(() => {
    void fetchInviteList();
  }, [fetchInviteList]);

  const handleRevokeInvite = useCallback(
    async (inviteUserId: string) => {
      try {
        const response = await SpaceApiV2.RevocateSpaceInvite({
          invite_user_id: inviteUserId,
        });
        if (response?.code && response.code !== 0) {
          throw new Error(response.msg || 'revoke invite failed');
        }
        Toast.success(
          I18n.t('space_config_invites_revoke_success', {}, '邀请已撤销'),
        );
        await fetchInviteList();
      } catch {
        Toast.error(
          I18n.t(
            'space_config_invites_revoke_failed',
            {},
            '邀请撤销失败，请稍后重试',
          ),
        );
      }
    },
    [fetchInviteList],
  );

  return {
    inviteRecords,
    handleRevokeInvite,
    fetchInviteList,
  };
};

const useInviteLinkControl = (spaceName?: string) => {
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [inviteLinkModalVisible, setInviteLinkModalVisible] = useState(false);
  const [inviteLinkKey, setInviteLinkKey] = useState('');
  const [inviteExpireAt, setInviteExpireAt] = useState('');

  const inviteLinkURL = useMemo(() => {
    if (!inviteLinkKey) {
      return INVITE_LINK_URL;
    }
    if (typeof window === 'undefined') {
      return `${INVITE_LINK_URL.split('/invite/')[0]}/invite/${inviteLinkKey}`;
    }
    return `${window.location.origin}/invite/${inviteLinkKey}`;
  }, [inviteLinkKey]);

  const inviteLinkText = useMemo(() => {
    const displaySpaceName = spaceName || 'qweq';
    const expiresAtText = inviteExpireAt || '--';
    return I18n.t(
      'space_config_invite_link_text',
      { spaceName: displaySpaceName, expiresAt: expiresAtText },
      `邀请你加入我的扣子空间"${displaySpaceName}"，链接将在 ${expiresAtText} 过期`,
    );
  }, [inviteExpireAt, spaceName]);

  const loadInviteLinkInfo = useCallback(async () => {
    try {
      const response = await SpaceApiV2.InviteMemberLinkV2({
        team_invite_link_status: inviteLinkEnabled,
        func: InviteFunc.GetInfo,
      });
      if (response?.code && response.code !== 0) {
        throw new Error(response.msg || 'load invite link failed');
      }
      setInviteExpireAt(formatTimestamp(response.data?.expire_time));
      setInviteLinkKey(response.data?.key || '');
    } catch {
      Toast.error(
        I18n.t(
          'space_config_invite_link_load_failed',
          {},
          '邀请链接信息加载失败，请稍后重试',
        ),
      );
    }
  }, [inviteLinkEnabled]);

  const handleInviteLinkEnabledChange = useCallback(async (value: boolean) => {
    try {
      const response = await SpaceApiV2.InviteMemberLinkV2({
        team_invite_link_status: value,
      });
      if (response?.code && response.code !== 0) {
        throw new Error(response.msg || 'toggle invite link failed');
      }
      setInviteLinkEnabled(value);
      setInviteExpireAt(formatTimestamp(response.data?.expire_time));
      setInviteLinkKey(response.data?.key || '');
    } catch {
      Toast.error(
        I18n.t(
          'space_config_invite_link_toggle_failed',
          {},
          '邀请链接状态更新失败，请稍后重试',
        ),
      );
    }
  }, []);

  const handleCopyInviteLink = useCallback(async () => {
    if (!inviteLinkEnabled) {
      Toast.warning(
        I18n.t(
          'space_config_invite_link_disabled_toast',
          {},
          '邀请链接已关闭，请先开启开关',
        ),
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteLinkURL);
      Toast.success(
        I18n.t('space_config_invite_link_copy_success', {}, '链接已复制'),
      );
    } catch {
      Toast.error(
        I18n.t(
          'space_config_invite_link_copy_failed',
          {},
          '复制失败，请稍后重试',
        ),
      );
    }
  }, [inviteLinkEnabled, inviteLinkURL]);

  return {
    inviteLinkEnabled,
    setInviteLinkEnabled: handleInviteLinkEnabledChange,
    inviteLinkModalVisible,
    inviteLinkURL,
    inviteLinkText,
    openInviteLinkModal: () => {
      setInviteLinkModalVisible(true);
      void loadInviteLinkInfo();
    },
    closeInviteLinkModal: () => setInviteLinkModalVisible(false),
    handleCopyInviteLink,
  };
};

interface UseAddMemberControlOptions {
  onMembersChanged?: () => void | Promise<void>;
}

const useConfirmAddMember = ({
  selectedUsers,
  refreshInvites,
  options,
  closeAddMemberModal,
  setAddMemberConfirmLoading,
}: {
  selectedUsers: AddMemberCandidateItem[];
  refreshInvites: () => Promise<void>;
  options?: UseAddMemberControlOptions;
  closeAddMemberModal: () => void;
  setAddMemberConfirmLoading: (value: boolean) => void;
}) =>
  useCallback(async () => {
    if (!selectedUsers.length) {
      return;
    }

    setAddMemberConfirmLoading(true);
    try {
      const memberInfoList: MemberInfo[] = selectedUsers.map(user => ({
        user_id: user.id,
        name: user.nickname || '--',
        icon_url: user.iconUrl || '',
        space_role_type: SpaceRoleType.Member,
        user_name: user.username === '--' ? '' : user.username,
      }));
      const response = await SpaceApiV2.AddBotSpaceMemberV2({
        member_info_list: memberInfoList,
      });
      if (response?.code && response.code !== 0) {
        throw new Error(response.msg || 'add member failed');
      }

      Toast.success(
        I18n.t(
          'enterprise_member_list_add_new_member_success_toast',
          {},
          '邀请成功（内部成员直接加入，外部访客需对方同意）',
        ),
      );
      closeAddMemberModal();
      await refreshInvites();
      await Promise.resolve(options?.onMembersChanged?.());
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : I18n.t(
              'space_config_add_member_failed',
              {},
              '添加成员失败，请稍后重试',
            );
      Toast.error(errorMessage);
    } finally {
      setAddMemberConfirmLoading(false);
    }
  }, [
    closeAddMemberModal,
    options,
    refreshInvites,
    selectedUsers,
    setAddMemberConfirmLoading,
  ]);

const useAddMemberControl = (
  refreshInvites: () => Promise<void>,
  options?: UseAddMemberControlOptions,
) => {
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [addMemberSearchKeyword, setAddMemberSearchKeyword] = useState('');
  const [addMemberSearchLoading, setAddMemberSearchLoading] = useState(false);
  const [addMemberConfirmLoading, setAddMemberConfirmLoading] = useState(false);
  const [candidateUsers, setCandidateUsers] = useState<
    AddMemberCandidateItem[]
  >([]);
  const [selectedUsers, setSelectedUsers] = useState<AddMemberCandidateItem[]>(
    [],
  );

  const searchRequestIdRef = useRef(0);

  const clearAddMemberState = useCallback(() => {
    setAddMemberSearchKeyword('');
    setCandidateUsers([]);
    setSelectedUsers([]);
    setAddMemberSearchLoading(false);
    searchRequestIdRef.current += 1;
  }, []);

  const handleOpenAddMemberModal = useCallback(() => {
    clearAddMemberState();
    setAddMemberModalVisible(true);
  }, [clearAddMemberState]);

  const handleCloseAddMemberModal = useCallback(() => {
    setAddMemberModalVisible(false);
    clearAddMemberState();
  }, [clearAddMemberState]);

  const searchCandidateUsers = useCallback(async (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      setCandidateUsers([]);
      setAddMemberSearchLoading(false);
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setAddMemberSearchLoading(true);

    try {
      const response = await SpaceApiV2.SearchMemberV2({
        search_list: [trimmedKeyword],
        page: 1,
        size: 50,
      });
      if (requestId !== searchRequestIdRef.current) {
        return;
      }
      if (response?.code && response.code !== 0) {
        throw new Error(response.msg || 'search member failed');
      }
      const records = (response.member_info_list || [])
        .map(mapMemberInfoToCandidate)
        .filter(item => item.id);
      setCandidateUsers(records);
    } catch {
      if (requestId !== searchRequestIdRef.current) {
        return;
      }
      Toast.error(
        I18n.t(
          'space_config_member_search_failed',
          {},
          '成员搜索失败，请稍后重试',
        ),
      );
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setAddMemberSearchLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!addMemberModalVisible) {
      return;
    }
    const timer = window.setTimeout(() => {
      void searchCandidateUsers(addMemberSearchKeyword);
    }, 280);
    return () => {
      window.clearTimeout(timer);
    };
  }, [addMemberModalVisible, addMemberSearchKeyword, searchCandidateUsers]);

  const handleToggleUser = useCallback((user: AddMemberCandidateItem) => {
    if (user.isJoined || user.isInviting) {
      return;
    }

    setSelectedUsers(previous => {
      const existingIndex = previous.findIndex(item => item.id === user.id);
      if (existingIndex >= 0) {
        return previous.filter(item => item.id !== user.id);
      }
      if (previous.length >= MAX_ADD_MEMBER_COUNT) {
        Toast.warning(
          I18n.t(
            'space_config_add_member_select_max_limit',
            { max: MAX_ADD_MEMBER_COUNT },
            `最多可选择 ${MAX_ADD_MEMBER_COUNT} 名成员`,
          ),
        );
        return previous;
      }
      return [...previous, user];
    });
  }, []);

  const handleRemoveSelectedUser = useCallback((userId: string) => {
    setSelectedUsers(previous => previous.filter(item => item.id !== userId));
  }, []);

  const handleConfirmAddMember = useConfirmAddMember({
    selectedUsers,
    refreshInvites,
    options,
    closeAddMemberModal: handleCloseAddMemberModal,
    setAddMemberConfirmLoading,
  });

  return {
    addMemberModalVisible,
    addMemberSearchKeyword,
    setAddMemberSearchKeyword,
    addMemberSearchLoading,
    addMemberConfirmLoading,
    addMemberCandidateUsers: candidateUsers,
    addMemberSelectedUsers: selectedUsers,
    maxAddMemberCount: MAX_ADD_MEMBER_COUNT,
    handleOpenAddMemberModal,
    handleCloseAddMemberModal,
    handleToggleUser,
    handleRemoveSelectedUser,
    handleConfirmAddMember,
  };
};

interface UseInviteManagementOptions {
  onMembersChanged?: () => void | Promise<void>;
}

export const useInviteManagement = (
  spaceName?: string,
  options?: UseInviteManagementOptions,
) => {
  const [inviteStatusFilter, setInviteStatusFilter] =
    useState<InviteFilterKey>('all');
  const [inviteSearchKeyword, setInviteSearchKeyword] = useState('');

  const inviteListControl = useInviteListControl(
    inviteStatusFilter,
    inviteSearchKeyword,
  );
  const inviteLinkControl = useInviteLinkControl(spaceName);
  const addMemberControl = useAddMemberControl(
    inviteListControl.fetchInviteList,
    {
      onMembersChanged: options?.onMembersChanged,
    },
  );

  return {
    inviteStatusFilter,
    setInviteStatusFilter,
    inviteSearchKeyword,
    setInviteSearchKeyword,
    inviteRecords: inviteListControl.inviteRecords,
    handleRevokeInvite: inviteListControl.handleRevokeInvite,
    inviteLinkURL: inviteLinkControl.inviteLinkURL,
    inviteLinkText: inviteLinkControl.inviteLinkText,
    inviteLinkEnabled: inviteLinkControl.inviteLinkEnabled,
    setInviteLinkEnabled: inviteLinkControl.setInviteLinkEnabled,
    inviteLinkModalVisible: inviteLinkControl.inviteLinkModalVisible,
    openInviteLinkModal: inviteLinkControl.openInviteLinkModal,
    closeInviteLinkModal: inviteLinkControl.closeInviteLinkModal,
    handleCopyInviteLink: inviteLinkControl.handleCopyInviteLink,
    handleAddMember: addMemberControl.handleOpenAddMemberModal,
    addMemberModalVisible: addMemberControl.addMemberModalVisible,
    addMemberSearchKeyword: addMemberControl.addMemberSearchKeyword,
    setAddMemberSearchKeyword: addMemberControl.setAddMemberSearchKeyword,
    addMemberSearchLoading: addMemberControl.addMemberSearchLoading,
    addMemberConfirmLoading: addMemberControl.addMemberConfirmLoading,
    addMemberCandidateUsers: addMemberControl.addMemberCandidateUsers,
    addMemberSelectedUsers: addMemberControl.addMemberSelectedUsers,
    maxAddMemberCount: addMemberControl.maxAddMemberCount,
    closeAddMemberModal: addMemberControl.handleCloseAddMemberModal,
    toggleAddMemberUser: addMemberControl.handleToggleUser,
    removeAddMemberSelectedUser: addMemberControl.handleRemoveSelectedUser,
    confirmAddMember: addMemberControl.handleConfirmAddMember,
  };
};
