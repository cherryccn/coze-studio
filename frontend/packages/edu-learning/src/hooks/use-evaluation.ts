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
import {
  createTeacherEvaluation,
  getProjectEvaluations,
  getLatestEvaluation,
  type CreateTeacherEvaluationRequest,
} from '../api/evaluation';

/**
 * 创建教师评估 Hook
 */
export const useCreateTeacherEvaluation = (spaceId: number) => {
  return useRequest(
    (request: CreateTeacherEvaluationRequest) =>
      createTeacherEvaluation(spaceId, request),
    {
      manual: true,
      onSuccess: () => {
        console.log('Teacher evaluation created successfully');
      },
      onError: error => {
        console.error('Failed to create teacher evaluation:', error);
      },
    }
  );
};

/**
 * 获取项目评估列表 Hook
 */
export const useProjectEvaluations = (spaceId: number, projectId: number | null) => {
  return useRequest(
    () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required'));
      }
      return getProjectEvaluations(spaceId, projectId);
    },
    {
      ready: !!projectId,
      refreshDeps: [spaceId, projectId],
      onError: error => {
        console.error('Failed to fetch evaluations:', error);
      },
    }
  );
};

/**
 * 获取最新评估 Hook
 */
export const useLatestEvaluation = (spaceId: number, projectId: number | null) => {
  return useRequest(
    () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required'));
      }
      return getLatestEvaluation(spaceId, projectId);
    },
    {
      ready: !!projectId,
      refreshDeps: [spaceId, projectId],
      onError: error => {
        console.error('Failed to fetch latest evaluation:', error);
      },
    }
  );
};
