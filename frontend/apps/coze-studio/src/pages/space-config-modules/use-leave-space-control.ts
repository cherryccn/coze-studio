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

import type { NavigateFunction } from 'react-router-dom';
import { useCallback, useState } from 'react';

import { useSpaceStore } from '@coze-foundation/space-store-adapter';
import { I18n } from '@coze-arch/i18n';
import { Toast } from '@coze-arch/coze-design';
import { SpaceRoleType } from '@coze-arch/bot-api/playground_api';
import { PlaygroundApi } from '@coze-arch/bot-api';

const TRANSFER_MEMBER_QUERY_PAGE = 1;
const TRANSFER_MEMBER_QUERY_SIZE = 200;

const isSuccessCode = (code?: string | number) =>
  code === undefined || code === null || code === '' || Number(code) === 0;

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const useLeaveTransferMemberControl = ({
  currentSpaceId,
  requireTransferMemberBeforeLeave,
}: {
  currentSpaceId?: string;
  requireTransferMemberBeforeLeave: boolean;
}) => {
  const [leaveTransferMemberLoading, setLeaveTransferMemberLoading] =
    useState(false);
  const [leaveTransferMemberId, setLeaveTransferMemberId] = useState('');
  const [leaveTransferMemberOptions, setLeaveTransferMemberOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const resetTransferMemberState = useCallback(() => {
    setLeaveTransferMemberId('');
    setLeaveTransferMemberOptions([]);
  }, []);

  const loadLeaveTransferMemberOptions = useCallback(async () => {
    if (!currentSpaceId || !requireTransferMemberBeforeLeave) {
      return;
    }

    setLeaveTransferMemberLoading(true);
    try {
      const response = await PlaygroundApi.SpaceMemberDetailV2({
        space_id: currentSpaceId,
        page: TRANSFER_MEMBER_QUERY_PAGE,
        size: TRANSFER_MEMBER_QUERY_SIZE,
      });
      if (!isSuccessCode(response?.code)) {
        throw new Error(response?.msg || 'load transfer members failed');
      }

      const options = (response?.data?.member_info_list || [])
        .filter(
          member =>
            member.user_id &&
            member.space_role_type !== SpaceRoleType.Owner &&
            member.space_role_type !== undefined,
        )
        .map(member => ({
          value: member.user_id,
          label: member.name || member.user_name || member.user_id,
        }));

      setLeaveTransferMemberOptions(options);
      setLeaveTransferMemberId(options[0]?.value || '');

      if (!options.length) {
        Toast.warning(
          I18n.t(
            'space_config_leave_transfer_member_empty',
            {},
            '暂无可接收数据的成员，请先添加成员并授予权限',
          ),
        );
      }
    } catch (error) {
      const message = toErrorMessage(error, 'load transfer members failed');
      Toast.error(
        I18n.t(
          'space_config_leave_transfer_member_load_failed',
          { message },
          '成员列表加载失败，请稍后重试',
        ),
      );
    } finally {
      setLeaveTransferMemberLoading(false);
    }
  }, [currentSpaceId, requireTransferMemberBeforeLeave]);

  return {
    leaveTransferMemberLoading,
    leaveTransferMemberId,
    leaveTransferMemberOptions,
    setLeaveTransferMemberId,
    resetTransferMemberState,
    loadLeaveTransferMemberOptions,
  };
};

export const useLeaveSpaceControl = ({
  currentSpace,
  isPersonalSpace,
  requireTransferMemberBeforeLeave,
  navigate,
}: {
  currentSpace?: DataItem.BotSpace;
  isPersonalSpace: boolean;
  requireTransferMemberBeforeLeave: boolean;
  navigate: NavigateFunction;
}) => {
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const {
    leaveTransferMemberLoading,
    leaveTransferMemberId,
    leaveTransferMemberOptions,
    setLeaveTransferMemberId,
    resetTransferMemberState,
    loadLeaveTransferMemberOptions,
  } = useLeaveTransferMemberControl({
    currentSpaceId: currentSpace?.id,
    requireTransferMemberBeforeLeave,
  });

  const handleOpenLeaveModal = useCallback(() => {
    setLeaveModalVisible(true);
    resetTransferMemberState();

    if (requireTransferMemberBeforeLeave) {
      void loadLeaveTransferMemberOptions();
    }
  }, [
    loadLeaveTransferMemberOptions,
    requireTransferMemberBeforeLeave,
    resetTransferMemberState,
  ]);

  const handleCloseLeaveModal = useCallback(() => {
    if (leaveSubmitting) {
      return;
    }

    setLeaveModalVisible(false);
    resetTransferMemberState();
  }, [leaveSubmitting, resetTransferMemberState]);

  const handleLeaveSpaceConfirm = useCallback(async () => {
    if (!currentSpace?.id) {
      return;
    }

    if (isPersonalSpace) {
      Toast.warning(
        I18n.t(
          'space_config_leave_personal_space_not_supported',
          {},
          '个人空间不支持离开',
        ),
      );
      return;
    }

    if (requireTransferMemberBeforeLeave && !leaveTransferMemberId) {
      Toast.warning(
        I18n.t(
          'space_config_leave_transfer_member_required',
          {},
          '请先选择要接收数据的成员',
        ),
      );
      return;
    }

    setLeaveSubmitting(true);
    try {
      const response = await PlaygroundApi.ExitSpaceV2({
        space_id: currentSpace.id,
        transfer_user_id: requireTransferMemberBeforeLeave
          ? leaveTransferMemberId
          : undefined,
      });
      if (!isSuccessCode(response?.code)) {
        throw new Error(response?.msg || 'exit space failed');
      }

      Toast.success(
        I18n.t('space_config_leave_success', {}, '已成功离开当前空间'),
      );
      setLeaveModalVisible(false);
      resetTransferMemberState();

      await useSpaceStore.getState().fetchSpaces(true);
      const {
        getPersonalSpaceID,
        spaceList: latestSpaceList,
        setSpace,
      } = useSpaceStore.getState();
      const fallbackSpaceID = getPersonalSpaceID() ?? latestSpaceList[0]?.id;

      if (fallbackSpaceID) {
        setSpace(fallbackSpaceID);
        navigate(`/space/${fallbackSpaceID}/home`, { replace: true });
        return;
      }

      navigate('/space', { replace: true });
    } catch (error) {
      Toast.error(
        toErrorMessage(
          error,
          I18n.t('space_config_leave_failed', {}, '离开空间失败，请稍后重试'),
        ),
      );
    } finally {
      setLeaveSubmitting(false);
    }
  }, [
    currentSpace?.id,
    isPersonalSpace,
    leaveTransferMemberId,
    navigate,
    resetTransferMemberState,
    requireTransferMemberBeforeLeave,
  ]);

  return {
    leaveModalVisible,
    leaveSubmitting,
    leaveTransferMemberLoading,
    leaveTransferMemberId,
    leaveTransferMemberOptions,
    setLeaveTransferMemberId,
    handleOpenLeaveModal,
    handleCloseLeaveModal,
    handleLeaveSpaceConfirm,
  };
};
