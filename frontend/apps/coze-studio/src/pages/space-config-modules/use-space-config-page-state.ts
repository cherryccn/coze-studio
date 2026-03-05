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
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSpaceStore } from '@coze-foundation/space-store-adapter';
import { I18n } from '@coze-arch/i18n';
import { Toast } from '@coze-arch/coze-design';
import type {
  SaveSpaceV2Request,
  SpaceType as PlaygroundSpaceType,
} from '@coze-arch/bot-api/playground_api';
import { PlaygroundApi } from '@coze-arch/bot-api';

import { useLeaveSpaceControl } from './use-leave-space-control';

const PERSONAL_SPACE_TYPE = 1;
const ROLE_OWNER = 1;
const ROLE_ADMIN = 2;
const ROLE_MEMBER = 3;

const DEFAULT_MEMBER_QUERY_PAGE = 1;
const DEFAULT_MEMBER_QUERY_SIZE = 1;

const isSuccessCode = (code?: string | number) =>
  code === undefined || code === null || code === '' || Number(code) === 0;

interface SpaceRoleLike {
  role_type?: number;
  space_role_type?: number;
}

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const resolveRoleType = (
  currentSpace?: DataItem.BotSpace,
  currentRole?: SpaceRoleLike,
) => {
  if (currentSpace?.space_type === PERSONAL_SPACE_TYPE) {
    return ROLE_OWNER;
  }

  const rawRole = currentRole?.space_role_type ?? currentRole?.role_type;
  if (!rawRole || rawRole === 0) {
    return ROLE_MEMBER;
  }

  return rawRole;
};

const resolveRoleName = (roleType: number) => {
  switch (roleType) {
    case ROLE_OWNER:
      return I18n.t('team_management_role_owner', {}, '所有者');
    case ROLE_ADMIN:
      return I18n.t('team_management_role_admin', {}, '管理员');
    default:
      return I18n.t('team_management_role_member', {}, '成员');
  }
};

const buildSavePayload = ({
  currentSpace,
  nextDisableExternalJoin,
  nextFolderPermissionEnabled,
}: {
  currentSpace?: DataItem.BotSpace;
  nextDisableExternalJoin: boolean;
  nextFolderPermissionEnabled: boolean;
}): SaveSpaceV2Request | null => {
  if (!currentSpace?.id) {
    return null;
  }

  const payload: SaveSpaceV2Request = {
    space_id: currentSpace.id,
    name: currentSpace.name || '',
    description: currentSpace.description || '',
    icon_uri: currentSpace.icon_url || '',
    space_type: (currentSpace.space_type ||
      PERSONAL_SPACE_TYPE) as unknown as PlaygroundSpaceType,
    space_config: {
      is_support_external_users_join_space: !nextDisableExternalJoin,
      forbid_member_upsert_folder: nextFolderPermissionEnabled,
    },
  };

  if (currentSpace.space_mode !== undefined) {
    payload.space_mode =
      currentSpace.space_mode as SaveSpaceV2Request['space_mode'];
  }

  return payload;
};

const useCurrentSpaceInfo = (spaceId?: string) => {
  const space = useSpaceStore(state => state.space);
  const spaceList = useSpaceStore(state => state.spaceList);

  const currentSpace = useMemo(() => {
    if (!spaceId) {
      return space;
    }

    return (
      spaceList.find(item => item.id === spaceId) ??
      (space?.id === spaceId ? space : undefined)
    );
  }, [space, spaceId, spaceList]);

  const roleType = useMemo(
    () =>
      resolveRoleType(
        currentSpace,
        currentSpace as DataItem.BotSpace & SpaceRoleLike,
      ),
    [currentSpace],
  );

  const isPersonalSpace = currentSpace?.space_type === PERSONAL_SPACE_TYPE;
  const isOwnerOrAdmin = roleType === ROLE_OWNER || roleType === ROLE_ADMIN;
  const canLeaveSpace = !isPersonalSpace && roleType !== ROLE_OWNER;
  const shouldShowOwnerTransferHint =
    !isPersonalSpace && roleType === ROLE_OWNER;

  const roleName = useMemo(() => resolveRoleName(roleType), [roleType]);

  const spaceDisplayName = useMemo(
    () =>
      isPersonalSpace
        ? I18n.t(
            'menu_title_personal_space',
            {},
            currentSpace?.name || '个人空间',
          )
        : currentSpace?.name || I18n.t('navigation_workspace', {}, '工作空间'),
    [currentSpace?.name, isPersonalSpace],
  );

  return {
    currentSpace,
    isPersonalSpace,
    isOwnerOrAdmin,
    canLeaveSpace,
    shouldShowOwnerTransferHint,
    roleName,
    spaceDisplayName,
  };
};

