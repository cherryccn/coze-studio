-- ================================
-- 教育平台 v1.0 数据库迁移脚本
-- 创建日期：2026-02-04
-- 说明：支持渐进式三阶段学习（剧本引导 + 模板定制 + 自主开发）
-- ================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- 1. 创建 edu_scripts 表（剧本库）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_scripts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `space_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '所属空间ID（0=全局）',
  `owner_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '创建者用户ID',
  `visibility` ENUM('private','team','public') NOT NULL DEFAULT 'team' COMMENT '可见性',
  `learning_stage` TINYINT NOT NULL DEFAULT 1 COMMENT '适用学习阶段：1=入门(剧本引导) 2=进阶(模板定制) 3=高级(自主开发)',
  `scenario_category` VARCHAR(50) NOT NULL DEFAULT 'marketing' COMMENT '场景分类：marketing/finance/ecommerce/hr等',

  `name` VARCHAR(100) NOT NULL COMMENT '剧本名称',
  `name_en` VARCHAR(100) DEFAULT NULL COMMENT '英文名称',
  `difficulty` TINYINT NOT NULL DEFAULT 2 COMMENT '难度: 1=简单 2=中等 3=困难',
  `duration` INT NOT NULL DEFAULT 120 COMMENT '预计课时（分钟）',
  `icon` VARCHAR(50) DEFAULT '📊' COMMENT '图标emoji',
  `description` TEXT COMMENT '简短描述',
  `background` TEXT COMMENT '背景故事',
  `objectives` JSON COMMENT '学习目标数组',
  `stages` JSON NOT NULL COMMENT '阶段配置数组',
  `bot_ids` JSON COMMENT '关联的Bot ID数组',
  `evaluation_config` JSON COMMENT '评分配置',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_space_id` (`space_id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_visibility` (`visibility`),
  KEY `idx_category` (`scenario_category`),
  KEY `idx_status` (`status`),
  KEY `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教育剧本库';

-- ================================
-- 2. 重建 edu_student_projects 表（支持三种项目类型）
-- ================================

-- 备份旧表（如果需要）
-- RENAME TABLE `edu_student_projects` TO `edu_student_projects_backup`;

DROP TABLE IF EXISTS `edu_student_projects`;

