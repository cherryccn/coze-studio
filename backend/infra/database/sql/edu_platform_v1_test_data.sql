-- ================================
-- 教育平台 v1.0 测试数据脚本
-- 创建日期：2026-02-04
-- 说明：包含完整的测试场景（剧本、模板、班级）
-- ================================

SET NAMES utf8mb4;

-- ================================
-- 注意事项
-- ================================
-- 1. 本脚本假设以下数据已存在：
--    - 测试用户（user 表）
--    - 测试空间（space 表）
-- 2. 如果不存在，需要先创建：
--    - 教师用户 ID: 假设为 1001
--    - 学生用户 ID: 假设为 2001, 2002, 2003
--    - 测试空间 ID: 假设为 7602171965524148224（已有）
-- 3. 实际部署时需要根据真实 ID 修改

-- ================================
-- 1. 清空旧的测试数据（可选）
-- ================================

-- DELETE FROM `edu_assignments` WHERE `class_id` IN (SELECT `id` FROM `edu_classes` WHERE `code` LIKE 'TEST_%');
-- DELETE FROM `edu_class_members` WHERE `class_id` IN (SELECT `id` FROM `edu_classes` WHERE `code` LIKE 'TEST_%');
-- DELETE FROM `edu_classes` WHERE `code` LIKE 'TEST_%';
-- DELETE FROM `edu_student_projects` WHERE `title` LIKE 'TEST_%';
-- DELETE FROM `edu_templates` WHERE `name` LIKE 'TEST_%';
-- DELETE FROM `edu_scripts` WHERE `name` LIKE '%社交媒体%' OR `name` LIKE '%市场营销%';

-- ================================
-- 2. 插入测试剧本：《品牌社交媒体内容策划》
-- ================================

INSERT INTO `edu_scripts` (
  `space_id`,
  `owner_id`,
  `visibility`,
  `learning_stage`,
  `scenario_category`,
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
  `evaluation_config`,
  `status`
) VALUES (
  7602171965524148224,  -- 测试空间 ID（需要替换为真实 ID）
  1001,                 -- 创建者ID（教师，需要替换为真实 ID）
  'public',             -- 公开可见
  1,                    -- 适用于入门阶段（剧本引导）
  'marketing',          -- 市场营销场景
  '品牌社交媒体内容策划',
  'Social Media Content Planning',
  1,                    -- 简单难度
  120,                  -- 120分钟
  '📱',
  '学习如何为品牌策划社交媒体内容，掌握用户画像分析、内容选题和文案创作技能',

  -- 背景故事
  '【情境设定】
你是"悦活生活馆"的新媒体运营实习生。这是一家主打年轻女性市场的生活方式品牌，主要通过小红书、抖音等平台进行营销。

【你的任务】
品牌即将推出新一季的春季系列产品，需要你策划一系列社交媒体内容，吸引目标用户关注并提升品牌影响力。

【背景信息】
- 品牌定位：年轻、时尚、有品质的生活方式
- 目标用户：25-35岁职场女性
- 主要平台：小红书、微信公众号
- 预算：内容制作预算有限，需要高效产出',

  -- 学习目标
  JSON_ARRAY(
    '理解智能体如何辅助内容创作',
    '掌握用户画像分析的基本方法',
    '学会内容选题和策划技巧',
    '提升创意文案写作能力'
  ),

  -- 阶段配置
  JSON_ARRAY(
    JSON_OBJECT(
      'order', 1,
      'name', '用户画像分析',
      'description', '与数据分析师 Bot 协作，分析目标用户特征和内容偏好',
      'duration', 30,
      'bot_ids', JSON_ARRAY(),
      'tasks', JSON_ARRAY(
        '定义目标用户的基本特征（年龄、职业、收入）',
        '分析用户的兴趣点和痛点',
        '总结用户在社交媒体上的行为习惯'
      ),
      'output_type', 'markdown',
      'output_template', '《目标用户画像分析.md》',
      'weight', 0.3
    ),
    JSON_OBJECT(
      'order', 2,
      'name', '内容选题策划',
      'description', '基于用户画像，策划 3-5 个内容选题',
      'duration', 40,
      'bot_ids', JSON_ARRAY(),
      'tasks', JSON_ARRAY(
        '结合春季产品特点提出选题方向',
        '评估每个选题的吸引力和传播潜力',
        '确定最佳选题组合'
      ),
      'output_type', 'markdown',
      'output_template', '《内容选题方案.md》',
      'weight', 0.3
    ),
    JSON_OBJECT(
      'order', 3,
      'name', '文案创作',
      'description', '使用智能体辅助创作小红书种草文案',
      'duration', 50,
      'bot_ids', JSON_ARRAY(),
      'tasks', JSON_ARRAY(
        '与文案 Bot 协作生成初稿',
        '优化标题和开头（吸引点击）',
        '完善文案结构和话题标签'
      ),
      'output_type', 'markdown',
      'output_template', '《小红书文案.md》',
      'weight', 0.4
    )
  ),

  -- 关联的 Bot ID（暂时为空，后续配置）
  JSON_ARRAY(),

  -- 评估配置
  JSON_OBJECT(
    'dimensions', JSON_ARRAY(
      JSON_OBJECT('name', '用户洞察', 'weight', 0.3, 'description', '对目标用户的理解深度'),
      JSON_OBJECT('name', '选题质量', 'weight', 0.3, 'description', '选题的创意性和吸引力'),
      JSON_OBJECT('name', '文案创意', 'weight', 0.4, 'description', '文案的完成度和感染力')
    )
  ),

  1  -- 状态：启用
) ON DUPLICATE KEY UPDATE `id` = `id`;

