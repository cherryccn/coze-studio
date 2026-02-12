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
 * 项目类型
 */
export enum ProjectType {
  /** 剧本引导学习 */
  Script = 1,
  /** 模板定制开发 */
  Template = 2,
  /** 自主Bot开发 */
  Bot = 3,
}

/**
 * 项目状态
 */
export enum ProjectStatus {
  /** 进行中 */
  InProgress = 'in_progress',
  /** 已完成 */
  Completed = 'completed',
  /** 已放弃 */
  Abandoned = 'abandoned',
}

/**
 * 阶段状态
 */
export enum StageStatus {
  /** 未开始 */
  NotStarted = 'not_started',
  /** 进行中 */
  InProgress = 'in_progress',
  /** 已完成 */
  Completed = 'completed',
}

/**
 * 消息角色
 */
export enum MessageRole {
  /** 用户（学生） */
  User = 'user',
  /** 助手（Bot） */
  Assistant = 'assistant',
}

/**
 * 评估类型
 */
export enum EvaluationType {
  /** AI自动评估 */
  AI = 1,
  /** 教师评估 */
  Teacher = 2,
}

/**
 * 可见性级别
 */
export enum VisibilityLevel {
  /** 私有 */
  Private = 'private',
  /** 团队 */
  Team = 'team',
  /** 公开 */
  Public = 'public',
}

/**
 * 学习阶段
 */
export enum LearningStage {
  /** 阶段1：概念理解 */
  Stage1 = 1,
  /** 阶段2：功能设计 */
  Stage2 = 2,
  /** 阶段3：Bot开发 */
  Stage3 = 3,
}

/**
 * 场景类别
 */
export enum ScenarioCategory {
  /** 市场营销 */
  Marketing = 'marketing',
  /** 金融理财 */
  Finance = 'finance',
  /** 电商运营 */
  Ecommerce = 'ecommerce',
  /** 客户服务 */
  CustomerService = 'customer_service',
  /** 人力资源 */
  HR = 'hr',
}

/**
 * 学生学习项目
 */
export interface StudentProject {
  id: number;
  user_id: number;
  space_id: number;
  class_id?: number;
  assignment_id?: number;
  project_type: ProjectType;
  source_id: number;
  title: string;
  description?: string;
  bot_id?: number;
  current_stage: number;
  status: ProjectStatus;
  total_score?: number;
  teacher_comment?: string;
  teacher_score?: number;
  started_at: string;
  completed_at?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 项目阶段
 */
export interface ProjectStage {
  id: number;
  project_id: number;
  stage_order: number;
  stage_name: string;
  status: StageStatus;
  output_content?: string;
  score?: number;
  feedback?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 对话消息
 */
export interface ChatMessage {
  id: number;
  project_id: number;
  stage_id?: number;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  created_at: string;
}

/**
 * 附件
 */
export interface Attachment {
  type: string;
  url: string;
  name: string;
  size: number;
}

/**
 * 评估结果
 */
export interface Evaluation {
  id: number;
  project_id: number;
  user_id: number;
  evaluation_type: EvaluationType;
  evaluator_id?: number;
  dimension_scores?: Record<string, DimensionScore>;
  total_score: number;
  max_score: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  evaluated_at: string;
}

/**
 * 维度得分
 */
export interface DimensionScore {
  name: string;
  score: number;
  max_score: number;
  weight: number;
  feedback?: string;
}

/**
 * 剧本
 */
export interface Script {
  id: number;
  space_id: number;
  creator_id: number;
  title: string;
  description?: string;
  visibility: VisibilityLevel;
  learning_stage: LearningStage;
  scenario_category: ScenarioCategory;
  stage_configs: Record<string, StageConfig>;
  created_at: string;
  updated_at: string;
}

/**
 * 阶段配置
 */
export interface StageConfig {
  stage_name: string;
  stage_order: number;
  guidance_prompt: string;
  evaluation_criteria: Record<string, EvaluationCriterion>;
}

/**
 * 评估标准
 */
export interface EvaluationCriterion {
  name: string;
  description: string;
  max_score: number;
  weight: number;
}

/**
 * 模板
 */
export interface Template {
  id: number;
  space_id: number;
  creator_id: number;
  bot_id: number;
  title: string;
  description?: string;
  visibility: VisibilityLevel;
  scenario_category: ScenarioCategory;
  customization_guide?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 班级
 */
export interface Class {
  id: number;
  space_id: number;
  teacher_id: number;
  class_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 班级成员
 */
export interface ClassMember {
  id: number;
  class_id: number;
  user_id: number;
  joined_at: string;
}

/**
 * 作业
 */
export interface Assignment {
  id: number;
  class_id: number;
  teacher_id: number;
  assignment_type: ProjectType;
  source_id: number;
  title: string;
  description?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}
