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

import apiClient, { type BaseResponse } from './client';
import type {
  JoinClassRequest,
  JoinClassResponse,
  ClassListResponse,
  ClassDetailResponse,
} from '../types';

/**
 * 学生端班级 API
 */
export const studentClassAPI = {
  /**
   * 使用邀请码加入班级
   */
  joinClass: (
    spaceId: string,
    data: JoinClassRequest,
  ): Promise<BaseResponse<JoinClassResponse>> =>
    apiClient.post(`/api/v1/space/${spaceId}/edu/classes/join`, data),

  /**
   * 获取学生已加入的班级列表
   */
  getMyClasses: (
    spaceId: string,
    page = 1,
    pageSize = 20,
  ): Promise<BaseResponse<ClassListResponse>> =>
    apiClient.get(`/api/v1/space/${spaceId}/edu/student/classes`, {
      params: { page, page_size: pageSize },
    }),

  /**
   * 获取班级详情（学生视角）
   */
  getClassDetail: (
    spaceId: string,
    classId: string,
  ): Promise<BaseResponse<ClassDetailResponse>> =>
    apiClient.get(`/api/v1/space/${spaceId}/edu/student/classes/${classId}`),
};
