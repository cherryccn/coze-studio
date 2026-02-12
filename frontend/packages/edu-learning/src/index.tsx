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

export { default as LearningCenter } from './pages/learning-center';
export { default as ScriptLearning } from './pages/script-learning';
export { default as TemplateLearning } from './pages/template-learning';
export { default as BotDevelopment } from './pages/bot-development';
export { default as MyProjects } from './pages/my-projects';

export * from './types';
export * from './hooks';
export * as projectAPI from './api/project';
export * as evaluationAPI from './api/evaluation';
