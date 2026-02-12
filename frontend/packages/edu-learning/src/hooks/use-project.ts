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
  createProject,
  getProject,
  listProjects,
  getMyProjects,
  updateStageOutput,
  completeStage,
  submitProject,
  type CreateProjectRequest,
  type ListProjectsRequest,
  type UpdateStageOutputRequest,
  type CompleteStageRequest,
} from '../api/project';

/**
 * 创建项目 Hook
 */
export const useCreateProject = (spaceId: number) => {
  return useRequest(
    (request: CreateProjectRequest) => createProject(spaceId, request),
    {
      manual: true,
      onSuccess: () => {
        // 创建成功后的回调
        console.log('Project created successfully');
      },
      onError: error => {
        console.error('Failed to create project:', error);
      },
    }
  );
};

/**
 * 获取项目详情 Hook
 */
export const useProject = (spaceId: number, projectId: number | null) => {
  return useRequest(
    () => {
      if (!projectId) {
        return Promise.reject(new Error('Project ID is required'));
      }
      return getProject(spaceId, projectId);
    },
    {
      ready: !!projectId,
      refreshDeps: [spaceId, projectId],
      onError: error => {
        console.error('Failed to fetch project:', error);
      },
    }
  );
};

/**
 * 获取项目列表 Hook
 */
export const useProjects = (spaceId: number, request?: ListProjectsRequest) => {
  return useRequest(() => listProjects(spaceId, request), {
    refreshDeps: [spaceId, request],
    onError: error => {
      console.error('Failed to fetch projects:', error);
    },
  });
};

/**
 * 获取我的项目列表 Hook
 */
export const useMyProjects = (spaceId: number) => {
  return useRequest(() => getMyProjects(spaceId), {
    refreshDeps: [spaceId],
    onError: error => {
      console.error('Failed to fetch my projects:', error);
    },
  });
};

/**
 * 更新阶段产出 Hook
 */
export const useUpdateStageOutput = (spaceId: number) => {
  return useRequest(
    (request: UpdateStageOutputRequest) => updateStageOutput(spaceId, request),
    {
      manual: true,
      onSuccess: () => {
        console.log('Stage output updated successfully');
      },
      onError: error => {
        console.error('Failed to update stage output:', error);
      },
    }
  );
};

/**
 * 完成阶段 Hook
 */
export const useCompleteStage = (spaceId: number) => {
  return useRequest(
    (request: CompleteStageRequest) => completeStage(spaceId, request),
    {
      manual: true,
      onSuccess: data => {
        console.log('Stage completed successfully:', data);
      },
      onError: error => {
        console.error('Failed to complete stage:', error);
      },
    }
  );
};

/**
 * 提交项目 Hook
 */
export const useSubmitProject = (spaceId: number) => {
  return useRequest((projectId: number) => submitProject(spaceId, projectId), {
    manual: true,
    onSuccess: () => {
      console.log('Project submitted successfully');
    },
    onError: error => {
      console.error('Failed to submit project:', error);
    },
  });
};