-- ================================
-- 3. 插入测试模板：《社交媒体内容生成助手》
-- ================================

INSERT INTO `edu_templates` (
  `space_id`,
  `creator_id`,
  `name`,
  `name_en`,
  `description`,
  `icon`,
  `scenario_category`,
  `difficulty_level`,
  `base_bot_id`,
  `configurable_params`,
  `guide_content`,
  `learning_objectives`,
  `evaluation_criteria`,
  `visibility`,
  `status`
) VALUES (
  7602171965524148224,  -- 测试空间 ID
  1001,                 -- 创建者ID
  '社交媒体内容生成助手',
  'Social Media Content Generator',
  '快速创建适合不同品牌调性的社交媒体内容，支持多种内容类型和平台',
  '✍️',
  'marketing',
  2,                    -- 中等难度
  0,                    -- 基础 Bot ID（需要先创建一个基础 Bot）

  -- 可配置参数
  JSON_OBJECT(
    'prompts', JSON_ARRAY(
      JSON_OBJECT(
        'key', 'brand_tone',
        'label', '品牌调性',
        'type', 'select',
        'options', JSON_ARRAY('专业严谨', '年轻活泼', '幽默风趣', '温馨亲切'),
        'default', '专业严谨',
        'help_text', '选择符合你的品牌形象的文案风格'
      ),
      JSON_OBJECT(
        'key', 'target_audience',
        'label', '目标用户',
        'type', 'textarea',
        'placeholder', '例如：25-35岁职场女性，关注时尚和生活品质',
        'help_text', '详细描述你的目标用户画像'
      ),
      JSON_OBJECT(
        'key', 'content_types',
        'label', '内容类型',
        'type', 'multiselect',
        'options', JSON_ARRAY('产品介绍', '用户故事', '行业资讯', '使用教程', '活动预告'),
        'default', JSON_ARRAY('产品介绍'),
        'help_text', '选择你需要生成的内容类型（可多选）'
      )
    ),
    'workflows', JSON_ARRAY(
      JSON_OBJECT(
        'key', 'enable_seo',
        'label', 'SEO 优化',
        'type', 'switch',
        'default', true,
        'help_text', '自动添加关键词和话题标签'
      )
    )
  ),

  -- 使用指南
  '# 使用指南

## 1. 配置品牌信息
首先设置你的品牌调性和目标用户，这将决定内容的整体风格。

## 2. 选择内容类型
根据营销需求选择要生成的内容类型，可以多选。

## 3. 测试和优化
生成内容后，在测试窗口中试用，根据效果调整参数。

## 4. 提交作品
满意后提交你配置好的内容生成助手。',

  -- 学习目标
  JSON_ARRAY(
    '学习如何配置 Bot 的基本参数',
    '理解 Prompt 如何影响生成效果',
    '掌握内容生成助手的实用技巧'
  ),

  -- 评估标准
  JSON_OBJECT(
    'dimensions', JSON_ARRAY(
      JSON_OBJECT('name', '参数配置', 'weight', 0.4),
      JSON_OBJECT('name', '内容质量', 'weight', 0.4),
      JSON_OBJECT('name', '实用性', 'weight', 0.2)
    )
  ),

  'team',  -- 团队可见
  1        -- 启用
) ON DUPLICATE KEY UPDATE `id` = `id`;

