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
 * 班级信息
 */
export interface Class {
  id: number;
  space_id: number;
  name: string;
  code: string;
  description: string;
  teacher_id: number;
  team_space_id?: number;
  semester: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

/**
 * 班级列表项
 */
export interface ClassItem {
  id: number;
  name: string;
  code: string;
  description: string;
  semester: string;
  student_count: number;
  status: string;
  created_at: string;
}

/**
 * 班级成员信息
 */
export interface ClassMember {
  id: number;
  user_id: number;
  role: 'teacher' | 'assistant' | 'student';
  student_no?: string;
  joined_at: string;
  // 扩展字段
  user_name?: string;
  user_email?: string;
}

/**
 * 邀请码信息
 */
export interface InviteCode {
  id: number;
  class_id: number;
  code: string;
  role: string;
  max_uses: number;
  used_count: number;
  expires_at?: string;
  created_by: number;
  created_at: string;
}

/**
 * 创建班级请求
 */
export interface CreateClassRequest {
  name: string;
  code: string;
  description?: string;
  semester?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 更新班级请求
 */
export interface UpdateClassRequest {
  name?: string;
  description?: string;
  semester?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'archived';
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
