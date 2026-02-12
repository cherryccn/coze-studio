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

import { lazy } from 'react';

// login page
export const LoginPage = lazy(() =>
  import('@coze-foundation/account-ui-adapter').then(res => ({
    default: res.LoginPage,
  })),
);

// documentation page
export const Redirect = lazy(() => import('../pages/redirect'));

// Workspace Sidebar Component
export const spaceSubMenu = lazy(() =>
  import('@coze-foundation/space-ui-adapter').then(exps => ({
    default: exps.WorkspaceSubMenu,
  })),
);

// Workspace Layout Component
export const SpaceLayout = lazy(() =>
  import('@coze-foundation/space-ui-adapter').then(exps => ({
    default: exps.SpaceLayout,
  })),
);

// A specific workspace layout component
export const SpaceIdLayout = lazy(() =>
  import('@coze-foundation/space-ui-base').then(exps => ({
    default: exps.SpaceIdLayout,
  })),
);

// project development page
export const Develop = lazy(() => import('../pages/develop'));

// resource library page
export const Library = lazy(() => import('../pages/library'));

// Agent IDE Layout Component
export const AgentIDELayout = lazy(
  () => import('@coze-agent-ide/layout-adapter'),
);

// Agent IDE page
export const AgentIDE = lazy(() =>
  import('@coze-agent-ide/entry-adapter').then(res => ({
    default: res.BotEditor,
  })),
);

// Agent IDE Release Page
export const AgentPublishPage = lazy(() =>
  import('@coze-agent-ide/agent-publish').then(exps => ({
    default: exps.AgentPublishPage,
  })),
);

// Project IDE Page
export const ProjectIDE = lazy(() =>
  import('@coze-project-ide/main').then(exps => ({
    default: exps.IDELayout,
  })),
);

// Project IDE Release Page
export const ProjectIDEPublish = lazy(() =>
  import('@coze-studio/project-publish').then(exps => ({
    default: exps.ProjectPublish,
  })),
);

// Knowledge Base Preview Page
export const KnowledgePreview = lazy(() =>
  import('@coze-studio/workspace-base/knowledge-preview').then(exps => ({
    default: exps.KnowledgePreviewPage,
  })),
);

// Knowledge base upload page
export const KnowledgeUpload = lazy(() =>
  import('@coze-studio/workspace-base/knowledge-upload').then(exps => ({
    default: exps.KnowledgeUploadPage,
  })),
);

// database resource page
export const DatabaseDetail = lazy(() =>
  import('@coze-studio/workspace-base').then(exps => ({
    default: exps.DatabaseDetailPage,
  })),
);

// workflow page
export const WorkflowPage = lazy(() =>
  import('@coze-workflow/playground-adapter').then(res => ({
    default: res.WorkflowPage,
  })),
);

// search page
export const SearchPage = lazy(() =>
  import('@coze-community/explore').then(exps => ({
    default: exps.SearchPage,
  })),
);

// plugin resource page layout component
export const PluginLayout = lazy(() => import('../pages/plugin/layout'));

// plugin resource page
export const PluginPage = lazy(() => import('../pages/plugin/page'));

// plugin tool page
export const PluginToolPage = lazy(() => import('../pages/plugin/tool/page'));

// Explore the experience page secondary navigation component
export const exploreSubMenu = lazy(() =>
  import('@coze-community/explore').then(exps => ({
    default: exps.ExploreSubMenu,
  })),
);

// template page
export const ExploreTemplatePage = lazy(() =>
  import('@coze-community/explore').then(exps => ({
    default: exps.TemplatePage,
  })),
);

// plugin store page
export const ExplorePluginPage = lazy(() =>
  import('@coze-community/explore').then(exps => ({
    default: exps.PluginPage,
  })),
);

// Education platform - Script library list page
export const EduScriptListPage = lazy(() =>
  import('@coze-edu/script-library').then(res => ({
    default: res.ScriptListPage,
  })),
);

// Education platform - Script detail page
export const EduScriptDetailPage = lazy(() =>
  import('@coze-edu/script-library').then(res => ({
    default: res.ScriptDetailPage,
  })),
);

// Education platform - Learning center page
export const EduLearningCenter = lazy(() =>
  import('@coze-edu/learning').then(res => ({
    default: res.LearningCenter,
  })),
);

// Education platform - Script learning page
export const EduScriptLearning = lazy(() =>
  import('@coze-edu/learning').then(res => ({
    default: res.ScriptLearning,
  })),
);

// Education platform - My projects page
export const EduMyProjects = lazy(() =>
  import('@coze-edu/learning').then(res => ({
    default: res.MyProjects,
  })),
);

// Education platform - Teacher - Class list page
export const EduTeacherClassList = lazy(() =>
  import('@coze-edu/teacher').then(res => ({
    default: res.ClassList,
  })),
);

// Education platform - Teacher - Class detail page
export const EduTeacherClassDetail = lazy(() =>
  import('@coze-edu/teacher').then(res => ({
    default: res.ClassDetail,
  })),
);

// Education platform - Student - Join class page (临时占位)
export const EduStudentJoinClass = lazy(() =>
  import('@coze-edu/learning').then(res => ({
    default: res.LearningCenter,
  })),
);

// Education platform - Student - Class list page (临时占位)
export const EduStudentClassList = lazy(() =>
  import('@coze-edu/learning').then(res => ({
    default: res.LearningCenter,
  })),
);

// Education platform - Student - Class detail page (临时占位)
export const EduStudentClassDetail = lazy(() =>
  import('@coze-edu/learning').then(res => ({
    default: res.LearningCenter,
  })),
);

