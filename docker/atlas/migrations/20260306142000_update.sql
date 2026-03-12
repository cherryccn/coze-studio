-- Create "billing_budget_rules" table
CREATE TABLE `opencoze`.`billing_budget_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT "id",
  `space_id` bigint unsigned NOT NULL DEFAULT 0 COMMENT "space id",
  `monthly_budget` decimal(16,2) NOT NULL DEFAULT 0 COMMENT "monthly budget",
  `alarm_thresholds` varchar(64) NOT NULL DEFAULT "70,90,100" COMMENT "alarm thresholds",
  `over_limit_policy` varchar(16) NOT NULL DEFAULT "warn" COMMENT "over limit policy: warn/reject",
  `enabled` tinyint unsigned NOT NULL DEFAULT 1 COMMENT "enabled status",
  `updated_by` bigint unsigned NOT NULL DEFAULT 0 COMMENT "operator id",
  `updated_at` bigint unsigned NOT NULL DEFAULT 0 COMMENT "update time in milliseconds",
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_space_id` (`space_id`),
  INDEX `idx_enabled` (`enabled`)
) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT "billing budget rules";
-- Create "billing_daily_agg" table
CREATE TABLE `opencoze`.`billing_daily_agg` (
  `dt` date NOT NULL COMMENT "aggregation date",
  `space_id` bigint unsigned NOT NULL DEFAULT 0 COMMENT "space id",
  `project_type` varchar(16) NOT NULL DEFAULT "" COMMENT "project type: agent/app/workflow",
  `total_tokens` bigint unsigned NOT NULL DEFAULT 0 COMMENT "daily total tokens",
  `total_amount` decimal(16,6) NOT NULL DEFAULT 0 COMMENT "daily total amount",
  `success_count` bigint unsigned NOT NULL DEFAULT 0 COMMENT "daily success count",
  `fail_count` bigint unsigned NOT NULL DEFAULT 0 COMMENT "daily fail count",
  PRIMARY KEY (`dt`, `space_id`, `project_type`),
  INDEX `idx_space_dt` (`space_id`, `dt`),
  INDEX `idx_project_type_dt` (`project_type`, `dt`)
) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT "daily billing aggregation";
-- Create "billing_records" table
CREATE TABLE `opencoze`.`billing_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT "id",
  `request_id` varchar(64) NOT NULL DEFAULT "" COMMENT "request unique identifier",
  `space_id` bigint unsigned NOT NULL DEFAULT 0 COMMENT "space id",
  `project_type` varchar(16) NOT NULL DEFAULT "" COMMENT "project type: agent/app/workflow",
  `project_id` bigint unsigned NOT NULL DEFAULT 0 COMMENT "project id",
  `model_id` varchar(64) NOT NULL DEFAULT "" COMMENT "model identifier",
  `usage_tokens` bigint unsigned NOT NULL DEFAULT 0 COMMENT "token usage",
  `unit_price` decimal(16,8) NOT NULL DEFAULT 0 COMMENT "unit price",
  `amount` decimal(16,6) NOT NULL DEFAULT 0 COMMENT "billing amount",
  `status` varchar(16) NOT NULL DEFAULT "success" COMMENT "status: success/failed/refund",
  `occurred_at` bigint unsigned NOT NULL DEFAULT 0 COMMENT "event time in milliseconds",
  `created_at` bigint unsigned NOT NULL DEFAULT 0 COMMENT "create time in milliseconds",
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_request_id` (`request_id`),
  INDEX `idx_space_time` (`space_id`, `occurred_at`),
  INDEX `idx_project_time` (`project_type`, `project_id`, `occurred_at`),
  INDEX `idx_status_time` (`status`, `occurred_at`)
) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT "billing detail records";
