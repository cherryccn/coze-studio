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

import apiClient, { BaseResponse } from './client';
import type { EvaluationInfo, DimensionScore } from '@coze-edu/common/types';

// ========== 请求类型 ==========

export interface CreateTeacherEvaluationRequest {
  project_id: number;
  dimension_scores: Record<string, DimensionScore>;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
}

// ========== API 函数 ==========

/**
 * 创建教师评估
 */
export const createTeacherEvaluation = async (
  spaceId: number,
  request: CreateTeacherEvaluationRequest
): Promise<EvaluationInfo> => {
  const response: BaseResponse<EvaluationInfo> = await apiClient.post(
    `/api/space/${spaceId}/edu/evaluations`,
    request
  );
  return response.data!;
};

/**
 * 获取项目的所有评估
 */
export const getProjectEvaluations = async (
  spaceId: number,
  projectId: number
): Promise<EvaluationInfo[]> => {
  const response: BaseResponse<EvaluationInfo[]> = await apiClient.get(
    `/api/space/${spaceId}/edu/projects/${projectId}/evaluations`
  );
  return response.data!;
};

/**
 * 获取最新评估结果
 */
export const getLatestEvaluation = async (
  spaceId: number,
  projectId: number
): Promise<EvaluationInfo | null> => {
  const evaluations = await getProjectEvaluations(spaceId, projectId);
  return evaluations.length > 0 ? evaluations[0] : null;
};
