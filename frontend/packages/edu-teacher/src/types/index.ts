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

/**
 * 班级状态
 */
export enum ClassStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

/**
 * 成员角色
 */
export enum MemberRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

/**
 * 班级信息
 */
export interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
  semester: string;
  status: ClassStatus;
  teacherId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 班级成员
 */
export interface ClassMember {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  role: MemberRole;
  joinedAt: string;
}

/**
 * 邀请码
 */
export interface InviteCode {
  id: string;
  classId: string;
  code: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * 创建班级请求
 */
export interface CreateClassRequest {
  name: string;
  code?: string;
  description?: string;
  semester: string;
}

/**
 * 更新班级请求
 */
export interface UpdateClassRequest {
  name?: string;
  description?: string;
  semester?: string;
  status?: ClassStatus;
}

/**
 * 添加成员请求
 */
export interface AddMembersRequest {
  members: Array<{
    user_id: number;
    role: 'student' | 'assistant';
    student_no?: string;
  }>;
}

/**
 * 创建邀请码请求
 */
export interface CreateInviteCodeRequest {
  role: 'student' | 'assistant';
  max_uses?: number;
  expires_at?: string;
}
