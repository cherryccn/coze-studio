# 教育平台开发路线图

> **项目名称**：中教人机协同教育平台
> **开发周期**：6-8 周（4 个 Sprint）
> **版本**：v1.0
> **创建日期**：2026-02-04
> **目标**：交付完整的渐进式智能体开发教学平台（三阶段）

---

## 📋 目录

- [1. 项目概览](#1-项目概览)
- [2. 时间轴和里程碑](#2-时间轴和里程碑)
- [3. Sprint 详细规划](#3-sprint-详细规划)
- [4. 任务依赖关系](#4-任务依赖关系)
- [5. 风险管理](#5-风险管理)
- [6. 资源分配](#6-资源分配)
- [7. 验收标准](#7-验收标准)
- [8. 日常开发流程](#8-日常开发流程)

---

## 1. 项目概览

### 1.1 交付目标

**MVP 功能范围**：
- ✅ **三阶段学习**：剧本引导 + 模板定制 + 自主开发
- ✅ **双端支持**：学生端 + 教师端
- ✅ **完整闭环**：学习 → 作业 → 提交 → 评估
- ✅ **首个场景**：市场营销 - 社交媒体运营助手

**非 MVP 功能**（后续迭代）：
- ⏳ 多场景扩展（财务、电商、人力资源）
- ⏳ 学生协作功能
- ⏳ 移动端适配
- ⏳ 数据分析看板（校级）

### 1.2 技术复用策略

| 模块 | 复用现有 | 新增开发 | 开发量 |
|------|---------|---------|--------|
| **后端基础** | DDD 架构、权限系统 | 教育领域实体 | 中等 |
| **前端基础** | Space、Bot IDE | 教育专用页面 | 中等 |
| **数据库** | user/space 表 | 教育相关表 | 较少 |
| **AI 能力** | Bot API、评估模型 | 评估算法定制 | 较少 |

**预估工作量**：
- 后端开发：约 40-50 人日
- 前端开发：约 60-70 人日
- 测试和优化：约 20-30 人日
- **总计**：约 120-150 人日（假设 2 人团队，6-8 周）

---

## 2. 时间轴和里程碑

### 2.1 整体时间线

```
Week 1-2: Sprint 1 - 基础设施 + 剧本引导
    ↓
Week 3-4: Sprint 2 - 模板定制 + 教师端基础
    ↓
Week 5-6: Sprint 3 - 自主开发 + 评估系统
    ↓
Week 7-8: Sprint 4 - 优化 + 测试 + 发布
```

### 2.2 关键里程碑

| 里程碑 | 日期 | 交付物 | 验收标准 |
|--------|------|--------|---------|
| **M1: 基础框架完成** | Week 2 结束 | 数据库 Schema + 剧本学习流程 | 学生可完成一个完整剧本学习 |
| **M2: 三阶段打通** | Week 4 结束 | 剧本+模板+自主开发全流程 | 学生可体验三种学习方式 |
| **M3: 教学闭环完成** | Week 6 结束 | 教师端 + 评估系统 | 教师可布置作业并评估学生 |
| **M4: 产品发布** | Week 8 结束 | 完整可用的教育平台 | 通过完整场景测试 |

---

## 3. Sprint 详细规划

---

## Sprint 1：基础设施 + 剧本引导学习（Week 1-2）

### 3.1 Sprint 目标

**核心目标**：
- 搭建完整的后端和前端基础框架
- 实现剧本引导学习的完整流程
- 学生能浏览剧本、开始学习、完成对话、提交作品、查看评估

**交付标准**：
- ✅ 数据库表创建完成（核心表）
- ✅ 剧本列表、详情、工作区页面可用
- ✅ 学生能完成一个完整剧本项目
- ✅ AI 自动评估功能可用

---

### 3.2 后端任务分解

#### 3.2.1 数据库设计（优先级：P0）

**负责人**：后端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 1.1.1**：创建数据库迁移脚本
  - 文件：`backend/infra/database/sql/edu_platform_v1_schema.sql`
  - 表：
    - `edu_student_projects`（核心）
    - `edu_project_stages`
    - `edu_chat_messages`
    - `edu_evaluations`
  - 扩展现有表：
    - `edu_scripts`（添加 learning_stage, scenario_category, difficulty_level 字段）

- [ ] **Task 1.1.2**：创建测试数据脚本
  - 文件：`backend/infra/database/sql/edu_platform_v1_test_data.sql`
  - 测试剧本：《品牌社交媒体内容策划》（3 阶段）
  - 测试用户：教师账号 + 学生账号

- [ ] **Task 1.1.3**：执行数据库初始化
  ```bash
  docker exec -i coze-mysql mysql -u root -proot opencoze < edu_platform_v1_schema.sql
  docker exec -i coze-mysql mysql -u root -proot opencoze < edu_platform_v1_test_data.sql
  ```

**验收标准**：
- ✅ 所有表创建成功，无 SQL 错误
- ✅ 测试数据插入成功
- ✅ 可通过 SQL 查询到测试剧本和用户

---

#### 3.2.2 Domain 层实体定义（优先级：P0）

**负责人**：后端开发
**预估时间**：3 天

**任务清单**：
- [ ] **Task 1.2.1**：创建 edulearning 领域
  - 目录：`backend/domain/edulearning/`
  - 实体文件：
    - `entity/student_project.go`
    - `entity/script_project.go`
    - `entity/project_stage.go`
    - `entity/chat_message.go`

- [ ] **Task 1.2.2**：定义 Repository 接口
  - 文件：`backend/domain/edulearning/repository/project_repository.go`
  - 接口方法：
    ```go
    type ProjectRepository interface {
        CreateProject(ctx context.Context, project *entity.StudentProject) error
        GetProjectByID(ctx context.Context, projectID int64) (*entity.StudentProject, error)
        GetUserProjects(ctx context.Context, userID, spaceID int64, filters *ProjectFilters) ([]*entity.StudentProject, error)
        UpdateProject(ctx context.Context, project *entity.StudentProject) error
        GetProjectStages(ctx context.Context, projectID int64) ([]*entity.ProjectStage, error)
        UpdateStage(ctx context.Context, stage *entity.ProjectStage) error
    }
    ```

- [ ] **Task 1.2.3**：实现 Repository（DAO 层）
  - 目录：`backend/domain/edulearning/internal/dal/`
  - 文件：
    - `project_dao.go`
    - `stage_dao.go`
    - `chat_message_dao.go`

- [ ] **Task 1.2.4**：Domain Service
  - 文件：`backend/domain/edulearning/service/learning_service.go`
  - 核心方法：
    ```go
    type LearningService interface {
        StartScriptProject(ctx context.Context, req *StartScriptProjectRequest) (*entity.StudentProject, error)
        GetProjectDetail(ctx context.Context, projectID int64) (*ProjectDetail, error)
        SubmitStageOutput(ctx context.Context, req *SubmitStageRequest) error
        SubmitProject(ctx context.Context, projectID int64) error
    }
    ```

**验收标准**：
- ✅ 所有实体定义完整，包含必要字段和方法
- ✅ Repository 接口清晰，方法签名正确
- ✅ DAO 实现能正确操作数据库
- ✅ 单元测试覆盖核心方法

---

#### 3.2.3 Application 层服务（优先级：P0）

**负责人**：后端开发
**预估时间**：3 天

**任务清单**：
- [ ] **Task 1.3.1**：创建 Application Service
  - 文件：`backend/application/edulearning/script_learning_app.go`
  - 核心业务逻辑：
    - 开始剧本学习（创建项目 + 初始化阶段）
    - 提交阶段产出（保存 + 触发评估）
    - 提交最终项目

- [ ] **Task 1.3.2**：集成权限检查
  - 验证用户是否有权限访问剧本
  - 验证用户是否有权限操作项目
  - 使用 `permission.CheckAuthz()` 接口

- [ ] **Task 1.3.3**：事务处理
  - 使用 GORM 事务确保数据一致性
  - 关键操作：创建项目时同时创建阶段记录

**验收标准**：
- ✅ 业务逻辑正确，无数据不一致
- ✅ 权限检查有效
- ✅ 事务回滚机制正常

---

#### 3.2.4 API Handler 和路由（优先级：P0）

**负责人**：后端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 1.4.1**：创建 API Handler
  - 文件：`backend/api/handler/edu/learning_handler.go`
  - 接口：
    ```go
    // 开始剧本学习
    POST /api/space/:spaceId/edu/student/scripts/start

    // 获取项目详情
    GET /api/space/:spaceId/edu/student/projects/:id

    // 获取我的项目列表
    GET /api/space/:spaceId/edu/student/projects/my

    // 提交阶段产出
    POST /api/space/:spaceId/edu/student/stages/:stageId/submit

    // 提交最终项目
    POST /api/space/:spaceId/edu/student/projects/:id/submit
    ```

- [ ] **Task 1.4.2**：创建 API Models
  - 文件：`backend/api/model/edu/learning_api.go`
  - 定义 Request 和 Response 结构体

- [ ] **Task 1.4.3**：注册路由
  - 文件：`backend/api/router/edu/api.go`
  - 配置认证中间件
  - 配置 CORS（如需要）

**验收标准**：
- ✅ 所有 API 接口可通过 Postman/curl 调用
- ✅ 参数验证正确
- ✅ 错误处理完善

---

#### 3.2.5 AI 评估系统（优先级：P0）

**负责人**：后端开发
**预估时间**：3 天

**任务清单**：
- [ ] **Task 1.5.1**：创建评估服务
  - 文件：`backend/domain/edulearning/service/evaluation_service.go`
  - 核心功能：
    - 收集评估数据（对话记录、产出内容、时长）
    - 调用 AI 模型进行评分
    - 生成评估报告

- [ ] **Task 1.5.2**：集成 Ollama/OpenAI
  - 使用 Prompt 模板进行评估
  - 评估维度：
    - 对话质量（30%）
    - 决策合理性（40%）
    - 产出质量（30%）

- [ ] **Task 1.5.3**：评估结果存储
  - 保存到 `edu_evaluations` 表
  - 更新项目的 `total_score` 字段

**Prompt 模板示例**：
```
你是一个专业的教育评估专家。请根据以下学生的表现进行评估：

【剧本名称】：{{script_name}}
【学习目标】：{{learning_objectives}}
【对话记录】：
{{chat_history}}

【产出内容】：
{{output_content}}

【评估维度】：
1. 对话质量（30%）：提问的针对性、信息收集的完整性、沟通的专业性
2. 决策合理性（40%）：数据分析的准确性、决策依据的充分性、方案的可行性
3. 产出质量（30%）：内容的完整性、逻辑的清晰性、格式的规范性

请按照以下 JSON 格式输出评估结果：
{
  "dimension_scores": {
    "dialogue_quality": { "score": 85, "feedback": "..." },
    "decision_quality": { "score": 90, "feedback": "..." },
    "output_quality": { "score": 88, "feedback": "..." }
  },
  "total_score": 87.7,
  "overall_feedback": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}
```

**验收标准**：
- ✅ 评估逻辑正确，能生成合理的评分
- ✅ 评估结果格式正确
- ✅ 可通过 API 获取评估详情

---

### 3.3 前端任务分解

#### 3.3.1 包结构创建（优先级：P0）

**负责人**：前端开发
**预估时间**：1 天

**任务清单**：
- [ ] **Task 1.6.1**：创建 edu-learning 包
  - 目录：`frontend/packages/edu-learning/`
  - 文件：
    - `package.json`（依赖配置）
    - `tsconfig.json`（TypeScript 配置）
    - `eslint.config.js`（ESLint 配置）
    - `README.md`

- [ ] **Task 1.6.2**：创建 edu-common 包
  - 目录：`frontend/packages/edu-common/`
  - 共享组件和类型定义

- [ ] **Task 1.6.3**：注册到 Rush
  - 更新 `rush.json`
  - 运行 `rush update`

**验收标准**：
- ✅ 包可正常构建（`rush build`）
- ✅ 依赖安装成功

---

#### 3.3.2 剧本列表页（优先级：P0）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 1.7.1**：创建页面组件
  - 文件：`frontend/packages/edu-learning/src/pages/script-library/index.tsx`
  - 功能：
    - 展示剧本卡片（图标、标题、难度、时长、描述）
    - 搜索功能
    - 难度筛选
    - 场景分类筛选

- [ ] **Task 1.7.2**：创建自定义 Hook
  - 文件：`use-script-list.ts`
  - 功能：
    ```typescript
    const { scripts, loading, refetch } = useScriptList({
      spaceId,
      keyword,
      difficulty,
      category
    });
    ```

- [ ] **Task 1.7.3**：创建 API 调用
  - 文件：`frontend/packages/edu-learning/src/api/script-api.ts`
  - 使用 Axios 调用后端 API

**验收标准**：
- ✅ 页面正常渲染剧本列表
- ✅ 搜索和筛选功能正常
- ✅ 点击卡片可跳转到详情页

---

#### 3.3.3 剧本详情页（优先级：P0）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 1.8.1**：创建详情页组件
  - 文件：`script-detail/index.tsx`
  - 展示：
    - 头部（图标、标题、难度、时长）
    - 背景故事
    - 学习目标列表
    - 阶段流程（Steps 组件，垂直布局）
    - "开始学习"按钮

- [ ] **Task 1.8.2**："开始学习"确认弹窗
  - 使用 `@coze-arch/coze-design` 的 Modal 组件
  - 确认后调用 API 创建项目

- [ ] **Task 1.8.3**：i18n 配置
  - 添加翻译 key：
    ```
    edu_script_detail_title
    edu_script_start_learning
    edu_script_confirm_start
    edu_script_background
    edu_script_objectives
    edu_script_stages
    ```

**验收标准**：
- ✅ 详情页展示完整信息
- ✅ "开始学习"按钮点击后创建项目
- ✅ 创建成功后跳转到工作区

---

#### 3.3.4 剧本工作区（优先级：P0）

**负责人**：前端开发
**预估时间**：4 天

**任务清单**：
- [ ] **Task 1.9.1**：创建工作区布局
  - 文件：`script-workspace/index.tsx`
  - 三栏布局：
    ```
    ┌──────────┬────────────────────────┬────────────┐
    │ 任务面板  │      对话窗口           │  产出区     │
    │ 200px   │       flex: 1          │  400px     │
    └──────────┴────────────────────────┴────────────┘
    ```

- [ ] **Task 1.9.2**：任务面板组件
  - 文件：`components/task-panel.tsx`
  - 功能：
    - 显示当前阶段说明
    - 显示学习目标
    - 显示阶段列表（已完成/进行中/未开始）
    - 阶段切换（仅展示，不可手动切换）

- [ ] **Task 1.9.3**：对话窗口组件
  - 文件：`components/chat-window.tsx`
  - 功能：
    - 展示对话历史
    - 消息输入框
    - 发送按钮
    - 支持 Markdown 渲染
    - 流式输出（如果 Bot API 支持）

- [ ] **Task 1.9.4**：产出区组件
  - 文件：`components/output-editor.tsx`
  - 功能：
    - Markdown 编辑器（使用 `react-markdown-editor-lite` 或类似库）
    - 实时预览
    - 自动保存（30 秒一次）
    - "提交阶段成果"按钮

- [ ] **Task 1.9.5**：集成 Bot 对话 API
  - 调用 coze-studio 现有的 Bot API
  - 保存对话记录到后端

**验收标准**：
- ✅ 三栏布局正常，响应式适配
- ✅ 对话功能正常，Bot 回复正确
- ✅ 产出编辑器可正常编辑和保存
- ✅ 提交阶段成果后触发评估

---

#### 3.3.5 评估结果展示（优先级：P0）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 1.10.1**：创建评估面板组件
  - 文件：`components/evaluation-panel.tsx`
  - 功能：
    - 展示总分（大字号）
    - 展示各维度得分（进度条）
    - 展示 AI 反馈
    - 展示优点和改进建议

- [ ] **Task 1.10.2**：阶段评估弹窗
  - 完成阶段后自动弹出
  - 展示阶段评估结果
  - "继续下一阶段"按钮

- [ ] **Task 1.10.3**：最终评估页面
  - 完成所有阶段后展示
  - 综合评分
  - 各阶段详情
  - "查看我的项目"按钮

**验收标准**：
- ✅ 评估结果展示清晰美观
- ✅ 数据正确从 API 获取
- ✅ 交互流畅

---

#### 3.3.6 我的项目页（优先级：P1）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 1.11.1**：创建项目列表页
  - 文件：`my-projects/index.tsx`
  - 功能：
    - 展示项目卡片
    - 显示进度
    - 状态筛选（进行中/已完成/已放弃）
    - 类型筛选（剧本/模板/自主开发）

- [ ] **Task 1.11.2**：项目卡片组件
  - 显示项目基本信息
  - 显示进度百分比
  - "继续学习"或"查看详情"按钮

**验收标准**：
- ✅ 项目列表正常展示
- ✅ 筛选功能正常
- ✅ 点击项目可进入工作区

---

#### 3.3.7 路由配置（优先级：P0）

**负责人**：前端开发
**预估时间**：0.5 天

**任务清单**：
- [ ] **Task 1.12.1**：注册路由
  - 文件：`frontend/apps/coze-studio/src/routes/index.tsx`
  - 路由：
    ```typescript
    {
      path: '/space/:spaceId/edu/learning/scripts',
      element: <ScriptLibrary />
    },
    {
      path: '/space/:spaceId/edu/scripts/:scriptId',
      element: <ScriptDetail />
    },
    {
      path: '/space/:spaceId/edu/workspace/:projectId',
      element: <ScriptWorkspace />
    },
    {
      path: '/space/:spaceId/edu/projects/my',
      element: <MyProjects />
    }
    ```

**验收标准**：
- ✅ 所有路由可正常访问
- ✅ 路由参数正确传递

---

### 3.4 Sprint 1 验收标准

**必须满足（P0）**：
- ✅ 学生可以浏览剧本列表
- ✅ 学生可以查看剧本详情
- ✅ 学生可以开始一个剧本学习项目
- ✅ 学生可以与 Bot 对话
- ✅ 学生可以编辑和提交产出
- ✅ 学生可以完成所有阶段
- ✅ 学生可以查看 AI 评估结果
- ✅ 学生可以在"我的项目"中看到项目列表

**期望满足（P1）**：
- ✅ 页面 UI 美观，符合设计规范
- ✅ 交互流畅，无明显 bug
- ✅ 响应式设计，支持常见分辨率

---

## Sprint 2：模板定制 + 教师端基础（Week 3-4）

### 3.5 Sprint 目标

**核心目标**：
- 实现模板定制学习流程
- 建立教师端基础功能（班级、作业）
- 打通三阶段学习路径

**交付标准**：
- ✅ 学生能浏览模板、定制参数、生成 Bot
- ✅ 教师能创建班级、添加学生、布置作业
- ✅ 学生能查看作业并提交

---

### 3.6 后端任务分解

#### 3.6.1 模板相关表创建（优先级：P0）

**负责人**：后端开发
**预估时间**：1 天

**任务清单**：
- [ ] **Task 2.1.1**：创建表
  - `edu_templates`
  - `edu_classes`
  - `edu_class_members`
  - `edu_assignments`

- [ ] **Task 2.1.2**：测试数据
  - 测试模板：《社交媒体内容生成助手》
  - 测试班级：2024春季市场营销1班

**验收标准**：
- ✅ 表创建成功
- ✅ 测试数据插入成功

---

#### 3.6.2 模板 Domain 层（优先级：P0）

**负责人**：后端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 2.2.1**：创建 edutemplate 领域
  - `domain/edutemplate/entity/template.go`
  - `domain/edutemplate/repository/template_repository.go`
  - `domain/edutemplate/service/template_service.go`

- [ ] **Task 2.2.2**：模板复制逻辑
  - 从 `base_bot_id` 复制 Bot
  - 根据用户配置参数生成新的 Prompt
  - 创建新的 `bot_id` 并关联到项目

**验收标准**：
- ✅ 模板实体定义完整
- ✅ 复制逻辑正确，生成的 Bot 可用

---

#### 3.6.3 班级和作业 Domain 层（优先级：P0）

**负责人**：后端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 2.3.1**：创建 educlass 领域
  - `domain/educlass/entity/class.go`
  - `domain/educlass/entity/class_member.go`
  - `domain/educlass/entity/assignment.go`
  - `domain/educlass/repository/class_repository.go`
  - `domain/educlass/service/class_service.go`

- [ ] **Task 2.3.2**：班级管理逻辑
  - 创建班级（同时创建 Team Space）
  - 添加成员（同时添加到 Space）
  - 权限验证（只有教师可管理）

- [ ] **Task 2.3.3**：作业管理逻辑
  - 布置作业（关联剧本/模板/自主开发）
  - 查询学生作业提交情况
  - 作业截止时间处理

**验收标准**：
- ✅ 班级创建和成员管理正常
- ✅ 作业布置和查询正常

---

#### 3.6.4 模板和教师端 API（优先级：P0）

**负责人**：后端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 2.4.1**：模板 API
  ```
  GET  /api/space/:spaceId/edu/templates
  GET  /api/space/:spaceId/edu/templates/:id
  POST /api/space/:spaceId/edu/student/templates/start
  ```

- [ ] **Task 2.4.2**：教师端 API
  ```
  POST /api/space/:spaceId/edu/teacher/classes
  POST /api/space/:spaceId/edu/teacher/classes/:id/members
  GET  /api/space/:spaceId/edu/teacher/classes/:id
  POST /api/space/:spaceId/edu/teacher/assignments
  GET  /api/space/:spaceId/edu/teacher/assignments
  ```

**验收标准**：
- ✅ 所有 API 可正常调用
- ✅ 权限检查正确

---

### 3.7 前端任务分解

#### 3.7.1 模板库页面（优先级：P0）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 2.5.1**：模板列表页
  - 类似剧本列表，展示模板卡片
  - 难度、场景分类筛选

- [ ] **Task 2.5.2**：模板详情页
  - 展示模板说明
  - 展示可配置参数
  - "开始定制"按钮

**验收标准**：
- ✅ 模板列表和详情正常展示

---

#### 3.7.2 模板编辑器（优先级：P0）

**负责人**：前端开发
**预估时间**：3 天

**任务清单**：
- [ ] **Task 2.6.1**：参数配置界面
  - 根据 `configurable_params` JSON 动态生成表单
  - 支持 select、multiselect、textarea、switch 等类型

- [ ] **Task 2.6.2**：Prompt 预览
  - 实时生成 Prompt 预览
  - 展示参数如何影响 Prompt

- [ ] **Task 2.6.3**：Bot 测试窗口
  - 配置完成后可测试对话
  - 满意后点击"提交作品"

**验收标准**：
- ✅ 参数配置界面动态生成正确
- ✅ 可预览和测试 Bot
- ✅ 提交后创建项目

---

#### 3.7.3 教师端包创建（优先级：P0）

**负责人**：前端开发
**预估时间**：1 天

**任务清单**：
- [ ] **Task 2.7.1**：创建 edu-teacher 包
  - 目录：`frontend/packages/edu-teacher/`
  - 注册到 Rush

**验收标准**：
- ✅ 包可正常构建

---

#### 3.7.4 班级管理页面（优先级：P0）

**负责人**：前端开发
**预估时间**：3 天

**任务清单**：
- [ ] **Task 2.8.1**：班级列表页
  - 展示教师的所有班级
  - "创建班级"按钮

- [ ] **Task 2.8.2**：创建班级弹窗
  - 表单：班级名称、班级代码、课程名称、学期等
  - 创建成功后刷新列表

- [ ] **Task 2.8.3**：班级详情页
  - 展示班级信息
  - 学生列表
  - "添加学生"按钮
  - 作业列表

- [ ] **Task 2.8.4**：添加学生功能
  - 支持批量导入（CSV）
  - 支持手动添加

**验收标准**：
- ✅ 教师能创建班级
- ✅ 教师能添加学生
- ✅ 班级详情展示完整

---

#### 3.7.5 作业管理页面（优先级：P0）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 2.9.1**：作业列表页
  - 展示所有作业
  - 筛选（班级、状态）

- [ ] **Task 2.9.2**：布置作业弹窗
  - 选择作业类型（剧本/模板/自主开发）
  - 选择来源（剧本 ID/模板 ID）
  - 设置截止时间
  - 设置评分方式（自动/手动）

- [ ] **Task 2.9.3**：作业详情页
  - 展示作业信息
  - 学生提交列表
  - 提交状态统计

**验收标准**：
- ✅ 教师能布置作业
- ✅ 教师能查看作业提交情况

---

### 3.8 Sprint 2 验收标准

**必须满足（P0）**：
- ✅ 学生可以浏览和使用模板
- ✅ 学生可以定制模板参数
- ✅ 学生可以生成自己的 Bot
- ✅ 教师可以创建班级
- ✅ 教师可以添加学生
- ✅ 教师可以布置作业（三种类型）
- ✅ 学生可以查看作业列表

**期望满足（P1）**：
- ✅ 模板编辑器交互流畅
- ✅ 教师端页面美观易用

---

## Sprint 3：自主开发 + 评估系统（Week 5-6）

### 3.9 Sprint 目标

**核心目标**：
- 集成完整的 Bot 自主开发能力
- 完善评估系统（AI + 教师双轨）
- 实现教师端学生监控功能

**交付标准**：
- ✅ 学生能从零创建 Bot
- ✅ 教师能查看学生进度
- ✅ 教师能手动评估学生作品
- ✅ 数据统计功能可用

---

### 3.10 后端任务分解

#### 3.10.1 Bot 自主开发集成（优先级：P0）

**负责人**：后端开发
**预估时间**：1 天

**任务清单**：
- [ ] **Task 3.1.1**：自主开发 API
  ```
  POST /api/space/:spaceId/edu/student/bots/create
  ```
  - 创建空白 Bot
  - 创建 project_type=3 的项目
  - 关联 bot_id

- [ ] **Task 3.1.2**：复用现有 Bot API
  - 学生后续操作直接使用 coze-studio 的 Bot API
  - 保存 Bot 配置时同步更新项目状态

**验收标准**：
- ✅ 学生能创建自主开发项目
- ✅ 项目关联到真实的 Bot

---

#### 3.10.2 教师评估 API（优先级：P0）

**负责人**：后端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 3.2.1**：教师评估接口
  ```
  POST /api/space/:spaceId/edu/teacher/evaluations
  ```
  - 接收教师打分和评语
  - 保存到 `edu_evaluations` 表（evaluation_type=2）
  - 更新项目的 `teacher_score` 和 `teacher_comment`

- [ ] **Task 3.2.2**：综合评分计算
  - AI 评分 × 60% + 教师评分 × 40%（可配置）
  - 更新 `total_score`

**验收标准**：
- ✅ 教师能提交评估
- ✅ 综合评分计算正确

---

#### 3.10.3 学生监控 API（优先级：P0）

**负责人**：后端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 3.3.1**：学生进度查询
  ```
  GET /api/space/:spaceId/edu/teacher/students/:userId/progress
  ```
  - 返回学生的所有项目
  - 包含进度、状态、分数

- [ ] **Task 3.3.2**：班级统计数据
  ```
  GET /api/space/:spaceId/edu/teacher/classes/:id/statistics
  ```
  - 返回班级整体数据
  - 完成率、平均分、时长统计

**验收标准**：
- ✅ API 返回正确的学生进度数据
- ✅ 统计数据准确

---

### 3.11 前端任务分解

#### 3.11.1 Bot 自主开发页面（优先级：P0）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 3.4.1**：创建入口
  - 学习中心添加"创建智能体"按钮
  - 点击后创建项目并跳转到 Bot 编辑器

- [ ] **Task 3.4.2**：复用 agent-ide
  - 路由配置，复用现有的 Bot 开发界面
  - 确保项目关联正确

**验收标准**：
- ✅ 学生能进入 Bot 开发界面
- ✅ 开发的 Bot 关联到项目

---

#### 3.11.2 教师评估界面（优先级：P0）

**负责人**：前端开发
**预估时间**：2 天

**任务清单**：
- [ ] **Task 3.5.1**：评估编辑器
  - 展示学生作品（对话记录 + 产出内容 + Bot 配置）
  - 教师评分表单
  - 教师评语输入框
  - 各维度打分（可选）

- [ ] **Task 3.5.2**：评估提交
  - 提交后更新学生项目状态
  - 学生可查看教师评语

**验收标准**：
- ✅ 教师能查看学生作品
- ✅ 教师能提交评估

---

#### 3.11.3 学生监控页面（优先级：P0）

**负责人**：前端开发
**预估时间**：3 天

**任务清单**：
- [ ] **Task 3.6.1**：学生进度看板
  - 表格展示学生列表
  - 列：姓名、学号、作业完成数、平均分、最后活跃时间
  - 点击学生可查看详情

- [ ] **Task 3.6.2**：学生详情页
  - 展示学生的所有项目
  - 展示对话记录
  - 展示产出内容
  - "评估"按钮

- [ ] **Task 3.6.3**：班级统计图表
  - 使用 ECharts 或 Recharts
  - 完成率饼图
  - 分数分布柱状图
  - 学习时长趋势图

**验收标准**：
- ✅ 教师能查看所有学生进度
- ✅ 图表展示正确

---

### 3.12 Sprint 3 验收标准

**必须满足（P0）**：
- ✅ 学生能创建自主 Bot 项目
- ✅ 学生能使用完整的 Bot 开发功能
- ✅ 教师能查看学生进度
- ✅ 教师能手动评估学生作品
- ✅ 班级统计数据可用

**期望满足（P1）**：
- ✅ 学生监控页面数据可视化美观
- ✅ 评估界面易用

---

## Sprint 4：优化 + 测试 + 发布（Week 7-8）

### 3.13 Sprint 目标

**核心目标**：
- 完整流程测试
- 性能优化
- UI/UX 优化
- 文档编写
- 准备发布

**交付标准**：
- ✅ 无 P0/P1 级别 bug
- ✅ 性能指标达标
- ✅ 用户文档完善
- ✅ 可上线生产环境

---

### 3.14 任务分解

#### 3.14.1 完整流程测试（优先级：P0）

**负责人**：全员
**预估时间**：3 天

**测试场景**：
- [ ] **Scenario 1**：学生完整学习路径
  - 注册 → 登录 → 浏览剧本 → 开始学习 → 完成剧本 → 查看评估
  - 浏览模板 → 定制参数 → 生成 Bot → 测试 → 提交
  - 创建自主 Bot → 配置 Prompt → 测试 → 提交
  - 查看"我的项目"列表

- [ ] **Scenario 2**：教师完整教学路径
  - 登录 → 创建班级 → 添加学生 → 布置作业 → 查看提交 → 评估学生
  - 查看学生进度 → 查看统计数据

- [ ] **Scenario 3**：作业完整流程
  - 教师布置剧本作业 → 学生查看作业 → 学生完成 → 学生提交 → 教师评估

**Bug 追踪**：
- 使用 GitHub Issues 或 Jira
- 优先级：P0（严重）、P1（高）、P2（中）、P3（低）
- P0/P1 必须在 Sprint 4 内修复

**验收标准**：
- ✅ 所有 P0/P1 bug 修复
- ✅ 三个测试场景完整通过

---

#### 3.14.2 性能优化（优先级：P0）

**负责人**：后端 + 前端
**预估时间**：2 天

**后端优化**：
- [ ] **Task 4.1.1**：数据库查询优化
  - 添加必要的索引
  - 优化慢查询（使用 EXPLAIN 分析）
  - 关键查询：
    - 学生项目列表查询
    - 教师学生进度查询
    - 班级统计数据查询

- [ ] **Task 4.1.2**：API 响应时间优化
  - 目标：P95 < 500ms，P99 < 1s
  - 使用缓存（Redis）存储热点数据
  - 优化序列化/反序列化

**前端优化**：
- [ ] **Task 4.2.1**：代码分割
  - 使用 Rsbuild 的 splitChunks 配置
  - 懒加载路由组件

- [ ] **Task 4.2.2**：图片和资源优化
  - 压缩图片
  - 使用 WebP 格式
  - CDN 加速

- [ ] **Task 4.2.3**：首屏加载优化
  - 目标：FCP < 1.5s，LCP < 2.5s
  - 关键资源预加载
  - 减少首屏请求数

**性能指标**：
| 指标 | 目标 | 测量工具 |
|------|------|---------|
| API P95 响应时间 | < 500ms | Postman/压测工具 |
| 首屏 FCP | < 1.5s | Lighthouse |
| 首屏 LCP | < 2.5s | Lighthouse |
| 页面加载时间 | < 3s | Chrome DevTools |

**验收标准**：
- ✅ 所有性能指标达标

---

#### 3.14.3 UI/UX 优化（优先级：P1）

**负责人**：前端
**预估时间**：2 天

**任务清单**：
- [ ] **Task 4.3.1**：响应式设计
  - 支持 1920×1080、1366×768、1280×720
  - 关键页面适配

- [ ] **Task 4.3.2**：交互细节优化
  - 加载态（Skeleton、Spin）
  - 错误提示（Toast、Message）
  - 空状态设计
  - 按钮禁用态

- [ ] **Task 4.3.3**：无障碍优化
  - 语义化 HTML
  - ARIA 属性
  - 键盘导航

**验收标准**：
- ✅ 常见分辨率下页面显示正常
- ✅ 交互流畅，无明显体验问题

---

#### 3.14.4 文档编写（优先级：P0）

**负责人**：全员
**预估时间**：2 天

**文档清单**：
- [ ] **Doc 1**：用户使用手册（学生端）
  - 如何浏览和选择剧本
  - 如何完成剧本学习
  - 如何使用模板定制
  - 如何自主开发 Bot
  - 常见问题 FAQ

- [ ] **Doc 2**：教师操作指南
  - 如何创建班级
  - 如何布置作业
  - 如何查看学生进度
  - 如何评估学生作品

- [ ] **Doc 3**：技术文档
  - 架构设计文档（已有）
  - API 接口文档（Swagger/Postman）
  - 数据库 Schema 文档
  - 部署运维文档

- [ ] **Doc 4**：开发者文档
  - 本地开发环境搭建
  - 代码规范
  - 贡献指南

**验收标准**：
- ✅ 所有文档完整清晰
- ✅ 用户能通过文档快速上手

---

#### 3.14.5 部署准备（优先级：P0）

**负责人**：后端
**预估时间**：1 天

**任务清单**：
- [ ] **Task 4.5.1**：生产环境配置
  - 环境变量配置
  - 数据库连接（生产库）
  - Redis 配置
  - AI 模型配置

- [ ] **Task 4.5.2**：Docker 镜像构建
  - 后端镜像
  - 前端镜像（Nginx）
  - 推送到镜像仓库

- [ ] **Task 4.5.3**：数据库迁移脚本
  - 生产环境执行迁移
  - 数据备份

**验收标准**：
- ✅ 生产环境部署成功
- ✅ 所有服务正常运行

---

### 3.15 Sprint 4 验收标准

**必须满足（P0）**：
- ✅ 完整流程测试通过，无 P0/P1 bug
- ✅ 性能指标达标
- ✅ 用户文档和技术文档完整
- ✅ 生产环境部署成功

**期望满足（P1）**：
- ✅ UI/UX 优化完成
- ✅ 响应式设计良好

---

## 4. 任务依赖关系

### 4.1 Sprint 1 依赖图

```
数据库设计 (1.1)
    ↓
Domain 层实体 (1.2)
    ↓
┌───────────────────────┬───────────────────────┐
│ Application 层 (1.3)  │  前端包结构 (1.6)     │
└───────────────────────┘                       │
    ↓                                           ↓
API Handler (1.4) ──────────────────→  剧本列表 (1.7)
    ↓                                           ↓
AI 评估系统 (1.5)                        剧本详情 (1.8)
                                                ↓
                                         剧本工作区 (1.9)
                                                ↓
                                         评估展示 (1.10)
                                                ↓
                                         我的项目 (1.11)
```

**关键路径**：
1. 数据库 → Domain → Application → API → 前端页面
2. AI 评估系统可并行开发

---

### 4.2 Sprint 2 依赖图

```
模板表创建 (2.1)
    ↓
┌──────────────────────┬──────────────────────┐
│ 模板 Domain (2.2)    │ 班级 Domain (2.3)    │
└──────────────────────┴──────────────────────┘
    ↓                           ↓
模板 API (2.4) ────────→  教师端 API (2.4)
    ↓                           ↓
模板库页面 (2.5)          教师端包 (2.7)
    ↓                           ↓
模板编辑器 (2.6)          班级管理 (2.8)
                                ↓
                         作业管理 (2.9)
```

---

### 4.3 Sprint 3 依赖图

```
Bot 集成 (3.1) ──────→  自主开发页面 (3.4)

教师评估 API (3.2) ──→  评估界面 (3.5)

学生监控 API (3.3) ──→  监控页面 (3.6)
```

---

## 5. 风险管理

### 5.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| **Bot API 集成困难** | 中 | 高 | 提前调研 Bot API 文档，Sprint 1 先验证集成可行性 |
| **AI 评估效果不佳** | 中 | 中 | 准备多个 Prompt 模板，进行 A/B 测试 |
| **性能问题** | 低 | 高 | 提前进行性能测试，预留优化时间 |
| **数据库设计变更** | 低 | 中 | 使用迁移脚本，保持向后兼容 |
| **前端组件库兼容性** | 低 | 低 | 严格遵循 coze-design 规范 |

---

### 5.2 项目风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| **需求变更** | 中 | 高 | 锁定 MVP 范围，变更需求放入后续迭代 |
| **人员变动** | 低 | 高 | 及时交接，文档完善 |
| **时间延期** | 中 | 中 | 每周 Review，及时调整优先级 |
| **依赖服务不可用** | 低 | 中 | 准备降级方案（如 AI 评估失败时使用默认分数） |

---

### 5.3 风险应对计划

**高优先级风险**：
1. **Bot API 集成困难**
   - **预防**：Sprint 1 第一周完成集成验证
   - **应对**：如果集成困难，考虑简化对话功能或使用 mock 数据

2. **需求变更**
   - **预防**：与需求方明确 MVP 范围，签字确认
   - **应对**：变更需求记录到 Backlog，下个版本实现

---

## 6. 资源分配

### 6.1 团队配置建议

**推荐配置**（2 人团队）：
- **后端开发** × 1
- **前端开发** × 1

**理想配置**（3-4 人团队）：
- **后端开发** × 1-2
- **前端开发** × 1-2
- **测试** × 0.5（兼职）

---

### 6.2 工作量分配

| Sprint | 后端工作量 | 前端工作量 | 测试工作量 | 总计 |
|--------|-----------|-----------|-----------|------|
| **Sprint 1** | 13 天 | 13.5 天 | 1.5 天 | 28 天 |
| **Sprint 2** | 9 天 | 11 天 | 2 天 | 22 天 |
| **Sprint 3** | 5 天 | 7 天 | 2 天 | 14 天 |
| **Sprint 4** | 4 天 | 6 天 | 6 天 | 16 天 |
| **总计** | 31 天 | 37.5 天 | 11.5 天 | **80 天** |

**注**：2 人团队（1 后端 + 1 前端），实际工作日约 40 天（8 周 × 5 天），考虑并行开发和缓冲时间，6-8 周可完成。

---

## 7. 验收标准

### 7.1 功能验收（P0）

**学生端**：
- [ ] 学生能注册登录
- [ ] 学生能浏览剧本库
- [ ] 学生能查看剧本详情
- [ ] 学生能开始剧本学习并完成所有阶段
- [ ] 学生能查看 AI 评估结果
- [ ] 学生能浏览模板库
- [ ] 学生能定制模板参数并生成 Bot
- [ ] 学生能创建自主开发项目
- [ ] 学生能使用完整的 Bot 开发功能
- [ ] 学生能查看"我的项目"列表
- [ ] 学生能查看作业列表并提交

**教师端**：
- [ ] 教师能登录
- [ ] 教师能创建班级
- [ ] 教师能添加学生
- [ ] 教师能布置作业（三种类型）
- [ ] 教师能查看作业提交情况
- [ ] 教师能查看学生进度
- [ ] 教师能手动评估学生作品
- [ ] 教师能查看班级统计数据

---

### 7.2 性能验收（P0）

| 指标 | 目标 | 验收方法 |
|------|------|---------|
| API P95 响应时间 | < 500ms | JMeter 压测，100 并发 |
| 首屏 FCP | < 1.5s | Lighthouse，3G 网络 |
| 首屏 LCP | < 2.5s | Lighthouse，3G 网络 |
| 页面加载时间 | < 3s | Chrome DevTools |

---

### 7.3 质量验收（P1）

- [ ] 代码通过 ESLint 和 Prettier 检查
- [ ] 后端单元测试覆盖率 > 60%
- [ ] 前端关键功能有 E2E 测试
- [ ] 无 P0/P1 级别 bug
- [ ] 代码 Review 通过

---

## 8. 日常开发流程

### 8.1 每日站会（Daily Standup）

**时间**：每天上午 10:00
**时长**：15 分钟

**内容**：
1. 昨天完成了什么？
2. 今天计划做什么？
3. 遇到什么阻碍？

---

### 8.2 Sprint Review（每 2 周）

**参与人**：开发团队 + 产品负责人

**内容**：
1. Demo 已完成的功能
2. 验收是否达标
3. 收集反馈

---

### 8.3 Sprint Retrospective（每 2 周）

**参与人**：开发团队

**内容**：
1. 哪些做得好？
2. 哪些需要改进？
3. 下个 Sprint 的行动计划

---

### 8.4 代码提交规范

**Commit Message 格式**：
```
<type>(<scope>): <subject>

类型(type)：
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/配置

示例：
feat(edu-learning): 实现剧本列表页
fix(edu-teacher): 修复班级创建时的权限检查问题
docs(edu): 更新开发路线图
```

---

### 8.5 分支管理

```
main (生产分支)
  ↑
develop (开发分支)
  ↑
feature/sprint-1-script-learning (功能分支)
feature/sprint-1-evaluation (功能分支)
```

**流程**：
1. 从 develop 切出 feature 分支
2. 完成功能后提交 PR
3. Code Review 通过后合并到 develop
4. Sprint 结束后，develop 合并到 main

---

## 9. 附录

### 9.1 相关文档

- [技术架构设计](./edu-platform-technical-architecture.md)
- [需求文档](./education-platform-requirements.md)

### 9.2 工具和资源

**项目管理**：
- Jira / GitHub Projects

**设计**：
- Figma（UI 设计稿）

**文档**：
- Notion / Confluence

**沟通**：
- 钉钉 / 企业微信 / Slack

---

## 10. 总结

这份开发路线图为教育平台的 MVP 开发提供了详细的指导。通过 4 个 Sprint 的迭代开发，我们将在 6-8 周内交付一个完整可用的渐进式智能体开发教学平台。

**关键成功因素**：
1. 严格控制 MVP 范围，避免需求蔓延
2. 充分复用 coze-studio 现有能力，减少重复开发
3. 每周进行 Review，及时调整优先级
4. 保持高质量的代码和文档

**下一步行动**：
1. 组建开发团队
2. 确认开发环境和工具
3. 启动 Sprint 1

---

**路线图版本**：v1.0
**创建日期**：2026-02-04
**负责人**：hjy

---

> 💡 本路线图是可执行的详细计划，建议每周 Review 并根据实际进度调整。祝开发顺利！🚀
