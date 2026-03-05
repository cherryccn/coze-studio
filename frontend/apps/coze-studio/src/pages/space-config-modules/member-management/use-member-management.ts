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

import { useCallback, useEffect, useState } from 'react';

import { I18n } from '@coze-arch/i18n';
import { Toast } from '@coze-arch/coze-design';
import { SpaceApiV2 } from '@coze-arch/bot-space-api';
import { SpaceRoleType } from '@coze-arch/bot-api/playground_api';

import {
  MEMBER_ROLE,
  type MemberFilterKey,
  type MemberRecordItem,
  type MemberRoleType,
} from './types';

const mapFilterToSpaceRoleType = (filter: MemberFilterKey) => {
  switch (filter) {
    case 'owner':
      return SpaceRoleType.Owner;
    case 'admin':
      return SpaceRoleType.Admin;
    case 'member':
      return SpaceRoleType.Member;
    default:
      return undefined;
  }
};

const canRemoveByRole = (
  operatorRole: MemberRoleType,
  targetRole: MemberRoleType,
) => {
  if (targetRole === MEMBER_ROLE.OWNER) {
    return false;
  }
  if (operatorRole === MEMBER_ROLE.OWNER) {
    return true;
  }
  if (operatorRole === MEMBER_ROLE.ADMIN) {
    return targetRole === MEMBER_ROLE.MEMBER;
  }
  return false;
};

const useMemberActions = ({
  memberRecords,
  fetchMembers,
  setUpdatingMemberId,
  setRemovingMemberId,
}: {
  memberRecords: MemberRecordItem[];
  fetchMembers: () => Promise<void>;
  setUpdatingMemberId: (value: string | undefined) => void;
  setRemovingMemberId: (value: string | undefined) => void;
}) => {
  const handleRoleChange = useCallback(
    async (memberId: string, roleType: MemberRoleType) => {
      const previousRoleType = memberRecords.find(
        item => item.id === memberId,
      )?.roleType;

      if (!previousRoleType || previousRoleType === roleType) {
        return;
      }

      setUpdatingMemberId(memberId);
      try {
        const response = await SpaceApiV2.UpdateSpaceMemberV2({
          user_id: memberId,
          space_role_type: roleType,
        });
        if (response?.code && response.code !== 0) {
          throw new Error(response.msg || 'update role failed');
        }
        Toast.success(
          I18n.t('space_config_member_role_update_success', {}, '角色已更新'),
        );
        await fetchMembers();
      } catch {
        Toast.error(
          I18n.t(
            'space_config_member_role_update_failed',
            {},
            '角色更新失败，请稍后重试',
          ),
        );
      } finally {
        setUpdatingMemberId(undefined);
      }
    },
    [fetchMembers, memberRecords, setUpdatingMemberId],
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      const targetMember = memberRecords.find(item => item.id === memberId);
      if (!targetMember) {
        return;
      }

      if (!targetMember.canRemove) {
        Toast.warning(
          I18n.t(
            'space_config_member_remove_not_allowed',
            {},
            '该成员不可移除',
          ),
        );
        return;
      }

      setRemovingMemberId(memberId);
      try {
        const response = await SpaceApiV2.RemoveSpaceMemberV2({
          remove_user_id: memberId,
        });
        if (response?.code && response.code !== 0) {
          throw new Error(response.msg || 'remove member failed');
        }
        Toast.success(
          I18n.t('space_config_member_remove_success', {}, '成员已移除'),
        );
        await fetchMembers();
      } catch {
        Toast.error(
          I18n.t(
            'space_config_member_remove_failed',
            {},
            '成员移除失败，请稍后重试',
          ),
        );
      } finally {
        setRemovingMemberId(undefined);
      }
    },
    [fetchMembers, memberRecords, setRemovingMemberId],
  );

  return {
    handleRoleChange,
    handleRemoveMember,
  };
};

export const useMemberManagement = (refreshVersion = 0) => {
  const [memberRoleFilter, setMemberRoleFilter] =
    useState<MemberFilterKey>('all');
  const [memberSearchKeyword, setMemberSearchKeyword] = useState('');
  const [memberRecords, setMemberRecords] = useState<MemberRecordItem[]>([]);
  const [updatingMemberId, setUpdatingMemberId] = useState<string>();
  const [removingMemberId, setRemovingMemberId] = useState<string>();
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const searchWord = memberSearchKeyword.trim();
      const roleFilter = mapFilterToSpaceRoleType(memberRoleFilter);
      const response = await SpaceApiV2.SpaceMemberDetailV2({
        page: 1,
        size: 200,
        search_word: searchWord || undefined,
        space_role_type: roleFilter,
      });

      if (response?.code && response.code !== 0) {
        throw new Error(response.msg || 'load member failed');
      }

      const currentOperatorRole = Number(
        response.data?.space_role_type ?? MEMBER_ROLE.MEMBER,
      ) as MemberRoleType;

      const records = (response.data?.member_info_list || []).map(item => {
        const roleType = Number(
          item.space_role_type ?? MEMBER_ROLE.MEMBER,
        ) as MemberRoleType;
        return {
          id: item.user_id || '',
          nickname: item.name || '--',
          username: item.user_name || '--',
          roleType,
          joinTime: item.join_date || '--',
          iconUrl: item.icon_url,
          canRemove: canRemoveByRole(currentOperatorRole, roleType),
        };
      });

      setMemberRecords(records.filter(item => item.id));
    } catch {
      Toast.error(
        I18n.t(
          'space_config_member_list_load_failed',
          {},
          '成员列表加载失败，请稍后重试',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [memberRoleFilter, memberSearchKeyword, refreshVersion]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const { handleRoleChange, handleRemoveMember } = useMemberActions({
    memberRecords,
    fetchMembers,
    setUpdatingMemberId,
    setRemovingMemberId,
  });

  return {
    loading,
    memberRoleFilter,
    setMemberRoleFilter,
    memberSearchKeyword,
    setMemberSearchKeyword,
    memberRecords,
    updatingMemberId,
    removingMemberId,
    handleRoleChange,
    handleRemoveMember,
  };
};
