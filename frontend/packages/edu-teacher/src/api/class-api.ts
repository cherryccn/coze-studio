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

import axios from 'axios';

import type {
  Class,
  ClassItem,
  ClassMember,
  InviteCode,
  CreateClassRequest,
  UpdateClassRequest,
  AddMembersRequest,
  CreateInviteCodeRequest,
} from '../types/class';

const apiClient = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 创建班级
 */
export async function createClass(
  spaceId: string,
  request: CreateClassRequest,
): Promise<Class> {
  const response = await apiClient.post<ApiResponse<Class>>(
    `/api/space/${spaceId}/edu/classes`,
    request,
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '创建班级失败');
  }
  return response.data.data;
}

/**
 * 获取我的班级列表
 */
export async function getMyClasses(spaceId: string): Promise<ClassItem[]> {
  const response = await apiClient.get<ApiResponse<ClassItem[]>>(
    `/api/space/${spaceId}/edu/classes/my`,
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '获取班级列表失败');
  }
  return response.data.data;
}

/**
 * 获取班级详情
 */
export async function getClass(
  spaceId: string,
  classId: string,
): Promise<Class> {
  const response = await apiClient.get<ApiResponse<Class>>(
    `/api/space/${spaceId}/edu/classes/${classId}`,
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '获取班级详情失败');
  }
  return response.data.data;
}

/**
 * 更新班级信息
 */
export async function updateClass(
  spaceId: string,
  classId: string,
  request: UpdateClassRequest,
): Promise<Class> {
  const response = await apiClient.put<ApiResponse<Class>>(
    `/api/space/${spaceId}/edu/classes/${classId}`,
    request,
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '更新班级失败');
  }
  return response.data.data;
}

/**
 * 添加班级成员
 */
export async function addClassMembers(
  spaceId: string,
  classId: string,
  request: AddMembersRequest,
): Promise<{ success: number; failed: number; failed_users: number[] }> {
  const response = await apiClient.post<
    ApiResponse<{ success: number; failed: number; failed_users: number[] }>
  >(`/api/space/${spaceId}/edu/classes/${classId}/members`, request);
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '添加成员失败');
  }
  return response.data.data;
}

/**
 * 获取班级成员列表
 */
export async function getClassMembers(
  spaceId: string,
  classId: string,
  role?: string,
): Promise<ClassMember[]> {
  const params = role ? { role } : {};
  const response = await apiClient.get<ApiResponse<ClassMember[]>>(
    `/api/space/${spaceId}/edu/classes/${classId}/members`,
    { params },
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '获取成员列表失败');
  }
  return response.data.data;
}

/**
 * 移除班级成员
 */
export async function removeClassMember(
  spaceId: string,
  classId: string,
  userId: string,
): Promise<void> {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/api/space/${spaceId}/edu/classes/${classId}/members/${userId}`,
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '移除成员失败');
  }
}

/**
 * 创建邀请码
 */
export async function createInviteCode(
  spaceId: string,
  classId: string,
  request: CreateInviteCodeRequest,
): Promise<InviteCode> {
  const response = await apiClient.post<ApiResponse<InviteCode>>(
    `/api/space/${spaceId}/edu/classes/${classId}/invite-codes`,
    request,
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '创建邀请码失败');
  }
  return response.data.data;
}

/**
 * 获取班级邀请码列表
 */
export async function getInviteCodes(
  spaceId: string,
  classId: string,
): Promise<InviteCode[]> {
  const response = await apiClient.get<ApiResponse<InviteCode[]>>(
    `/api/space/${spaceId}/edu/classes/${classId}/invite-codes`,
  );
  if (response.data.code !== 0) {
    throw new Error(response.data.msg || '获取邀请码列表失败');
  }
  return response.data.data;
}
