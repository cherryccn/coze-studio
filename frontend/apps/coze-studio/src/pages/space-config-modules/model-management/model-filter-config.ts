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

export type FilterSectionKey =
  | 'userRights'
  | 'modelStatus'
  | 'contextLength'
  | 'modelTag'
  | 'modelFamily';

export type OptionFilterKey = Exclude<FilterSectionKey, 'contextLength'>;

export type ModelFilterValues = Record<OptionFilterKey, string[]>;

export interface SpaceModelItem {
  id: string;
  name: string;
  description: string;
  contextLength: string;
  provider: string;
  updatedAt: string;
  userRights: string;
  modelStatus: string;
  modelTags: string[];
  modelFamily: string;
  enabledInSpace: boolean;
}

export const USER_RIGHTS_OPTIONS = ['订阅模型', '限额体验'];

export const MODEL_STATUS_OPTIONS = ['即将停运', '已停运'];

export const MODEL_TAG_OPTIONS = [
  '视频理解',
  '图片理解',
  '音频理解',
  '工具调用',
  '上下文缓存',
  '续写',
  '深度思考',
];

export const MODEL_FAMILY_OPTIONS = [
  '豆包大模型',
  'Deepseek',
  '通义千问',
  'Kimi',
  '百川',
  'ChatGPT',
  '阶跃星辰',
  '智谱',
  'Minimax',
];

export const CONTEXT_RANGE_MARKS: Record<number, string> = {
  0: '0',
  1: '32K',
  2: '64K',
  3: 'MAX',
};

export const DEFAULT_CONTEXT_RANGE: [number, number] = [0, 3];

export const createInitialFilterValues = (): ModelFilterValues => ({
  userRights: [],
  modelStatus: [],
  modelTag: [],
  modelFamily: [],
});

export const INITIAL_FILTER_COLLAPSE_STATE: Record<FilterSectionKey, boolean> =
  {
    userRights: false,
    modelStatus: false,
    contextLength: false,
    modelTag: false,
    modelFamily: false,
  };

export const getContextLengthLevel = (contextLength: string): number => {
  const normalized = contextLength.trim().toUpperCase();

  if (normalized === '0') {
    return 0;
  }

  if (normalized.includes('MAX')) {
    return 3;
  }

  const match = normalized.match(/(\d+)\s*K/);

  if (!match) {
    return 3;
  }

  const value = Number(match[1]);

  if (value <= 0) {
    return 0;
  }
  if (value <= 32) {
    return 1;
  }
  if (value <= 64) {
    return 2;
  }
  return 3;
};

export const MOCK_MODELS: SpaceModelItem[] = [
  {
    id: 'doubao-pro-32k',
    name: '豆包·Pro-32K',
    description: '擅长复杂指令与工具链编排，适合空间内稳定生产场景。',
    contextLength: '32K',
    provider: '扣子官方',
    updatedAt: '2025-11-26',
    userRights: '订阅模型',
    modelStatus: '即将停运',
    modelTags: ['工具调用', '上下文缓存', '深度思考'],
    modelFamily: '豆包大模型',
    enabledInSpace: true,
  },
  {
    id: 'deepseek-r1',
    name: 'Deepseek-R1',
    description: '面向推理密集型任务，在长链路求解场景表现突出。',
    contextLength: '64K',
    provider: 'Deepseek',
    updatedAt: '2025-12-18',
    userRights: '订阅模型',
    modelStatus: '即将停运',
    modelTags: ['深度思考', '续写'],
    modelFamily: 'Deepseek',
    enabledInSpace: false,
  },
  {
    id: 'qwen-max',
    name: '通义千问·Max',
    description: '中文任务处理稳定，适合知识问答与多轮交互。',
    contextLength: '32K',
    provider: '阿里云',
    updatedAt: '2025-12-12',
    userRights: '限额体验',
    modelStatus: '已停运',
    modelTags: ['工具调用', '音频理解'],
    modelFamily: '通义千问',
    enabledInSpace: true,
  },
  {
    id: 'kimi-long',
    name: 'Kimi-Long',
    description: '超长文本处理能力强，适合文档分析和续写任务。',
    contextLength: 'MAX',
    provider: 'Moonshot',
    updatedAt: '2025-10-09',
    userRights: '订阅模型',
    modelStatus: '即将停运',
    modelTags: ['上下文缓存', '续写'],
    modelFamily: 'Kimi',
    enabledInSpace: false,
  },
  {
    id: 'baichuan-4',
    name: '百川-4',
    description: '对齐通用对话场景，支持图文理解和工具调用。',
    contextLength: '64K',
    provider: '百川智能',
    updatedAt: '2025-11-30',
    userRights: '限额体验',
    modelStatus: '已停运',
    modelTags: ['图片理解', '工具调用'],
    modelFamily: '百川',
    enabledInSpace: false,
  },
  {
    id: 'chatgpt-4',
    name: 'ChatGPT-4',
    description: '综合能力均衡，支持多模态与复杂任务协同。',
    contextLength: 'MAX',
    provider: 'OpenAI',
    updatedAt: '2025-11-08',
    userRights: '订阅模型',
    modelStatus: '即将停运',
    modelTags: ['视频理解', '图片理解', '工具调用'],
    modelFamily: 'ChatGPT',
    enabledInSpace: true,
  },
  {
    id: 'step-2',
    name: '阶跃星辰·Step-2',
    description: '适配多媒体理解场景，适合音视频内容解析。',
    contextLength: '32K',
    provider: '阶跃星辰',
    updatedAt: '2025-09-20',
    userRights: '限额体验',
    modelStatus: '即将停运',
    modelTags: ['视频理解', '音频理解'],
    modelFamily: '阶跃星辰',
    enabledInSpace: true,
  },
  {
    id: 'glm-4',
    name: '智谱·GLM-4',
    description: '适配通用写作、总结和多轮问答业务流程。',
    contextLength: '64K',
    provider: '智谱',
    updatedAt: '2025-10-28',
    userRights: '订阅模型',
    modelStatus: '已停运',
    modelTags: ['续写', '工具调用'],
    modelFamily: '智谱',
    enabledInSpace: true,
  },
  {
    id: 'minimax-abab',
    name: 'Minimax-abab',
    description: '多模态问答性能稳定，适合图片与视频理解业务。',
    contextLength: '0',
    provider: 'Minimax',
    updatedAt: '2025-08-16',
    userRights: '限额体验',
    modelStatus: '已停运',
    modelTags: ['视频理解', '图片理解'],
    modelFamily: 'Minimax',
    enabledInSpace: false,
  },
];
