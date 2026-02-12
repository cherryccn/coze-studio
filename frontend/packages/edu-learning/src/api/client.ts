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

import axios, { AxiosInstance } from 'axios';

// 创建 axios 实例
// 注意：不设置 baseURL，使用相对路径，由开发服务器的 proxy 配置处理
const apiClient: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加认证 token
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // 未授权，跳转登录
        console.error('Unauthorized');
      } else if (status === 403) {
        // 无权限
        console.error('Forbidden');
      } else if (status >= 500) {
        // 服务器错误
        console.error('Server error:', data?.msg || 'Internal server error');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// 通用响应类型
export interface BaseResponse<T = any> {
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
