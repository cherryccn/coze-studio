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

import apiClient, { BaseResponse, PaginatedResponse } from './client';
import type {
  ProjectType,
  ProjectStatus,
  StudentProject,
  ProjectStage,
  EvaluationInfo,
} from '@coze-edu/common/types';

// ========== 请求类型 ==========

export interface CreateProjectRequest {
  space_id: number;
  project_type: ProjectType;
  source_id: number;
  title: string;
  description?: string;
  class_id?: number;
  assignment_id?: number;
}

export interface ListProjectsRequest {
  space_id?: number;
  project_type?: ProjectType;
  status?: ProjectStatus;
  keyword?: string;
  page?: number;
  page_size?: number;
}

export interface UpdateStageOutputRequest {
  stage_id: number;
  content: string;
}

export interface CompleteStageRequest {
  project_id: number;
  stage_order: number;
  output_content: string;
}

// ========== 响应类型 ==========

export interface ProjectDetail extends StudentProject {
  stages?: ProjectStage[];
  evaluations?: EvaluationInfo[];
}

export interface StageCompletionData {
  stage_id: number;
  score: number;
  feedback: string;
  next_stage?: number;
  evaluation?: EvaluationInfo;
}

// ========== API 函数 ==========

/**
 * 创建学习项目
 */
export const createProject = async (
  spaceId: number,
  request: CreateProjectRequest
): Promise<StudentProject> => {
  const response: BaseResponse<StudentProject> = await apiClient.post(
    `/api/space/${spaceId}/edu/projects`,
    request
  );
  return response.data!;
};

/**
 * 获取项目详情
 */
export const getProject = async (
  spaceId: number,
  projectId: number
): Promise<ProjectDetail> => {
  const response: BaseResponse<ProjectDetail> = await apiClient.get(
    `/api/space/${spaceId}/edu/projects/${projectId}`
  );
  return response.data!;
};

/**
 * 获取项目列表
 */
export const listProjects = async (
  spaceId: number,
  request?: ListProjectsRequest
): Promise<PaginatedResponse<StudentProject>> => {
  const response: BaseResponse<PaginatedResponse<StudentProject>> = await apiClient.get(
    `/api/space/${spaceId}/edu/projects`,
    { params: request }
  );
  return response.data!;
};

/**
 * 获取我的项目列表
 */
export const getMyProjects = async (spaceId: number): Promise<StudentProject[]> => {
  const response: BaseResponse<StudentProject[]> = await apiClient.get(
    `/api/space/${spaceId}/edu/projects/my`
  );
  return response.data!;
};

/**
 * 更新阶段产出内容
 */
export const updateStageOutput = async (
  spaceId: number,
  request: UpdateStageOutputRequest
): Promise<void> => {
  await apiClient.put(`/api/space/${spaceId}/edu/stages/output`, request);
};

/**
 * 完成当前阶段
 */
export const completeStage = async (
  spaceId: number,
  request: CompleteStageRequest
): Promise<StageCompletionData> => {
  const response: BaseResponse<StageCompletionData> = await apiClient.post(
    `/api/space/${spaceId}/edu/stages/complete`,
    request
  );
  return response.data!;
};

/**
 * 提交项目（作业）
 */
export const submitProject = async (
  spaceId: number,
  projectId: number
): Promise<void> => {
  await apiClient.post(`/api/space/${spaceId}/edu/projects/${projectId}/submit`);
};
