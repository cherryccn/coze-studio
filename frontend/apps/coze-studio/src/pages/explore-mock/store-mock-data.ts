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

export type TemplateCategory =
  | 'all'
  | 'workflow'
  | 'chatbot'
  | 'analysis'
  | 'marketing';

export type PluginCategory =
  | 'all'
  | 'development'
  | 'data'
  | 'office'
  | 'media';

export type PluginSource = 'local' | 'coze';

export type PluginAuthMode = 'none' | 'need-auth' | 'configured';

export interface TemplateStoreItem {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  authorName: string;
  usageCount: number;
  favoriteCount: number;
  isOfficial: boolean;
  coverGradient: string;
}

export interface PluginStoreItem {
  id: string;
  name: string;
  description: string;
  source: PluginSource;
  category: PluginCategory;
  tags: string[];
  authorName: string;
  installCount: number;
  rating: number;
  authMode: PluginAuthMode;
  installed: boolean;
}

export const TEMPLATE_CATEGORY_OPTIONS: Array<{
  label: string;
  value: TemplateCategory;
}> = [
  { label: '全部', value: 'all' },
  { label: '工作流', value: 'workflow' },
  { label: '聊天智能体', value: 'chatbot' },
  { label: '数据分析', value: 'analysis' },
  { label: '营销运营', value: 'marketing' },
];

export const PLUGIN_CATEGORY_OPTIONS: Array<{
  label: string;
  value: PluginCategory;
}> = [
  { label: '全部', value: 'all' },
  { label: '开发效率', value: 'development' },
  { label: '数据能力', value: 'data' },
  { label: '办公协同', value: 'office' },
  { label: '音视频', value: 'media' },
];

export const TEMPLATE_STORE_MOCK_DATA: TemplateStoreItem[] = [
  {
    id: 'tpl-001',
    name: '销售线索分层与分发',
    description: '自动识别线索等级并分配到对应团队，支持规则与模型混合判断。',
    category: 'workflow',
    tags: ['CRM', '自动化', '审批'],
    authorName: 'Coze 官方',
    usageCount: 38492,
    favoriteCount: 1280,
    isOfficial: true,
    coverGradient:
      'linear-gradient(135deg,#cbe2ff 0%,#e9f2ff 46%,#f7fbff 100%)',
  },
  {
    id: 'tpl-002',
    name: '多轮客服问答助手',
    description: '内置常见问答策略，可接入知识库与工单系统。',
    category: 'chatbot',
    tags: ['客服', '知识库', 'FAQ'],
    authorName: '运营增长组',
    usageCount: 20511,
    favoriteCount: 803,
    isOfficial: false,
    coverGradient:
      'linear-gradient(135deg,#d6f5ea 0%,#ecfbf5 48%,#fbfffd 100%)',
  },
  {
    id: 'tpl-003',
    name: '周报自动生成与分发',
    description: '聚合周内关键指标，自动生成摘要并分发到指定群组。',
    category: 'analysis',
    tags: ['BI', '周报', '自动发送'],
    authorName: '数据平台组',
    usageCount: 16740,
    favoriteCount: 624,
    isOfficial: false,
    coverGradient:
      'linear-gradient(135deg,#ffe4c4 0%,#fff1df 48%,#fff9f2 100%)',
  },
  {
    id: 'tpl-004',
    name: '活动内容批量生产',
    description: '按活动主题生成图文素材与投放文案，支持批量参数输入。',
    category: 'marketing',
    tags: ['内容生成', '投放', '批处理'],
    authorName: '市场增长组',
    usageCount: 14280,
    favoriteCount: 588,
    isOfficial: false,
    coverGradient:
      'linear-gradient(135deg,#ffe0e8 0%,#fff0f4 48%,#fff8fa 100%)',
  },
  {
    id: 'tpl-005',
    name: '工单升级与通知链路',
    description: '高优先级工单自动升级并触达值班同学，减少响应延迟。',
    category: 'workflow',
    tags: ['工单', '通知', 'SLA'],
    authorName: 'Coze 官方',
    usageCount: 12852,
    favoriteCount: 432,
    isOfficial: true,
    coverGradient:
      'linear-gradient(135deg,#e3dcff 0%,#f0ecff 48%,#faf8ff 100%)',
  },
  {
    id: 'tpl-006',
    name: '竞品评论情感洞察',
    description: '抓取评论并进行情感聚类，快速识别用户关注点与痛点。',
    category: 'analysis',
    tags: ['NLP', '舆情', '聚类'],
    authorName: '研究策略组',
    usageCount: 9650,
    favoriteCount: 350,
    isOfficial: false,
    coverGradient:
      'linear-gradient(135deg,#d7f2ff 0%,#ebf8ff 48%,#f8fdff 100%)',
  },
];

export const PLUGIN_STORE_MOCK_DATA: PluginStoreItem[] = [
  {
    id: 'plg-001',
    name: '企业知识检索',
    description: '连接内部知识源并支持语义检索，适合客服与运营场景。',
    source: 'local',
    category: 'data',
    tags: ['RAG', '知识库'],
    authorName: '基础平台组',
    installCount: 12034,
    rating: 4.8,
    authMode: 'configured',
    installed: true,
  },
  {
    id: 'plg-002',
    name: 'Markdown 转海报',
    description: '将结构化文本快速渲染为营销海报，支持模板切换。',
    source: 'local',
    category: 'media',
    tags: ['图像生成', '设计'],
    authorName: '内容设计组',
    installCount: 8920,
    rating: 4.6,
    authMode: 'none',
    installed: false,
  },
  {
    id: 'plg-003',
    name: '飞书日程管理',
    description: '创建、更新、查询日程并通知参会人，支持冲突检测。',
    source: 'coze',
    category: 'office',
    tags: ['飞书', '日历'],
    authorName: 'Coze 官方',
    installCount: 23021,
    rating: 4.9,
    authMode: 'need-auth',
    installed: false,
  },
  {
    id: 'plg-004',
    name: 'Git 提交分析',
    description: '分析仓库提交行为并生成迭代周报，适合研发管理。',
    source: 'coze',
    category: 'development',
    tags: ['Git', '研发效能'],
    authorName: 'DevOps 团队',
    installCount: 13311,
    rating: 4.7,
    authMode: 'configured',
    installed: true,
  },
  {
    id: 'plg-005',
    name: 'CSV 数据清洗',
    description: '常见格式清洗、去重和字段映射，支持导出处理结果。',
    source: 'local',
    category: 'data',
    tags: ['ETL', 'CSV'],
    authorName: '数据中台组',
    installCount: 10008,
    rating: 4.5,
    authMode: 'none',
    installed: false,
  },
  {
    id: 'plg-006',
    name: '会议录音摘要',
    description: '自动转写会议录音并提炼行动项，输出可追踪清单。',
    source: 'coze',
    category: 'office',
    tags: ['ASR', '摘要'],
    authorName: '智能办公组',
    installCount: 11450,
    rating: 4.7,
    authMode: 'need-auth',
    installed: false,
  },
];
