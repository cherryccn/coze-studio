-- ================================
-- 教育平台数据表扩展
-- 基于 coze-studio 现有架构
-- ================================

-- ================================
-- 1. 剧本相关表
-- ================================

-- 剧本表
CREATE TABLE IF NOT EXISTS `edu_scripts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '剧本名称',
  `name_en` VARCHAR(100) DEFAULT NULL COMMENT '英文名称',
  `difficulty` TINYINT NOT NULL DEFAULT 2 COMMENT '难度: 1=简单 2=中等 3=困难',
  `duration` INT NOT NULL DEFAULT 2 COMMENT '预计课时（分钟）',
  `icon` VARCHAR(50) DEFAULT '📊' COMMENT '图标emoji',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '一句话介绍',
  `background` TEXT COMMENT '背景故事',
  `objectives` JSON COMMENT '学习目标数组',
  `stages` JSON NOT NULL COMMENT '阶段配置数组',
  `bot_ids` JSON COMMENT '关联的Bot ID数组（复用现有bot表）',
  `evaluation_config` JSON COMMENT '评分配置',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教育剧本库';

-- ================================
-- 2. 学生项目相关表
-- ================================

-- 学生实训项目表
CREATE TABLE IF NOT EXISTS `edu_student_projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT UNSIGNED NOT NULL COMMENT '学生ID（关联现有user表）',
  `script_id` BIGINT UNSIGNED NOT NULL COMMENT '剧本ID',
  `title` VARCHAR(100) NOT NULL COMMENT '项目标题',
  `current_stage` TINYINT NOT NULL DEFAULT 1 COMMENT '当前阶段',
  `status` VARCHAR(20) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress/completed/abandoned',
  `progress` TINYINT NOT NULL DEFAULT 0 COMMENT '进度百分比',
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_script_id` (`script_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生项目';

-- 项目阶段记录表
CREATE TABLE IF NOT EXISTS `edu_project_stages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `stage_number` TINYINT NOT NULL COMMENT '阶段序号',
  `stage_name` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/in_progress/completed',
  `output_document` LONGTEXT COMMENT '产出文档内容(Markdown)',
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_stage_number` (`stage_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目阶段记录';

-- ================================
-- 3. 协作相关表
-- ================================

-- 对话记录表（扩展现有conversation功能）
CREATE TABLE IF NOT EXISTS `edu_chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `stage_number` TINYINT NOT NULL,
  `conversation_id` VARCHAR(50) DEFAULT NULL COMMENT '关联现有conversation表（可选）',
  `sender_type` VARCHAR(20) NOT NULL COMMENT 'student/bot',
  `sender_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '发送者ID',
  `sender_name` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `attachments` JSON COMMENT '附件',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_stage` (`project_id`, `stage_number`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教育对话记录';

-- ================================
-- 4. 评估相关表
-- ================================

-- 评估结果表
CREATE TABLE IF NOT EXISTS `edu_evaluation_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `stage_number` TINYINT DEFAULT NULL COMMENT '阶段评估（NULL=总评）',
  `total_score` DECIMAL(5,2) NOT NULL COMMENT '总分',
  `dimension_scores` JSON NOT NULL COMMENT '各维度得分',
  `ai_feedback` TEXT COMMENT 'AI评语',
  `teacher_feedback` TEXT COMMENT '教师评语',
  `teacher_adjusted_score` DECIMAL(5,2) DEFAULT NULL COMMENT '教师调整后分数',
  `evaluated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估结果';

-- ================================
-- 5. 初始化测试数据
-- ================================

-- 插入第一个剧本：咖啡店选址调研
INSERT INTO `edu_scripts` (
  `name`,
  `name_en`,
  `difficulty`,
  `duration`,
  `icon`,
  `description`,
  `background`,
  `objectives`,
  `stages`,
  `bot_ids`,
  `evaluation_config`
) VALUES (
  '咖啡店选址市场调研',
  'Coffee Shop Location Analysis',
  2,
  120,
  '☕',
  '你是咖啡品牌"香遇"的市场专员，需要完成新店选址调研并给出建议方案。',
  '【情境设定】\n"香遇咖啡"是一家新兴精品咖啡连锁品牌，主打年轻人市场。公司决定在某大学城商圈开设新店，预算30万元。\n\n现有3个备选地址：\nA. 大学正门商业街（租金高，人流大）\nB. 学生宿舍区底商（租金中，学生近）\nC. 创业园区咖啡街（租金低，竞争多）',
  JSON_ARRAY(
    '掌握市场调研的基本方法',
    '培养数据驱动决策能力',
    '提升商业分析和判断力',
    '锻炼方案汇报和应答能力'
  ),
  JSON_ARRAY(
    JSON_OBJECT(
      'order', 1,
      'name', '市场数据调研',
      'description', '与数据分析师协作，收集和分析3个地址的关键数据',
      'duration', 40,
      'bot_ids', JSON_ARRAY(),
      'output_type', 'markdown',
      'output_template', '《选址数据分析报告.md》',
      'weight', 0.3
    ),
    JSON_OBJECT(
      'order', 2,
      'name', '选址方案制定',
      'description', '基于数据做出选址决策，并说明理由',
      'duration', 40,
      'bot_ids', JSON_ARRAY(),
      'output_type', 'markdown',
      'output_template', '《选址决策方案.md》',
      'weight', 0.4
    ),
    JSON_OBJECT(
      'order', 3,
      'name', '方案汇报与答辩',
      'description', '向资深顾问汇报方案，接受质询并优化',
      'duration', 40,
      'bot_ids', JSON_ARRAY(),
      'output_type', 'markdown',
      'output_template', '《选址方案终稿.md》',
      'weight', 0.3
    )
  ),
  JSON_ARRAY(),
  JSON_OBJECT(
    'dimensions', JSON_ARRAY(
      JSON_OBJECT('name', '完整性', 'weight', 0.2),
      JSON_OBJECT('name', '专业性', 'weight', 0.3),
      JSON_OBJECT('name', '逻辑性', 'weight', 0.3),
      JSON_OBJECT('name', '创新性', 'weight', 0.2)
    )
  )
) ON DUPLICATE KEY UPDATE `id` = `id`;
