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

import type { AddMembersRequest } from '../types';
import {
  getClassMembers,
  addClassMembers,
  removeClassMember,
} from '../api/class';

/**
 * Hook for managing class members
 */
export const useClassMembers = (spaceId: string, classId: string) => {
  // Get members list
  const {
    data: membersData,
    loading: loadingMembers,
    error: membersError,
    refresh: refreshMembers,
  } = useRequest(() => getClassMembers(spaceId, classId), {
    ready: !!spaceId && !!classId,
    refreshDeps: [spaceId, classId],
  });

  // Add members
  const {
    run: addMembersRun,
    loading: addingMembers,
    error: addError,
  } = useRequest(
    (data: AddMembersRequest) => addClassMembers(spaceId, classId, data),
    {
      manual: true,
      onSuccess: () => {
        refreshMembers();
      },
    },
  );

  // Remove member
  const {
    run: removeMemberRun,
    loading: removingMember,
    error: removeError,
  } = useRequest(
    (userId: string) => removeClassMember(spaceId, classId, userId),
    {
      manual: true,
      onSuccess: () => {
        refreshMembers();
      },
    },
  );

  return {
    // Data
    members: membersData?.data?.list || [],
    total: membersData?.data?.total || 0,

    // Loading states
    loadingMembers,
    addingMembers,
    removingMember,

    // Errors
    membersError,
    addError,
    removeError,

    // Actions
    refreshMembers,
    addMembers: addMembersRun,
    removeMember: removeMemberRun,
  };
};
