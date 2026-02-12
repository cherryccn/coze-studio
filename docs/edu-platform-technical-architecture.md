# 教育平台技术架构设计方案

> **项目名称**：中教人机协同教育平台
> **版本**：v2.0（渐进式教学版）
> **创建日期**：2026-02-04
> **设计理念**：渐进式解锁真实智能体开发能力

---

## 📚 目录

- [1. 项目背景与目标](#1-项目背景与目标)
- [2. 整体架构设计](#2-整体架构设计)
- [3. 核心数据模型](#3-核心数据模型)
- [4. 后端 DDD 架构](#4-后端-ddd-架构)
- [5. 前端包结构设计](#5-前端包结构设计)
- [6. 三阶段学习流程](#6-三阶段学习流程)
- [7. 关键技术决策](#7-关键技术决策)
- [8. 开发路线图](#8-开发路线图)
- [9. API 接口设计](#9-api-接口设计)
- [10. 部署和运维](#10-部署和运维)

---

## 1. 项目背景与目标

### 1.1 项目背景

- **市场定位**：中教人机协同平台体系已在市场具备影响力，今年主推
- **教育目标**：作为商科专业数字化建设体系的一部分，面向无代码能力的学生提供低代码智能体开发能力
- **商业目标**：提升项目整体溢价，推动实训教学智能化

### 1.2 核心目标

支持**多场景、多用户角色、多空间协作**的渐进式智能体开发教学平台

### 1.3 目标用户

| 角色 | 核心需求 | 使用场景 |
|------|---------|---------|
| **学生** | 从零基础到独立开发智能体 | 剧本学习 → 模板定制 → 自主开发 |
| **教师** | 课程设计、作业管理、学生评估 | 创建剧本/模板、布置作业、监控进度、评分 |
| **平台管理员** | 平台管理、数据统计 | 学校管理、数据看板、系统配置 |

### 1.4 MVP 范围

**MVP 决策（基于 2026-02-04 讨论）**：
- ✅ **教学阶段**：同时实现三阶段（剧本引导 + 模板定制 + 自主开发）
- ✅ **首个场景**：市场营销 - 社交媒体运营助手
- ✅ **用户角色**：教师 + 学生（完整教学闭环）
- ✅ **功能范围**：P0 核心功能（详见后文）

---

## 2. 整体架构设计

### 2.1 架构分层图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (React + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  教师端                          学生端                           │
│  ├─ 剧本管理                     ├─ 学习中心（三阶段统一入口）    │
│  ├─ 班级管理                     │  ├─ 剧本引导学习               │
│  ├─ 学生监控                     │  ├─ 模板定制开发               │
│  └─ 数据统计                     │  └─ 自主智能体开发             │
│                                  │                               │
│  共享组件                         ├─ 我的作品                     │
│  ├─ 剧本工作区（对话+产出）       └─ 评估与反馈                   │
│  ├─ 模板编辑器（Bot 开发简化版）                                 │
│  └─ Bot 开发环境（完整版）        复用 coze-studio 组件            │
│                                  ├─ Bot 编辑器                   │
│                                  ├─ Workflow 编排器              │
│                                  └─ Plugin 管理                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP API
┌─────────────────────────────────────────────────────────────────┐
│                      后端层 (Go + Hertz)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  教育领域 (Domain)              核心领域（复用 coze-studio）      │
│  ├─ edu-script (剧本)           ├─ bot (Bot 开发)                │
│  ├─ edu-template (模板)         ├─ workflow (工作流)             │
│  ├─ edu-project (学习项目)      ├─ plugin (插件)                 │
│  ├─ edu-class (班级)            ├─ space (空间)                  │
│  └─ edu-evaluation (评估)       └─ permission (权限)             │
│                                                                   │
│  应用服务层 (Application)                                        │
│  ├─ 剧本学习服务                                                 │
│  ├─ 模板定制服务                                                 │
│  ├─ Bot 开发服务（复用）                                         │
│  ├─ 评估服务                                                     │
│  └─ 教学管理服务                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        数据层 (MySQL)                            │
├─────────────────────────────────────────────────────────────────┤
│  教育数据                        核心数据（已有）                 │
│  ├─ edu_scripts                 ├─ space                        │
│  ├─ edu_templates               ├─ space_user                   │
│  ├─ edu_student_projects        ├─ bot                          │
│  ├─ edu_classes                 ├─ workflow                     │
│  ├─ edu_class_members           └─ user                         │
│  ├─ edu_assignments                                             │
│  └─ edu_evaluations                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 三阶段教学架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        学习项目（统一抽象）                        │
│                      edu_student_projects                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ id, user_id, space_id, title, project_type, status...   │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓                    ↓                    ↓              │
│    project_type=1       project_type=2       project_type=3     │
│   剧本引导项目           模板定制项目          自主开发项目        │
└─────────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ 剧本数据      │      │ 模板数据      │      │ Bot 数据      │
├──────────────┤      ├──────────────┤      ├──────────────┤
│edu_scripts   │      │edu_templates │      │bot (复用)    │
│  - stages    │      │  - base_bot  │      │workflow      │
│  - bots      │      │  - params    │      │plugin        │
│  - eval      │      │  - guide     │      │(完整开发)    │
└──────────────┘      └──────────────┘      └──────────────┘

脚手架程度：       80% 脚手架          50% 脚手架          10% 脚手架
学生创造：         20% 学生            50% 学生            90% 学生
学习曲线：         ★☆☆☆☆            ★★★☆☆            ★★★★☆
```

### 2.3 技术栈

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| **前端** | React 18.2 | UI 框架 |
| | TypeScript 5.8 | 类型安全 |
| | @coze-arch/coze-design | UI 组件库 |
| | Rush.js | Monorepo 管理 |
| | Zustand | 状态管理 |
| | @coze-arch/i18n | 国际化 |
| **后端** | Go 1.24 | 编程语言 |
| | Hertz | HTTP 框架 |
| | GORM | ORM 框架 |
| | DDD | 领域驱动设计 |
| **数据库** | MySQL 8.4.5 | 关系型数据库 |
| **AI** | Ollama / OpenAI | AI 模型（对话、评估） |
| | coze-studio Bot API | Bot 对话能力（复用） |
| **部署** | Docker Compose | 容器编排 |
| | Nginx | 反向代理 |

---

## 3. 核心数据模型

### 3.1 ER 图

```
┌─────────────────┐
│   edu_classes   │  班级表
│─────────────────│
│ id (PK)         │
│ space_id (FK)   │◄─────────┐
│ teacher_id      │          │
│ name            │          │
│ code            │          │
└─────────────────┘          │
         │                   │
         │ 1:N               │
         ▼                   │
┌─────────────────┐          │
│edu_class_members│  成员表   │
│─────────────────│          │
│ id (PK)         │          │
│ class_id (FK)   │          │
│ user_id (FK)    │          │
│ role_type       │          │
└─────────────────┘          │
                             │
┌─────────────────┐          │
│edu_assignments  │  作业表   │
│─────────────────│          │
│ id (PK)         │          │
│ class_id (FK)   │──────────┘
│ assignment_type │
│ source_id       │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│ edu_student_        │
│ projects            │  学习项目表（核心）
│─────────────────────│
│ id (PK)            │
│ user_id (FK)       │
│ space_id (FK)      │
│ class_id (FK)      │
│ assignment_id (FK) │
│ project_type       │◄────┐  1=剧本 2=模板 3=自主开发
│ source_id          │     │
│ bot_id (FK)        │     │
│ current_stage      │     │
│ status             │     │
│ total_score        │     │
└─────────────────────┘     │
         │                  │
         │ 1:N              │
         ▼                  │
┌─────────────────────┐     │
│ edu_evaluations     │     │
│─────────────────────│     │
│ id (PK)            │     │
│ project_id (FK)    │     │
│ evaluation_type    │     │
│ dimension_scores   │     │
│ total_score        │     │
│ feedback           │     │
└─────────────────────┘     │
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│edu_scripts   │  │edu_templates │  │bot (复用)    │
│──────────────│  │──────────────│  │──────────────│
│ id (PK)      │  │ id (PK)      │  │ id (PK)      │
│ name         │  │ name         │  │ name         │
│ stages (JSON)│  │ base_bot_id  │  │ prompt       │
│ difficulty   │  │ config_params│  │ workflow     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 3.2 核心表结构

#### 3.2.1 edu_student_projects（学习项目统一表）

```sql
CREATE TABLE `edu_student_projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '学生ID',
  `space_id` BIGINT UNSIGNED NOT NULL COMMENT '所属空间ID（班级空间或个人空间）',
  `class_id` BIGINT UNSIGNED COMMENT '所属班级ID（如果是作业）',
  `assignment_id` BIGINT UNSIGNED COMMENT '所属作业ID（如果是作业）',

  -- 项目类型和来源
  `project_type` TINYINT NOT NULL COMMENT '项目类型：1=剧本引导 2=模板定制 3=自主开发',
  `source_id` BIGINT UNSIGNED NOT NULL COMMENT '来源ID（script_id/template_id/0）',

  -- 基本信息
  `title` VARCHAR(200) NOT NULL COMMENT '项目标题',
  `description` TEXT COMMENT '项目描述',

  -- 关联的 Bot（所有类型最终都会生成 Bot）
  `bot_id` BIGINT UNSIGNED COMMENT '关联的 Bot ID（模板和自主开发阶段）',

  -- 进度和状态
  `current_stage` INT DEFAULT 1 COMMENT '当前阶段（仅剧本类型使用）',
  `status` VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    COMMENT '状态：in_progress/completed/abandoned',

  -- 评估相关
  `total_score` DECIMAL(5,2) COMMENT '总分（百分制）',
  `teacher_comment` TEXT COMMENT '教师评语',
  `teacher_score` DECIMAL(5,2) COMMENT '教师打分',

  -- 时间戳
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  `submitted_at` TIMESTAMP NULL COMMENT '提交时间（作业）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_user_space` (`user_id`, `space_id`),
  KEY `idx_class_assignment` (`class_id`, `assignment_id`),
  KEY `idx_project_type` (`project_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='学生学习项目表（支持三种类型）';
```

#### 3.2.2 edu_templates（模板表）

```sql
CREATE TABLE `edu_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `space_id` BIGINT UNSIGNED NOT NULL COMMENT '所属空间ID',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',

  -- 基本信息
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `name_en` VARCHAR(100) COMMENT '英文名称',
  `description` TEXT NOT NULL COMMENT '模板描述',
  `icon` VARCHAR(255) COMMENT '图标URL',

  -- 分类
  `scenario_category` VARCHAR(50) DEFAULT 'marketing' COMMENT '场景分类',
  `difficulty_level` TINYINT DEFAULT 2 COMMENT '难度等级',

  -- 关联的基础 Bot
  `base_bot_id` BIGINT UNSIGNED NOT NULL COMMENT '基础Bot ID（学生从此复制）',

  -- 可配置参数（JSON）
  `configurable_params` JSON COMMENT '可配置的参数列表',
  /* 示例：
  {
    "prompts": [
      {
        "key": "brand_tone",
        "label": "品牌调性",
        "type": "select",
        "options": ["专业", "活泼", "幽默"],
        "default": "专业"
      }
    ],
    "workflows": [
      {
        "key": "content_types",
        "label": "内容类型",
        "type": "multiselect",
        "options": ["文章", "短视频脚本", "海报文案"]
      }
    ]
  }
  */

  -- 引导内容
  `guide_content` TEXT COMMENT '使用指南（Markdown）',
  `learning_objectives` JSON COMMENT '学习目标数组',

  -- 评估标准
  `evaluation_criteria` JSON COMMENT '评估维度',

  -- 可见性
  `visibility` ENUM('private','team','public') NOT NULL DEFAULT 'team',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=删除 1=正常',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_space_id` (`space_id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_category` (`scenario_category`),
  KEY `idx_visibility` (`visibility`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='学习模板表';
```

#### 3.2.3 edu_classes（班级表）

```sql
CREATE TABLE `edu_classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `space_id` BIGINT UNSIGNED NOT NULL COMMENT '所属空间ID（班级空间）',
  `teacher_id` BIGINT UNSIGNED NOT NULL COMMENT '授课教师ID',

  -- 基本信息
  `name` VARCHAR(100) NOT NULL COMMENT '班级名称（如：2024春季市场营销1班）',
  `code` VARCHAR(50) COMMENT '班级代码（如：MKT2024S01）',
  `description` TEXT COMMENT '班级描述',

  -- 课程信息
  `course_name` VARCHAR(100) COMMENT '课程名称',
  `semester` VARCHAR(50) COMMENT '学期',
  `academic_year` VARCHAR(20) COMMENT '学年',

  -- 时间
  `start_date` DATE COMMENT '开课日期',
  `end_date` DATE COMMENT '结课日期',

  -- 状态
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=进行中 2=已结束 0=已删除',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_space_id` (`space_id`),
  KEY `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='班级表';
```

#### 3.2.4 edu_class_members（班级成员表）

```sql
CREATE TABLE `edu_class_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL COMMENT '班级ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role_type` TINYINT NOT NULL DEFAULT 3 COMMENT '角色：1=教师 2=助教 3=学生',

  -- 学生信息
  `student_number` VARCHAR(50) COMMENT '学号',
  `student_name` VARCHAR(100) COMMENT '学生姓名',

  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_user` (`class_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='班级成员表';
```

#### 3.2.5 edu_assignments（作业表）

```sql
CREATE TABLE `edu_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL COMMENT '班级ID',
  `teacher_id` BIGINT UNSIGNED NOT NULL COMMENT '发布教师ID',

  -- 基本信息
  `title` VARCHAR(200) NOT NULL COMMENT '作业标题',
  `description` TEXT COMMENT '作业说明',

  -- 作业类型和来源
  `assignment_type` TINYINT NOT NULL COMMENT '作业类型：1=剧本作业 2=模板作业 3=自主开发作业',
  `source_id` BIGINT UNSIGNED COMMENT '来源ID（script_id/template_id/0）',

  -- 时间要求
  `start_time` TIMESTAMP NOT NULL COMMENT '开始时间',
  `due_time` TIMESTAMP NOT NULL COMMENT '截止时间',

  -- 评估配置
  `auto_evaluate` TINYINT DEFAULT 1 COMMENT '是否自动评估：1=是 0=否',
  `max_score` DECIMAL(5,2) DEFAULT 100.00 COMMENT '满分',

  -- 状态
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=进行中 2=已结束 0=已删除',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='作业表';
```

#### 3.2.6 edu_evaluations（评估表）

```sql
CREATE TABLE `edu_evaluations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL COMMENT '项目ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '被评估学生ID',

  -- 评估类型
  `evaluation_type` TINYINT NOT NULL COMMENT '评估类型：1=AI自动评估 2=教师评估',
  `evaluator_id` BIGINT UNSIGNED COMMENT '评估者ID（教师）',

  -- 评估维度（JSON）
  `dimension_scores` JSON COMMENT '各维度得分',
  /* 示例：
  {
    "dialogue_quality": { "score": 85, "max": 100, "weight": 0.3 },
    "content_quality": { "score": 90, "max": 100, "weight": 0.4 },
    "creativity": { "score": 80, "max": 100, "weight": 0.3 }
  }
  */

  -- 总分
  `total_score` DECIMAL(5,2) NOT NULL COMMENT '总分',
  `max_score` DECIMAL(5,2) DEFAULT 100.00 COMMENT '满分',

  -- 反馈
  `feedback` TEXT COMMENT '评估反馈',
  `strengths` JSON COMMENT '优点列表',
  `improvements` JSON COMMENT '改进建议列表',

  `evaluated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='评估结果表';
```

#### 3.2.7 edu_scripts 扩展（已有表，添加字段）

```sql
-- 在现有 edu_scripts 表基础上扩展
ALTER TABLE `edu_scripts`
  ADD COLUMN `learning_stage` TINYINT DEFAULT 1
    COMMENT '适用学习阶段：1=入门(剧本引导) 2=进阶(模板定制) 3=高级(自主开发)',
  ADD COLUMN `scenario_category` VARCHAR(50) DEFAULT 'marketing'
    COMMENT '场景分类：marketing/finance/ecommerce/hr等',
  ADD COLUMN `difficulty_level` TINYINT DEFAULT 2
    COMMENT '难度等级：1=简单 2=中等 3=困难';
```

---

## 4. 后端 DDD 架构

### 4.1 Domain 层设计

```
backend/domain/
├── edulearning/                    # 教育学习领域（新增）
│   ├── entity/
│   │   ├── student_project.go     # 学习项目实体（三种类型统一）
│   │   ├── script_project.go      # 剧本项目扩展
│   │   ├── template_project.go    # 模板项目扩展
│   │   └── bot_project.go         # Bot 项目扩展
│   ├── repository/
│   │   ├── project_repository.go  # 项目仓储接口
│   │   └── evaluation_repository.go
│   └── service/
│       ├── learning_service.go    # 学习服务（统一入口）
│       ├── script_learning.go     # 剧本学习逻辑
│       ├── template_learning.go   # 模板学习逻辑
│       └── evaluation_service.go  # 评估服务
│
├── eduscript/                      # 剧本领域（已有，扩展）
│   ├── entity/script.go
│   ├── repository/script_repository.go
│   └── service/script_service.go
│
├── edutemplate/                    # 模板领域（新增）
│   ├── entity/template.go
│   ├── repository/template_repository.go
│   └── service/template_service.go
│
├── educlass/                       # 班级领域（新增）
│   ├── entity/
│   │   ├── class.go
│   │   ├── class_member.go
│   │   └── assignment.go
│   ├── repository/
│   │   ├── class_repository.go
│   │   └── assignment_repository.go
│   └── service/
│       ├── class_service.go
│       └── assignment_service.go
│
└── bot/                            # Bot 领域（复用现有）
    ├── entity/bot.go
    ├── repository/bot_repository.go
    └── service/bot_service.go
```

### 4.2 Application 层设计

```
backend/application/
├── edulearning/                    # 教育学习应用服务
│   ├── learning_app.go            # 学习服务（协调三种类型）
│   ├── script_learning_app.go     # 剧本学习应用服务
│   ├── template_learning_app.go   # 模板学习应用服务
│   └── evaluation_app.go          # 评估应用服务
│
├── eduteacher/                     # 教师端应用服务
│   ├── script_manage_app.go       # 剧本管理
│   ├── template_manage_app.go     # 模板管理
│   ├── class_manage_app.go        # 班级管理
│   ├── assignment_manage_app.go   # 作业管理
│   └── student_monitor_app.go     # 学生监控
│
└── bot/                            # Bot 应用服务（复用）
    └── bot_app.go
```

### 4.3 API 层设计

```
backend/api/
├── handler/edu/
│   ├── learning_handler.go        # 学生端学习接口
│   ├── teacher_handler.go         # 教师端接口
│   ├── script_handler.go          # 剧本接口
│   ├── template_handler.go        # 模板接口
│   └── evaluation_handler.go      # 评估接口
│
└── router/edu/
    └── api.go                      # 路由注册
```

---

## 5. 前端包结构设计

### 5.1 Rush Monorepo 结构

```
frontend/packages/
├── edu-learning/                   # Level-3：学生端学习模块（新增）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── learning-center/   # 学习中心（三阶段统一入口）
│   │   │   ├── script-learning/   # 剧本学习页面
│   │   │   ├── template-learning/ # 模板定制页面
│   │   │   ├── bot-development/   # 自主开发页面（复用 bot-ide）
│   │   │   └── my-projects/       # 我的作品
│   │   ├── components/
│   │   │   ├── script-workspace/  # 剧本工作区
│   │   │   ├── template-editor/   # 模板编辑器
│   │   │   └── evaluation-panel/  # 评估面板
│   │   ├── hooks/
│   │   │   ├── use-project-list.ts
│   │   │   ├── use-script-learning.ts
│   │   │   └── use-evaluation.ts
│   │   └── index.tsx
│   └── package.json
│
├── edu-teacher/                    # Level-3：教师端管理模块（新增）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── class-manage/      # 班级管理
│   │   │   ├── assignment-manage/ # 作业管理
│   │   │   ├── student-monitor/   # 学生监控
│   │   │   ├── script-manage/     # 剧本管理
│   │   │   └── template-manage/   # 模板管理
│   │   ├── components/
│   │   │   ├── class-card/
│   │   │   ├── student-progress/
│   │   │   └── evaluation-editor/
│   │   └── index.tsx
│   └── package.json
│
├── edu-common/                     # Level-2：教育平台共享组件（新增）
│   ├── src/
│   │   ├── components/
│   │   │   ├── stage-indicator/   # 阶段指示器
│   │   │   ├── difficulty-badge/  # 难度徽章
│   │   │   └── score-display/     # 分数显示
│   │   ├── hooks/
│   │   │   └── use-edu-context.ts
│   │   └── types/
│   │       └── index.ts           # 共享类型定义
│   └── package.json
│
├── agent-ide/                      # Level-3：Bot 开发 IDE（复用）
│   └── ...                         # 自主开发阶段复用此包
│
└── workflow/                       # Level-3：Workflow 编排（复用）
    └── ...                         # 模板和自主开发阶段复用
```

### 5.2 前端路由设计

```typescript
// frontend/apps/coze-studio/src/routes/index.tsx

const eduRoutes = [
  // 学生端路由
  {
    path: '/space/:spaceId/edu/learning',
    element: <LearningCenter />,                    // 学习中心
    children: [
      { path: 'scripts', element: <ScriptLibrary /> },         // 剧本库
      { path: 'templates', element: <TemplateLibrary /> },     // 模板库
      { path: 'bots', element: <BotLibrary /> },              // Bot 库（自主开发）
    ]
  },
  {
    path: '/space/:spaceId/edu/script/:scriptId',
    element: <ScriptLearningPage />                 // 剧本学习页
  },
  {
    path: '/space/:spaceId/edu/template/:templateId',
    element: <TemplateLearningPage />               // 模板定制页
  },
  {
    path: '/space/:spaceId/edu/bot/create',
    element: <BotDevelopmentPage />                 // 自主开发页（复用 bot-ide）
  },
  {
    path: '/space/:spaceId/edu/projects/my',
    element: <MyProjectsPage />                     // 我的作品
  },

  // 教师端路由
  {
    path: '/space/:spaceId/edu/teacher/classes',
    element: <ClassManagePage />                    // 班级管理
  },
  {
    path: '/space/:spaceId/edu/teacher/assignments',
    element: <AssignmentManagePage />               // 作业管理
  },
  {
    path: '/space/:spaceId/edu/teacher/students',
    element: <StudentMonitorPage />                 // 学生监控
  },
  {
    path: '/space/:spaceId/edu/teacher/scripts',
    element: <ScriptManagePage />                   // 剧本管理
  },
  {
    path: '/space/:spaceId/edu/teacher/templates',
    element: <TemplateManagePage />                 // 模板管理
  },
];
```

---

## 6. 三阶段学习流程

### 6.1 阶段 1：剧本引导学习

**目标**：建立信心，理解智能体基本概念

**学生体验流程**：
```
1. 进入学习中心 → 浏览剧本库
2. 选择剧本（如《品牌社交媒体内容策划》）
3. 查看剧本详情（背景、目标、阶段）
4. 点击"开始学习"
5. 进入剧本工作区
   ├─ 左侧：任务面板（当前阶段说明）
   ├─ 中间：对话窗口（与 Bot 交互）
   └─ 右侧：产出区（Markdown 编辑器）
6. 完成各阶段任务
7. 提交最终作品
8. 查看 AI 评估 + 教师评语
```

**技术实现**：
- 复用现有的 `edu_scripts` 表
- 对话使用 coze-studio 的 Bot API
- 评估调用 AI 模型（Ollama/OpenAI）
- `project_type = 1`

**示例剧本：《品牌社交媒体内容策划》**
```json
{
  "name": "品牌社交媒体内容策划",
  "scenario_category": "marketing",
  "difficulty_level": 1,
  "learning_objectives": [
    "理解智能体如何辅助内容创作",
    "掌握 Prompt 基本概念",
    "学习用户画像和内容定位"
  ],
  "stages": [
    {
      "order": 1,
      "name": "用户画像分析",
      "description": "与数据分析师 Bot 协作，分析目标用户特征",
      "duration": 30,
      "bot_id": 123,
      "tasks": [
        "定义目标用户年龄、性别、职业",
        "分析用户兴趣和痛点",
        "总结用户画像关键特征"
      ],
      "output_type": "markdown",
      "output_template": "《目标用户画像分析.md》"
    },
    {
      "order": 2,
      "name": "内容选题策划",
      "description": "基于用户画像，策划 3 个内容选题",
      "duration": 40,
      "bot_id": 124,
      "tasks": [
        "结合热点和用户兴趣提出选题",
        "分析每个选题的吸引力",
        "确定最佳选题"
      ],
      "output_type": "markdown",
      "output_template": "《内容选题方案.md》"
    },
    {
      "order": 3,
      "name": "文案创作",
      "description": "使用智能体辅助创作小红书文案",
      "duration": 50,
      "bot_id": 125,
      "tasks": [
        "与文案 Bot 协作生成初稿",
        "优化标题和开头",
        "完善文案并添加话题标签"
      ],
      "output_type": "markdown",
      "output_template": "《小红书文案终稿.md》"
    }
  ],
  "evaluation_criteria": {
    "dimensions": [
      { "name": "用户理解", "weight": 0.3 },
      { "name": "选题质量", "weight": 0.3 },
      { "name": "文案创意", "weight": 0.4 }
    ]
  }
}
```

### 6.2 阶段 2：模板定制开发

**目标**：掌握 Prompt 编写、Workflow 基础

**学生体验流程**：
```
1. 进入学习中心 → 浏览模板库
2. 选择模板（如《社交媒体内容生成助手》）
3. 查看模板说明和可配置参数
4. 点击"开始定制"
5. 进入模板编辑器
   ├─ 引导式配置界面
   │  ├─ 品牌调性选择（单选）
   │  ├─ 内容类型选择（多选）
   │  └─ 目标用户画像（文本输入）
   ├─ 简化的 Prompt 编辑器
   └─ 预览测试窗口
6. 完成配置和测试
7. 提交作品
8. 查看评估
```

**技术实现**：
- 新增 `edu_templates` 表
- 模板基于 `base_bot_id` 复制生成新 Bot
- 使用 Bot 编辑器的简化版（只开放部分功能）
- 参数配置通过表单生成 Prompt
- `project_type = 2`，关联 `bot_id`

**示例模板：《社交媒体内容生成助手》**
```json
{
  "name": "社交媒体内容生成助手",
  "scenario_category": "marketing",
  "difficulty_level": 2,
  "base_bot_id": 456,
  "configurable_params": {
    "prompts": [
      {
        "key": "brand_tone",
        "label": "品牌调性",
        "type": "select",
        "options": ["专业严谨", "年轻活泼", "幽默风趣", "温馨亲切"],
        "default": "专业严谨",
        "help_text": "选择符合你的品牌形象的文案风格"
      },
      {
        "key": "target_audience",
        "label": "目标用户",
        "type": "textarea",
        "placeholder": "例如：25-35岁职场女性，关注时尚和生活品质",
        "help_text": "详细描述你的目标用户画像"
      },
      {
        "key": "content_types",
        "label": "内容类型",
        "type": "multiselect",
        "options": ["产品介绍", "用户故事", "行业资讯", "使用教程", "活动预告"],
        "default": ["产品介绍"],
        "help_text": "选择你需要生成的内容类型（可多选）"
      }
    ],
    "workflows": [
      {
        "key": "enable_seo",
        "label": "SEO 优化",
        "type": "switch",
        "default": true,
        "help_text": "自动添加关键词和话题标签"
      }
    ]
  },
  "guide_content": "# 使用指南\n\n本模板帮助你快速创建社交媒体内容生成助手...",
  "learning_objectives": [
    "学习如何配置 Bot 的基本参数",
    "理解 Prompt 如何影响生成效果",
    "掌握简单的 Workflow 编排"
  ]
}
```

### 6.3 阶段 3：自主 Bot 开发

**目标**：独立开发智能体，解决真实问题

**学生体验流程**：
```
1. 进入学习中心 → 点击"创建智能体"
2. 选择场景类型（或从空白开始）
3. 进入完整的 Bot 开发环境（复用 coze-studio）
   ├─ Bot 基本信息配置
   ├─ Prompt 编写
   ├─ Workflow 编排
   ├─ Plugin 集成
   ├─ Knowledge 配置
   └─ 测试和调试
4. 发布 Bot
5. 提交作品
6. 查看评估
```

**技术实现**：
- 完全复用 coze-studio 的 Bot 开发能力
- `project_type = 3`，直接关联真实 `bot_id`
- 教师可查看学生的 Bot 配置和对话日志
- 评估基于 Bot 的完整性、创新性、实用性

---

## 7. 关键技术决策

### 7.1 架构设计决策

| 决策点 | 方案 | 理由 |
|--------|------|------|
| **项目数据模型** | 统一表 `edu_student_projects` + `project_type` 区分 | 便于统一管理和查询，支持三阶段流转 |
| **Bot 关联** | 模板和自主开发阶段关联真实 `bot_id` | 学生产出是真实可用的 Bot，不是模拟 |
| **前端复用** | 自主开发阶段直接复用 `agent-ide` 包 | 避免重复开发，学生学习真实工具 |
| **空间管理** | 班级 = Team Space，个人 = Personal Space | 复用现有 Space 系统，最小化改动 |
| **权限控制** | 复用 `permission` 系统 + 新增教师/学生角色 | 保持架构一致性 |
| **评估系统** | AI 自动评估 + 教师手动评估双轨制 | 提高效率同时保证质量 |

### 7.2 技术复用率

| 模块 | 复用现有 coze-studio | 新增开发 | 复用率 |
|------|---------------------|---------|--------|
| **Space 系统** | ✅ 完全复用 | - | 100% |
| **Bot 开发** | ✅ 完全复用 | - | 100% |
| **Workflow** | ✅ 完全复用 | - | 100% |
| **Permission** | ✅ 复用框架 | 新增教育角色 | 90% |
| **前端组件** | ✅ 复用 coze-design | 新增教育专用组件 | 70% |
| **后端架构** | ✅ 复用 DDD 框架 | 新增教育领域 | 60% |
| **数据库** | ✅ 复用 user/space 表 | 新增教育表 | 50% |

**总体复用率**：约 70-75%

---

## 8. 开发路线图

### 8.1 四个 Sprint 规划（6-8 周）

#### Sprint 1（Week 1-2）：基础设施 + 剧本引导

**目标**：搭建基础框架，完成剧本学习完整流程

**后端任务**：
- [ ] 创建数据库表（edu_student_projects, edu_scripts 扩展, edu_evaluations）
- [ ] Domain 层实体定义
  - [ ] StudentProject 实体
  - [ ] ScriptProject 扩展
  - [ ] Evaluation 实体
- [ ] Repository 接口和实现
  - [ ] ProjectRepository
  - [ ] EvaluationRepository
- [ ] 剧本学习 API
  - [ ] POST /student/scripts/start - 开始剧本学习
  - [ ] GET /student/projects/:id - 获取项目详情
  - [ ] POST /student/projects/:id/submit - 提交项目
  - [ ] POST /evaluations/auto - AI 自动评估

**前端任务**：
- [ ] 创建前端包结构
  - [ ] edu-learning 包
  - [ ] edu-common 包
- [ ] 剧本学习页面
  - [ ] 剧本库列表
  - [ ] 剧本详情页
  - [ ] 剧本工作区（对话 + 产出）
- [ ] 我的项目页面
- [ ] 评估结果展示

**交付物**：
- ✅ 学生能浏览剧本、开始学习、完成对话、提交作品、查看评估
- ✅ 完整的剧本引导学习流程可用

---

#### Sprint 2（Week 3-4）：模板定制 + 教师端基础

**目标**：实现模板系统，建立教师端基础功能

**后端任务**：
- [ ] 创建模板相关表（edu_templates, edu_classes, edu_class_members）
- [ ] Domain 层扩展
  - [ ] Template 实体
  - [ ] Class 实体
  - [ ] Assignment 实体
- [ ] 模板学习 API
  - [ ] GET /templates - 模板列表
  - [ ] POST /student/templates/start - 开始模板定制
  - [ ] POST /student/bots/create-from-template - 从模板创建 Bot
- [ ] 教师端 API
  - [ ] POST /teacher/classes - 创建班级
  - [ ] POST /teacher/classes/:id/members - 添加成员
  - [ ] POST /teacher/assignments - 布置作业

**前端任务**：
- [ ] 创建 edu-teacher 包
- [ ] 模板学习页面
  - [ ] 模板库列表
  - [ ] 模板详情页
  - [ ] 模板编辑器（参数配置界面）
- [ ] 教师端页面
  - [ ] 班级管理
  - [ ] 作业发布
  - [ ] 学生列表

**交付物**：
- ✅ 学生能浏览模板、定制参数、生成 Bot
- ✅ 教师能创建班级、添加学生、布置作业

---

#### Sprint 3（Week 5-6）：自主开发 + 评估系统

**目标**：集成 Bot 开发，完善评估功能

**后端任务**：
- [ ] Bot 开发集成
  - [ ] POST /student/bots/create - 创建自主开发项目
  - [ ] 关联现有 Bot API
- [ ] 评估系统完善
  - [ ] AI 评估引擎（多维度评分）
  - [ ] POST /teacher/evaluations - 教师评估
  - [ ] GET /student/projects/:id/evaluation - 获取评估详情
- [ ] 教师端高级功能
  - [ ] GET /teacher/students/:id/progress - 学生进度监控
  - [ ] GET /teacher/classes/:id/statistics - 班级数据统计

**前端任务**：
- [ ] Bot 自主开发页面（复用 agent-ide）
- [ ] 评估面板组件
  - [ ] AI 评估结果展示
  - [ ] 教师评语编辑器
- [ ] 教师端监控页面
  - [ ] 学生进度看板
  - [ ] 数据统计图表

**交付物**：
- ✅ 学生能创建自主 Bot 项目
- ✅ 完整的评估系统（AI + 教师）
- ✅ 教师能监控学生进度和数据

---

#### Sprint 4（Week 7-8）：优化 + 测试

**目标**：完整流程测试，性能优化，UI/UX 优化

**任务**：
- [ ] 完整流程测试
  - [ ] 学生从剧本 → 模板 → 自主开发的完整路径
  - [ ] 教师从创建班级 → 布置作业 → 评估的完整路径
- [ ] 性能优化
  - [ ] 数据库查询优化（索引）
  - [ ] 前端加载优化（代码分割）
  - [ ] AI 评估响应时间优化
- [ ] UI/UX 优化
  - [ ] 移动端适配
  - [ ] 交互细节优化
  - [ ] 错误提示完善
- [ ] 文档编写
  - [ ] 用户使用手册
  - [ ] 教师操作指南
  - [ ] 技术文档完善

**交付物**：
- ✅ 完整可用的教育平台
- ✅ 用户文档和技术文档

---

## 9. API 接口设计

### 9.1 学生端 API

#### 9.1.1 剧本学习

```
POST /api/space/:spaceId/edu/student/scripts/start
请求体：
{
  "script_id": 123,
  "title": "我的社交媒体内容策划项目"
}
响应：
{
  "code": 0,
  "data": {
    "project_id": 789,
    "project_type": 1,
    "current_stage": 1,
    "status": "in_progress"
  }
}
```

#### 9.1.2 模板定制

```
POST /api/space/:spaceId/edu/student/templates/start
请求体：
{
  "template_id": 456,
  "title": "我的内容生成助手",
  "config_params": {
    "brand_tone": "年轻活泼",
    "target_audience": "25-35岁职场女性",
    "content_types": ["产品介绍", "用户故事"]
  }
}
响应：
{
  "code": 0,
  "data": {
    "project_id": 790,
    "project_type": 2,
    "bot_id": 999,  // 从模板复制生成的新 Bot
    "status": "in_progress"
  }
}
```

#### 9.1.3 自主开发

```
POST /api/space/:spaceId/edu/student/bots/create
请求体：
{
  "title": "我的电商客服助手",
  "description": "为小型电商店铺提供智能客服",
  "scenario_category": "ecommerce"
}
响应：
{
  "code": 0,
  "data": {
    "project_id": 791,
    "project_type": 3,
    "bot_id": 1000,  // 新创建的空白 Bot
    "status": "in_progress"
  }
}
```

#### 9.1.4 我的项目

```
GET /api/space/:spaceId/edu/student/projects/my?status=in_progress&project_type=1
响应：
{
  "code": 0,
  "data": {
    "list": [
      {
        "project_id": 789,
        "project_type": 1,
        "title": "我的社交媒体内容策划项目",
        "source_name": "品牌社交媒体内容策划",
        "current_stage": 2,
        "total_stages": 3,
        "status": "in_progress",
        "started_at": "2026-02-01T10:00:00Z",
        "last_updated": "2026-02-04T15:30:00Z"
      }
    ],
    "total": 1
  }
}
```

### 9.2 教师端 API

#### 9.2.1 班级管理

```
POST /api/space/:spaceId/edu/teacher/classes
请求体：
{
  "name": "2024春季市场营销1班",
  "code": "MKT2024S01",
  "course_name": "智能营销实战",
  "start_date": "2024-02-20",
  "end_date": "2024-06-30"
}
响应：
{
  "code": 0,
  "data": {
    "class_id": 101,
    "space_id": 7602171965524148224
  }
}
```

#### 9.2.2 布置作业

```
POST /api/space/:spaceId/edu/teacher/assignments
请求体：
{
  "class_id": 101,
  "title": "作业1：社交媒体内容策划",
  "assignment_type": 1,  // 剧本作业
  "source_id": 123,      // script_id
  "start_time": "2024-03-01T00:00:00Z",
  "due_time": "2024-03-15T23:59:59Z",
  "auto_evaluate": true,
  "max_score": 100
}
响应：
{
  "code": 0,
  "data": {
    "assignment_id": 201
  }
}
```

#### 9.2.3 学生进度监控

```
GET /api/space/:spaceId/edu/teacher/students/:userId/progress?class_id=101
响应：
{
  "code": 0,
  "data": {
    "user_id": 1001,
    "user_name": "张三",
    "projects": [
      {
        "project_id": 789,
        "assignment_id": 201,
        "title": "作业1：社交媒体内容策划",
        "project_type": 1,
        "current_stage": 2,
        "total_stages": 3,
        "status": "in_progress",
        "progress_percentage": 66,
        "time_spent_minutes": 85,
        "started_at": "2026-03-02T10:00:00Z"
      }
    ],
    "statistics": {
      "total_assignments": 5,
      "completed": 2,
      "in_progress": 2,
      "not_started": 1,
      "average_score": 85.5
    }
  }
}
```

#### 9.2.4 教师评估

```
POST /api/space/:spaceId/edu/teacher/evaluations
请求体：
{
  "project_id": 789,
  "teacher_score": 90,
  "teacher_comment": "内容策划思路清晰，文案创意不错，建议在用户画像分析部分再深入一些。",
  "dimension_scores": {
    "user_understanding": 85,
    "content_quality": 90,
    "creativity": 92
  }
}
响应：
{
  "code": 0,
  "data": {
    "evaluation_id": 301
  }
}
```

---

## 10. 部署和运维

### 10.1 开发环境

```bash
# 1. 启动基础服务
cd /home/hjy/work/coze-studio/docker
docker compose up -d mysql redis elasticsearch

# 2. 初始化教育平台数据库
docker exec -i coze-mysql mysql -u root -proot opencoze < \
  ../backend/infra/database/sql/edu_platform_schema.sql

# 3. 启动后端
cd ../backend
go run main.go

# 4. 启动前端
cd ../frontend/apps/coze-studio
npm run dev

# 5. 访问
# 学生端：http://localhost:8888/space/:spaceId/edu/learning
# 教师端：http://localhost:8888/space/:spaceId/edu/teacher/classes
```

### 10.2 生产部署

```bash
# 1. 构建后端
cd backend
make build_server

# 2. 构建前端
cd frontend/apps/coze-studio
rush build

# 3. Docker 部署
cd docker
docker compose -f docker-compose.prod.yml up -d
```

### 10.3 环境变量

```bash
# backend/.env
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=opencoze
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama2

# 教育平台专用配置
EDU_AI_EVALUATION_ENABLED=true
EDU_AUTO_EVALUATE_TIMEOUT=60s
EDU_MAX_PROJECT_PER_STUDENT=50
```

---

## 11. 后续迭代规划

### Phase 2（3-6 个月）

- [ ] 多场景扩展（财务、电商、人力资源）
- [ ] 优秀作品展示和分享
- [ ] 学生协作功能（小组项目）
- [ ] 更复杂的 Workflow 教学
- [ ] Plugin 开发教学

### Phase 3（6-12 个月）

- [ ] 移动端适配
- [ ] 数据分析看板（校级、院级）
- [ ] 证书系统
- [ ] 外部平台集成（学习通、超星等）
- [ ] AI 助教（智能答疑）

---

## 12. 附录

### 12.1 相关文档

- [教育平台需求文档](./education-platform-requirements.md)
- [空间集成总结](./space-integration-summary.md)
- [coze-studio 开发指南](../CLAUDE.md)

### 12.2 联系方式

- **项目负责人**：hjy
- **项目地址**：https://github.com/cherryccn/coze-studio
- **文档版本**：v2.0
- **最后更新**：2026-02-04

---

**文档结束**

> 💡 本文档为教育平台的技术架构设计蓝图，所有技术决策基于 2026-02-04 的讨论确定。在开发过程中如有调整，请及时更新本文档。