-- ================================
-- 4. 插入测试班级
-- ================================

INSERT INTO `edu_classes` (
  `space_id`,
  `teacher_id`,
  `name`,
  `code`,
  `description`,
  `course_name`,
  `semester`,
  `academic_year`,
  `start_date`,
  `end_date`,
  `status`
) VALUES (
  7602171965524148224,  -- 测试空间 ID
  1001,                 -- 教师 ID
  'TEST_2024春季市场营销实战班',
  'TEST_MKT2024S01',
  '学习智能体开发在市场营销中的应用',
  '智能营销实战',
  '2024春季',
  '2023-2024',
  '2024-02-20',
  '2024-06-30',
  1  -- 进行中
) ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`);

SET @class_id = LAST_INSERT_ID();

-- ================================
-- 5. 插入测试学生到班级
-- ================================

INSERT INTO `edu_class_members` (`class_id`, `user_id`, `role_type`, `student_number`, `student_name`)
VALUES
  (@class_id, 1001, 1, NULL, '张老师'),           -- 教师
  (@class_id, 2001, 3, '20240101', '李明'),      -- 学生1
  (@class_id, 2002, 3, '20240102', '王芳'),      -- 学生2
  (@class_id, 2003, 3, '20240103', '刘强')       -- 学生3
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ================================
-- 6. 插入测试作业（可选）
-- ================================

INSERT INTO `edu_assignments` (
  `class_id`,
  `teacher_id`,
  `title`,
  `description`,
  `assignment_type`,
  `source_id`,
  `start_time`,
  `due_time`,
  `auto_evaluate`,
  `max_score`,
  `status`
)
SELECT
  @class_id,
  1001,
  'TEST_作业1：社交媒体内容策划',
  '完成《品牌社交媒体内容策划》剧本学习，提交完整的策划方案',
  1,  -- 剧本作业
  (SELECT `id` FROM `edu_scripts` WHERE `name` = '品牌社交媒体内容策划' LIMIT 1),
  NOW(),
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  1,  -- 自动评估
  100,
  1   -- 进行中
FROM DUAL
WHERE EXISTS (SELECT 1 FROM `edu_scripts` WHERE `name` = '品牌社交媒体内容策划')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ================================
-- 7. 验证插入的数据
-- ================================

-- 检查剧本
SELECT
  `id`,
  `name`,
  `scenario_category`,
  `difficulty`,
  `learning_stage`,
  `visibility`
FROM `edu_scripts`
WHERE `name` LIKE '%社交媒体%';

-- 检查模板
SELECT
  `id`,
  `name`,
  `scenario_category`,
  `difficulty_level`
FROM `edu_templates`
WHERE `name` LIKE '%社交媒体%';

-- 检查班级
SELECT
  `id`,
  `name`,
  `code`,
  `course_name`
FROM `edu_classes`
WHERE `code` = 'TEST_MKT2024S01';

-- 检查班级成员
SELECT
  cm.`id`,
  cm.`user_id`,
  cm.`role_type`,
  cm.`student_number`,
  cm.`student_name`,
  c.`name` AS `class_name`
FROM `edu_class_members` cm
JOIN `edu_classes` c ON cm.`class_id` = c.`id`
WHERE c.`code` = 'TEST_MKT2024S01';

-- 检查作业
SELECT
  a.`id`,
  a.`title`,
  a.`assignment_type`,
  a.`due_time`,
  c.`name` AS `class_name`
FROM `edu_assignments` a
JOIN `edu_classes` c ON a.`class_id` = c.`id`
WHERE c.`code` = 'TEST_MKT2024S01';

-- ================================
-- 测试数据插入完成
-- ================================

-- 提示信息
SELECT
  '测试数据插入完成！' AS `message`,
  COUNT(*) AS `script_count`
FROM `edu_scripts`
WHERE `name` LIKE '%社交媒体%'

UNION ALL

SELECT
  '模板数量' AS `message`,
  COUNT(*) AS `count`
FROM `edu_templates`
WHERE `name` LIKE '%社交媒体%'

UNION ALL

SELECT
  '班级数量' AS `message`,
  COUNT(*) AS `count`
FROM `edu_classes`
WHERE `code` LIKE 'TEST_%'

UNION ALL

SELECT
  '班级成员数量' AS `message`,
  COUNT(*) AS `count`
FROM `edu_class_members`
WHERE `class_id` IN (SELECT `id` FROM `edu_classes` WHERE `code` LIKE 'TEST_%');
