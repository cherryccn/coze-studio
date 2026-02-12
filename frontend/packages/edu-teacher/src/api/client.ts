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

import axios, { type AxiosInstance } from 'axios';

// HTTP Status Codes
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  SERVER_ERROR: 500,
} as const;

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  config =>
    // Token 添加逻辑（如需要）
    config,
  error => Promise.reject(error),
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        console.error('Unauthorized');
      } else if (status === HTTP_STATUS.FORBIDDEN) {
        console.error('Forbidden');
      } else if (status >= HTTP_STATUS.SERVER_ERROR) {
        console.error('Server error:', data?.msg || 'Internal server error');
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// 通用响应类型
export interface BaseResponse<T = unknown> {
  code: number;
  msg: string;
  data?: T;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}