CREATE TABLE `edu_student_projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '学生ID',
  `space_id` BIGINT UNSIGNED NOT NULL COMMENT '所属空间ID（班级空间或个人空间）',
  `class_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '所属班级ID（如果是作业）',
  `assignment_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '所属作业ID（如果是作业）',

  -- 项目类型和来源
  `project_type` TINYINT NOT NULL COMMENT '项目类型：1=剧本引导 2=模板定制 3=自主开发',
  `source_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '来源ID（script_id/template_id/0）',

  -- 基本信息
  `title` VARCHAR(200) NOT NULL COMMENT '项目标题',
  `description` TEXT COMMENT '项目描述',

  -- 关联的 Bot（所有类型最终都会生成 Bot）
  `bot_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联的 Bot ID（模板和自主开发阶段）',

  -- 进度和状态
  `current_stage` INT NOT NULL DEFAULT 1 COMMENT '当前阶段（仅剧本类型使用）',
  `status` VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    COMMENT '状态：in_progress/completed/abandoned',

  -- 评估相关
  `total_score` DECIMAL(5,2) DEFAULT NULL COMMENT '总分（百分制）',
  `teacher_comment` TEXT COMMENT '教师评语',
  `teacher_score` DECIMAL(5,2) DEFAULT NULL COMMENT '教师打分',

  -- 时间戳
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT NULL COMMENT '提交时间（作业）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_user_space` (`user_id`, `space_id`),
  KEY `idx_class_assignment` (`class_id`, `assignment_id`),
  KEY `idx_project_type` (`project_type`),
  KEY `idx_status` (`status`),
  KEY `idx_bot_id` (`bot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='学生学习项目表（支持三种类型）';

-- ================================
-- 3. 保留并调整 edu_project_stages 表
-- ================================

-- 如果表已存在，先删除再重建（或者用 ALTER）
DROP TABLE IF EXISTS `edu_project_stages`;

CREATE TABLE `edu_project_stages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL COMMENT '项目 ID',
  `stage_order` INT NOT NULL COMMENT '阶段序号',
  `stage_name` VARCHAR(100) NOT NULL COMMENT '阶段名称',
  `status` VARCHAR(20) NOT NULL DEFAULT 'not_started'
    COMMENT '状态：not_started/in_progress/completed',
  `output_content` LONGTEXT COMMENT '学生产出内容（Markdown）',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '阶段得分',
  `feedback` TEXT COMMENT 'AI 反馈',
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_status` (`status`),
  UNIQUE KEY `uk_project_stage` (`project_id`, `stage_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='项目阶段表';

-- ================================
-- 4. 保留并调整 edu_chat_messages 表
-- ================================

DROP TABLE IF EXISTS `edu_chat_messages`;

CREATE TABLE `edu_chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL COMMENT '项目 ID',
  `stage_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '阶段 ID（可选）',
  `role` VARCHAR(20) NOT NULL COMMENT '角色：user/assistant',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `attachments` JSON COMMENT '附件信息',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_project_stage` (`project_id`, `stage_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='对话记录表';

-- ================================
-- 5. 重建 edu_evaluations 表（替代 edu_evaluation_results）
-- ================================

DROP TABLE IF EXISTS `edu_evaluation_results`;
DROP TABLE IF EXISTS `edu_evaluations`;

CREATE TABLE `edu_evaluations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL COMMENT '项目 ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '被评估学生 ID',

  -- 评估类型
  `evaluation_type` TINYINT NOT NULL COMMENT '评估类型：1=AI自动评估 2=教师评估',
  `evaluator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '评估者 ID（教师）',

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
  `max_score` DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT '满分',

  -- 反馈
  `feedback` TEXT COMMENT '评估反馈',
  `strengths` JSON COMMENT '优点列表',
  `improvements` JSON COMMENT '改进建议列表',

  `evaluated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_evaluation_type` (`evaluation_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='评估结果表';

-- ================================
-- 6. 新增 edu_templates 表（模板系统）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `space_id` BIGINT UNSIGNED NOT NULL COMMENT '所属空间 ID',
  `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '创建者 ID',

  -- 基本信息
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `name_en` VARCHAR(100) DEFAULT NULL COMMENT '英文名称',
  `description` TEXT NOT NULL COMMENT '模板描述',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '图标 URL',

  -- 分类
  `scenario_category` VARCHAR(50) NOT NULL DEFAULT 'marketing' COMMENT '场景分类',
  `difficulty_level` TINYINT NOT NULL DEFAULT 2 COMMENT '难度等级：1=简单 2=中等 3=困难',

  -- 关联的基础 Bot
  `base_bot_id` BIGINT UNSIGNED NOT NULL COMMENT '基础 Bot ID（学生从此复制）',

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

-- ================================
-- 7. 新增 edu_classes 表（班级管理）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `space_id` BIGINT UNSIGNED NOT NULL COMMENT '所属空间 ID（班级空间）',
  `teacher_id` BIGINT UNSIGNED NOT NULL COMMENT '授课教师 ID',

  -- 基本信息
  `name` VARCHAR(100) NOT NULL COMMENT '班级名称（如：2024春季市场营销1班）',
  `code` VARCHAR(50) DEFAULT NULL COMMENT '班级代码（如：MKT2024S01）',
  `description` TEXT COMMENT '班级描述',

  -- 课程信息
  `course_name` VARCHAR(100) DEFAULT NULL COMMENT '课程名称',
  `semester` VARCHAR(50) DEFAULT NULL COMMENT '学期',
  `academic_year` VARCHAR(20) DEFAULT NULL COMMENT '学年',

  -- 时间
  `start_date` DATE DEFAULT NULL COMMENT '开课日期',
  `end_date` DATE DEFAULT NULL COMMENT '结课日期',

  -- 状态
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=进行中 2=已结束 0=已删除',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_space_id` (`space_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='班级表';

-- ================================
-- 8. 新增 edu_class_members 表（班级成员）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_class_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL COMMENT '班级 ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `role_type` TINYINT NOT NULL DEFAULT 3 COMMENT '角色：1=教师 2=助教 3=学生',

  -- 学生信息
  `student_number` VARCHAR(50) DEFAULT NULL COMMENT '学号',
  `student_name` VARCHAR(100) DEFAULT NULL COMMENT '学生姓名',

  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_user` (`class_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_type` (`role_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='班级成员表';

-- ================================
-- 9. 新增 edu_assignments 表（作业管理）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL COMMENT '班级 ID',
  `teacher_id` BIGINT UNSIGNED NOT NULL COMMENT '发布教师 ID',

  -- 基本信息
  `title` VARCHAR(200) NOT NULL COMMENT '作业标题',
  `description` TEXT COMMENT '作业说明',

  -- 作业类型和来源
  `assignment_type` TINYINT NOT NULL COMMENT '作业类型：1=剧本作业 2=模板作业 3=自主开发作业',
  `source_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '来源 ID（script_id/template_id/0）',

  -- 时间要求
  `start_time` TIMESTAMP NOT NULL COMMENT '开始时间',
  `due_time` TIMESTAMP NOT NULL COMMENT '截止时间',

  -- 评估配置
  `auto_evaluate` TINYINT NOT NULL DEFAULT 1 COMMENT '是否自动评估：1=是 0=否',
  `max_score` DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT '满分',

  -- 状态
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=进行中 2=已结束 0=已删除',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_assignment_type` (`assignment_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='作业表';

-- ================================
-- 迁移完成
-- ================================

SET FOREIGN_KEY_CHECKS = 1;

-- 显示创建的表
SHOW TABLES LIKE 'edu_%';
