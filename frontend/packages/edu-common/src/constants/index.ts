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

import { ProjectType, ScenarioCategory, LearningStage } from '../types';

/**
 * 项目类型标签映射
 */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.Script]: 'edu.project.type.script',
  [ProjectType.Template]: 'edu.project.type.template',
  [ProjectType.Bot]: 'edu.project.type.bot',
};

/**
 * 场景类别标签映射
 */
export const SCENARIO_CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  [ScenarioCategory.Marketing]: 'edu.scenario.marketing',
  [ScenarioCategory.Finance]: 'edu.scenario.finance',
  [ScenarioCategory.Ecommerce]: 'edu.scenario.ecommerce',
  [ScenarioCategory.CustomerService]: 'edu.scenario.customer_service',
  [ScenarioCategory.HR]: 'edu.scenario.hr',
};

/**
 * 学习阶段标签映射
 */
export const LEARNING_STAGE_LABELS: Record<LearningStage, string> = {
  [LearningStage.Stage1]: 'edu.stage.1.name',
  [LearningStage.Stage2]: 'edu.stage.2.name',
  [LearningStage.Stage3]: 'edu.stage.3.name',
};

/**
 * 学习阶段描述映射
 */
export const LEARNING_STAGE_DESCRIPTIONS: Record<LearningStage, string> = {
  [LearningStage.Stage1]: 'edu.stage.1.description',
  [LearningStage.Stage2]: 'edu.stage.2.description',
  [LearningStage.Stage3]: 'edu.stage.3.description',
};

/**
 * 默认最高分
 */
export const DEFAULT_MAX_SCORE = 100;

/**
 * 默认阶段数量
 */
export const DEFAULT_STAGE_COUNT = 3;

/**
 * API路由前缀
 */
export const EDU_API_PREFIX = '/api/v1/edu';
