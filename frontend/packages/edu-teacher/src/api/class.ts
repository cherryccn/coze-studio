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

import apiClient, { type BaseResponse, type PaginatedResponse } from './client';
import type {
  Class,
  ClassMember,
  InviteCode,
  CreateClassRequest,
  UpdateClassRequest,
  AddMembersRequest,
  CreateInviteCodeRequest,
} from '../types';

/**
 * 创建班级
 */
export const createClass = (
  spaceId: string,
  data: CreateClassRequest,
): Promise<BaseResponse<Class>> =>
  apiClient.post(`/api/space/${spaceId}/edu/classes`, data);

/**
 * 获取我的班级列表
 */
export const getMyClasses = (
  spaceId: string,
): Promise<BaseResponse<PaginatedResponse<Class>>> =>
  apiClient.get(`/api/space/${spaceId}/edu/classes/my`).then(response => {
    // 兼容后端返回数组或对象格式
    if (Array.isArray(response.data)) {
      // 后端直接返回数组格式，转换为前端期望的格式
      const classes = response.data.map((item: any) => ({
        ...item,
        memberCount: item.student_count || item.memberCount || 0,
      }));
      return {
        ...response,
        data: {
          list: classes,
          total: classes.length,
          page: 1,
          page_size: classes.length,
        },
      };
    }
    // 后端返回对象格式，转换字段名
    if (response.data?.list) {
      const classes = response.data.list.map((item: any) => ({
        ...item,
        memberCount: item.student_count || item.memberCount || 0,
      }));
      return {
        ...response,
        data: {
          ...response.data,
          list: classes,
        },
      };
    }
    return response;
  });

/**
 * 获取班级详情
 */
export const getClass = (
  spaceId: string,
  classId: string,
): Promise<BaseResponse<Class>> =>
  apiClient.get(`/api/space/${spaceId}/edu/classes/${classId}`);

/**
 * 更新班级信息
 */
export const updateClass = (
  spaceId: string,
  classId: string,
  data: UpdateClassRequest,
): Promise<BaseResponse<Class>> =>
  apiClient.put(`/api/space/${spaceId}/edu/classes/${classId}`, data);

/**
 * 删除班级
 */
export const deleteClass = (
  spaceId: string,
  classId: string,
): Promise<BaseResponse<void>> =>
  apiClient.delete(`/api/space/${spaceId}/edu/classes/${classId}`);

/**
 * 批量添加班级成员
 */
export const addClassMembers = (
  spaceId: string,
  classId: string,
  data: AddMembersRequest,
): Promise<BaseResponse<ClassMember[]>> =>
  apiClient.post(`/api/space/${spaceId}/edu/classes/${classId}/members`, data);

/**
 * 获取班级成员列表
 */
export const getClassMembers = (
  spaceId: string,
  classId: string,
): Promise<BaseResponse<PaginatedResponse<ClassMember>>> =>
  apiClient.get(`/api/space/${spaceId}/edu/classes/${classId}/members`);

/**
 * 移除班级成员
 */
export const removeClassMember = (
  spaceId: string,
  classId: string,
  userId: string,
): Promise<BaseResponse<void>> =>
  apiClient.delete(
    `/api/space/${spaceId}/edu/classes/${classId}/members/${userId}`,
  );

/**
 * 创建邀请码
 */
export const createInviteCode = (
  spaceId: string,
  classId: string,
  data: CreateInviteCodeRequest,
): Promise<BaseResponse<InviteCode>> =>
  apiClient.post(
    `/api/space/${spaceId}/edu/classes/${classId}/invite-codes`,
    data,
  );

/**
 * 获取邀请码列表
 */
export const getInviteCodes = (
  spaceId: string,
  classId: string,
): Promise<BaseResponse<PaginatedResponse<InviteCode>>> =>
  apiClient.get(`/api/space/${spaceId}/edu/classes/${classId}/invite-codes`);

/**
 * 停用邀请码
 */
export const deactivateInviteCode = (
  spaceId: string,
  classId: string,
  codeId: string,
): Promise<BaseResponse<void>> =>
  apiClient.delete(
    `/api/space/${spaceId}/edu/classes/${classId}/invite-codes/${codeId}`,
  );
