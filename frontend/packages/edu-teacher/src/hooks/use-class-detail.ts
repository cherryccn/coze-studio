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

import type { UpdateClassRequest } from '../types';
import { getClass, updateClass } from '../api/class';

/**
 * Hook for managing class detail
 */
export const useClassDetail = (spaceId: string, classId: string) => {
  // Get class detail
  const {
    data: classData,
    loading: loadingClass,
    error: classError,
    refresh: refreshClass,
  } = useRequest(() => getClass(spaceId, classId), {
    ready: !!spaceId && !!classId,
    refreshDeps: [spaceId, classId],
  });

  // Update class
  const {
    run: updateClassRun,
    loading: updatingClass,
    error: updateError,
  } = useRequest(
    (data: UpdateClassRequest) => updateClass(spaceId, classId, data),
    {
      manual: true,
      onSuccess: () => {
        refreshClass();
      },
    },
  );

  return {
    // Data
    classDetail: classData?.data,

    // Loading states
    loadingClass,
    updatingClass,

    // Errors
    classError,
    updateError,

    // Actions
    refreshClass,
    updateClass: updateClassRun,
  };
};
