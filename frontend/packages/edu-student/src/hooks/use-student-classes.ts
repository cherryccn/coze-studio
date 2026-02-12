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

import { studentClassAPI } from '../api/class';

/**
 * 获取学生班级列表 Hook
 */
export const useStudentClasses = (spaceId: string) => {
  const { data, loading, error, refresh } = useRequest(
    () => studentClassAPI.getMyClasses(spaceId),
    {
      ready: !!spaceId,
    },
  );

  return {
    classes: data?.data?.list || [],
    total: data?.data?.total || 0,
    loading,
    error,
    refresh,
  };
};
