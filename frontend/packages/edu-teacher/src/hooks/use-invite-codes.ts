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

import { useRequest } from 'ahooks';

import type { CreateInviteCodeRequest } from '../types';
import {
  getInviteCodes,
  createInviteCode,
  deactivateInviteCode,
} from '../api/class';

/**
 * Hook for managing invite codes
 */
export const useInviteCodes = (spaceId: string, classId: string) => {
  // Get invite codes list
  const {
    data: codesData,
    loading: loadingCodes,
    error: codesError,
    refresh: refreshCodes,
  } = useRequest(() => getInviteCodes(spaceId, classId), {
    ready: !!spaceId && !!classId,
    refreshDeps: [spaceId, classId],
  });

  // Create invite code
  const {
    run: createCodeRun,
    loading: creatingCode,
    error: createError,
    data: createdCodeData,
  } = useRequest(
    (data: CreateInviteCodeRequest) => createInviteCode(spaceId, classId, data),
    {
      manual: true,
      onSuccess: () => {
        refreshCodes();
      },
    },
  );

  // Deactivate invite code
  const {
    run: deactivateCodeRun,
    loading: deactivatingCode,
    error: deactivateError,
  } = useRequest(
    (codeId: string) => deactivateInviteCode(spaceId, classId, codeId),
    {
      manual: true,
      onSuccess: () => {
        refreshCodes();
      },
    },
  );

  return {
    // Data
    inviteCodes: codesData?.data?.list || [],
    total: codesData?.data?.total || 0,
    createdCode: createdCodeData?.data,

    // Loading states
    loadingCodes,
    creatingCode,
    deactivatingCode,

    // Errors
    codesError,
    createError,
    deactivateError,

    // Actions
    refreshCodes,
    createCode: createCodeRun,
    deactivateCode: deactivateCodeRun,
  };
};
