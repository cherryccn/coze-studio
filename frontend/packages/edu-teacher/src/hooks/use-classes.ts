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

import type { CreateClassRequest } from '../types';
import { getMyClasses, createClass, deleteClass } from '../api/class';

/**
 * Hook for managing class list
 */
export const useClasses = (spaceId: string) => {
  // Get class list
  const {
    data: classesData,
    loading: loadingClasses,
    error: classesError,
    refresh: refreshClasses,
  } = useRequest(() => getMyClasses(spaceId), {
    ready: !!spaceId,
    refreshDeps: [spaceId],
  });

  // Create class
  const {
    run: createClassRun,
    loading: creatingClass,
    error: createError,
  } = useRequest((data: CreateClassRequest) => createClass(spaceId, data), {
    manual: true,
    onSuccess: () => {
      refreshClasses();
    },
  });

  // Delete class
  const {
    run: deleteClassRun,
    loading: deletingClass,
    error: deleteError,
  } = useRequest((classId: string) => deleteClass(spaceId, classId), {
    manual: true,
    onSuccess: () => {
      refreshClasses();
    },
  });

  return {
    // Data
    classes: Array.isArray(classesData?.data)
      ? classesData.data
      : (classesData?.data?.list || []),
    total: classesData?.data?.total || (Array.isArray(classesData?.data) ? classesData.data.length : 0),

    // Loading states
    loadingClasses,
    creatingClass,
    deletingClass,

    // Errors
    classesError,
    createError,
    deleteError,

    // Actions
    refreshClasses,
    createClass: createClassRun,
    deleteClass: deleteClassRun,
  };
};
