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
  id: string;
  name: string;
  code: string;
  description?: string;
  semester: string;
  status: string;
  teacherId: string;
  teacherName?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 班级成员信息
 */
export interface ClassMember {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  role: string;
  joinedAt: string;
}

/**
 * 加入班级请求
 */
export interface JoinClassRequest {
  invite_code: string;
}

/**
 * 加入班级响应
 */
export interface JoinClassResponse {
  class_id: string;
  message: string;
}

/**
 * 班级列表响应
 */
export interface ClassListResponse {
  list: Class[];
  total: number;
}

/**
 * 班级详情响应
 */
export interface ClassDetailResponse {
  class: Class;
  members: ClassMember[];
}