const useSpaceSettingsLoader = ({
  currentSpaceId,
  isOwnerOrAdmin,
  setDisableExternalJoin,
  setFolderPermissionEnabled,
  setSettingsLoading,
}: {
  currentSpaceId?: string;
  isOwnerOrAdmin: boolean;
  setDisableExternalJoin: Dispatch<SetStateAction<boolean>>;
  setFolderPermissionEnabled: Dispatch<SetStateAction<boolean>>;
  setSettingsLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  useEffect(() => {
    if (!currentSpaceId || !isOwnerOrAdmin) {
      return;
    }

    let cancelled = false;
    setSettingsLoading(true);

    const loadSettings = async () => {
      try {
        const response = await PlaygroundApi.SpaceMemberDetailV2({
          space_id: currentSpaceId,
          page: DEFAULT_MEMBER_QUERY_PAGE,
          size: DEFAULT_MEMBER_QUERY_SIZE,
        });
        if (!isSuccessCode(response?.code)) {
          throw new Error(response?.msg || 'load space settings failed');
        }

        const configDetails = response?.data?.space_config_details;
        const canSupportExternalJoin =
          configDetails?.is_support_external_users_join_space;
        const forbidMemberUpsertFolder =
          configDetails?.forbid_member_upsert_folder;

        if (!cancelled && typeof canSupportExternalJoin === 'boolean') {
          setDisableExternalJoin(!canSupportExternalJoin);
        }

        if (!cancelled && typeof forbidMemberUpsertFolder === 'boolean') {
          setFolderPermissionEnabled(forbidMemberUpsertFolder);
        }
      } catch (error) {
        if (!cancelled) {
          const message = toErrorMessage(error, 'load space settings failed');
          Toast.error(
            I18n.t(
              'space_config_settings_load_failed',
              { message },
              '空间设置加载失败，请稍后重试',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setSettingsLoading(false);
        }
      }
    };

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [
    currentSpaceId,
    isOwnerOrAdmin,
    setDisableExternalJoin,
    setFolderPermissionEnabled,
    setSettingsLoading,
  ]);
};

const useSpaceSettingsControl = ({
  currentSpace,
  isOwnerOrAdmin,
}: {
  currentSpace?: DataItem.BotSpace;
  isOwnerOrAdmin: boolean;
}) => {
  const [disableExternalJoin, setDisableExternalJoin] = useState(false);
  const [folderPermissionEnabled, setFolderPermissionEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useSpaceSettingsLoader({
    currentSpaceId: currentSpace?.id,
    isOwnerOrAdmin,
    setDisableExternalJoin,
    setFolderPermissionEnabled,
    setSettingsLoading,
  });

  const persistSpaceSettings = useCallback(
    async ({
      nextDisableExternalJoin,
      nextFolderPermissionEnabled,
    }: {
      nextDisableExternalJoin: boolean;
      nextFolderPermissionEnabled: boolean;
    }) => {
      const payload = buildSavePayload({
        currentSpace,
        nextDisableExternalJoin,
        nextFolderPermissionEnabled,
      });
      if (!payload) {
        return false;
      }

      setSettingsSaving(true);
      try {
        const response = await PlaygroundApi.SaveSpaceV2(payload);
        if (!isSuccessCode(response?.code)) {
          throw new Error(response?.msg || 'save space settings failed');
        }
        return true;
      } catch (error) {
        const message = toErrorMessage(error, 'save space settings failed');
        Toast.error(
          I18n.t(
            'space_config_settings_save_failed',
            { message },
            '空间设置保存失败，请稍后重试',
          ),
        );
        return false;
      } finally {
        setSettingsSaving(false);
      }
    },
    [currentSpace],
  );

  const handleDisableExternalJoinChange = useCallback(
    (value: boolean) => {
      const previousValue = disableExternalJoin;
      setDisableExternalJoin(value);

      void (async () => {
        const success = await persistSpaceSettings({
          nextDisableExternalJoin: value,
          nextFolderPermissionEnabled: folderPermissionEnabled,
        });
        if (!success) {
          setDisableExternalJoin(previousValue);
        }
      })();
    },
    [disableExternalJoin, folderPermissionEnabled, persistSpaceSettings],
  );

  const handleFolderPermissionEnabledChange = useCallback(
    (value: boolean) => {
      const previousValue = folderPermissionEnabled;
      setFolderPermissionEnabled(value);

      void (async () => {
        const success = await persistSpaceSettings({
          nextDisableExternalJoin: disableExternalJoin,
          nextFolderPermissionEnabled: value,
        });
        if (!success) {
          setFolderPermissionEnabled(previousValue);
        }
      })();
    },
    [disableExternalJoin, folderPermissionEnabled, persistSpaceSettings],
  );

  return {
    disableExternalJoin,
    folderPermissionEnabled,
    settingsLoading,
    settingsSaving,
    handleDisableExternalJoinChange,
    handleFolderPermissionEnabledChange,
  };
};

export const useSpaceConfigPageState = ({
  spaceId,
  navigate,
}: {
  spaceId?: string;
  navigate: NavigateFunction;
}) => {
  const currentSpaceInfo = useCurrentSpaceInfo(spaceId);

  const settingsControl = useSpaceSettingsControl({
    currentSpace: currentSpaceInfo.currentSpace,
    isOwnerOrAdmin: currentSpaceInfo.isOwnerOrAdmin,
  });

  const leaveControl = useLeaveSpaceControl({
    currentSpace: currentSpaceInfo.currentSpace,
    isPersonalSpace: currentSpaceInfo.isPersonalSpace,
    requireTransferMemberBeforeLeave:
      currentSpaceInfo.shouldShowOwnerTransferHint,
    navigate,
  });

  return {
    ...currentSpaceInfo,
    requireTransferMemberBeforeLeave:
      currentSpaceInfo.shouldShowOwnerTransferHint,
    ...settingsControl,
    ...leaveControl,
  };
};
