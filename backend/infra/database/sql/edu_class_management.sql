-- ================================
-- 教育平台班级管理模块数据库迁移脚本
-- 创建日期：2026-02-04
-- 说明：支持教师端班级管理功能
-- ================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- 1. 创建 edu_classes 表（班级）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `space_id` BIGINT UNSIGNED NOT NULL COMMENT '所属空间ID',
  `name` VARCHAR(100) NOT NULL COMMENT '班级名称',
  `code` VARCHAR(50) NOT NULL COMMENT '班级代码（唯一）',
  `description` TEXT COMMENT '班级描述',
  `teacher_id` BIGINT UNSIGNED NOT NULL COMMENT '主讲教师ID',
  `team_space_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联的Team Space ID',
  `semester` VARCHAR(50) DEFAULT NULL COMMENT '学期（如：2024春季）',
  `start_date` DATE DEFAULT NULL COMMENT '开课日期',
  `end_date` DATE DEFAULT NULL COMMENT '结课日期',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active/archived/deleted',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_space_id` (`space_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_team_space_id` (`team_space_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- ================================
-- 2. 创建 edu_class_members 表（班级成员）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_class_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL COMMENT '班级ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` VARCHAR(20) NOT NULL DEFAULT 'student' COMMENT 'teacher/assistant/student',
  `student_no` VARCHAR(50) DEFAULT NULL COMMENT '学号',
  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_user` (`class_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级成员表';

-- ================================
-- 3. 创建 edu_class_invite_codes 表（班级邀请码）
-- ================================

CREATE TABLE IF NOT EXISTS `edu_class_invite_codes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL COMMENT '班级ID',
  `code` VARCHAR(32) NOT NULL COMMENT '邀请码',
  `role` VARCHAR(20) NOT NULL DEFAULT 'student' COMMENT '邀请码对应的角色',
  `max_uses` INT NOT NULL DEFAULT 0 COMMENT '最大使用次数，0表示无限制',
  `used_count` INT NOT NULL DEFAULT 0 COMMENT '已使用次数',
  `expires_at` TIMESTAMP NULL DEFAULT NULL COMMENT '过期时间',
  `created_by` BIGINT UNSIGNED NOT NULL COMMENT '创建者ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级邀请码表';

SET FOREIGN_KEY_CHECKS = 1;
