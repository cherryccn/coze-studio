# 平台管理 BE-09 运行态 Smoke（预算阈值告警）

## 1. 目标
验证以下行为：
1. 首次触发阈值时产生告警（`triggered_alerts > 0`）。
2. 同月同空间同阈值重复触发时被幂等去重（`deduplicated > 0`）。

## 2. 前置条件
1. 已启动后端服务并可访问平台接口。
2. 已准备可写数据库（包含 `space`、`billing_budget_rules`、`billing_records`）。
3. 已有平台管理员会话（`session_key`）。

## 3. 准备测试数据（示例 SQL）
> 说明：下面使用 `space_id=990001`，如与现网冲突请替换。

```sql
-- 1) 准备空间（若已存在可跳过）
INSERT INTO space (id, name, created_at, updated_at)
VALUES (990001, 'BE09-Smoke-Space', UNIX_TIMESTAMP(NOW(3))*1000, UNIX_TIMESTAMP(NOW(3))*1000)
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = VALUES(updated_at);

-- 2) 配置预算规则：预算 100，阈值 70/90/100，启用
INSERT INTO billing_budget_rules (
  space_id,
  monthly_budget,
  alarm_thresholds,
  over_limit_policy,
  enabled,
  updated_by,
  updated_at
)
VALUES (
  990001,
  '100.00',
  '70,90,100',
  'warn',
  1,
  1,
  UNIX_TIMESTAMP(NOW(3))*1000
)
ON DUPLICATE KEY UPDATE
  monthly_budget = VALUES(monthly_budget),
  alarm_thresholds = VALUES(alarm_thresholds),
  over_limit_policy = VALUES(over_limit_policy),
  enabled = VALUES(enabled),
  updated_by = VALUES(updated_by),
  updated_at = VALUES(updated_at);

-- 3) 写入当月账单消费 95（会同时跨过 70 和 90）
INSERT INTO billing_records (
  request_id,
  space_id,
  project_type,
  project_id,
  model_id,
  usage_tokens,
  unit_price,
  amount,
  status,
  occurred_at,
  created_at
)
VALUES (
  CONCAT('be09_smoke_', UNIX_TIMESTAMP(NOW())),
  990001,
  'agent',
  1,
  'smoke-model',
  95000,
  '0.001',
  '95.00',
  'success',
  UNIX_TIMESTAMP(NOW(3))*1000,
  UNIX_TIMESTAMP(NOW(3))*1000
);
```

## 4. 执行步骤
### 4.1 第一次手动触发（预期触发告警）
```bash
curl -i -X POST 'http://127.0.0.1:8888/api/platform/billing/budgets/alerts/check' \
  -H 'Cookie: session_key=<你的平台管理员会话>'
```

预期关键点：
1. HTTP 200。
2. `code = 0`。
3. `data.checked_spaces >= 1`。
4. `data.triggered_alerts >= 1`（本样例通常为 2，对应 70/90）。

### 4.2 第二次手动触发（预期命中去重）
```bash
curl -i -X POST 'http://127.0.0.1:8888/api/platform/billing/budgets/alerts/check' \
  -H 'Cookie: session_key=<你的平台管理员会话>'
```

预期关键点：
1. HTTP 200。
2. `code = 0`。
3. `data.triggered_alerts = 0`（同一批阈值不重复发）。
4. `data.deduplicated >= 1`。

## 5. 可选验证（Redis）
如接入了 Redis 并可访问，可检查幂等键（示例）：

```bash
redis-cli KEYS 'platform_billing_budget_alert_sent_*_990001_*'
```

预期：存在当前月份对应键，例如：
`platform_billing_budget_alert_sent_2026-03_990001_70`

## 6. 清理（可选）
```sql
DELETE FROM billing_records WHERE request_id LIKE 'be09_smoke_%' AND space_id = 990001;
DELETE FROM billing_budget_rules WHERE space_id = 990001;
-- 若空间是专用测试数据可删除：
-- DELETE FROM space WHERE id = 990001;
```

## 7. 失败排查
1. 返回 `40101/40301`：会话失效或非平台管理员。
2. `triggered_alerts` 始终为 0：确认预算规则 `enabled=1` 且消费已跨过阈值。
3. `failed_checks > 0`：检查数据库查询与 Redis 可达性，关注后端日志 `PlatformBudgetAlert`。
