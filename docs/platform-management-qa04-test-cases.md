# QA-04 用例清单（阈值触发与告警准确性）

## 1. 范围
验证平台预算告警任务在以下维度的准确性：
1. 阈值触发（70/90/100 或自定义阈值）
2. 策略字段（`warn` / `reject`）透传
3. 幂等去重（同月同空间同阈值）
4. 月份切换后的重新触发

## 2. 前置条件
1. 已有可用后端服务与管理员会话。
2. 可写 MySQL/Redis。
3. 可调用 `POST /api/platform/billing/budgets/alerts/check`。

## 3. 用例矩阵
| 用例ID | 目标 | 数据准备 | 执行步骤 | 期望结果 |
|---|---|---|---|---|
| QA04-01 | 70% 阈值触发 | `monthly_budget=100`，`thresholds=70`，月消费=75 | 调用检查接口 1 次 | `triggered_alerts >= 1`；事件阈值为 70 |
| QA04-02 | 90% 阈值触发 | `monthly_budget=100`，`thresholds=90`，月消费=95 | 调用检查接口 1 次 | `triggered_alerts >= 1`；事件阈值为 90 |
| QA04-03 | 100% 阈值触发 | `monthly_budget=100`，`thresholds=100`，月消费=100 | 调用检查接口 1 次 | `triggered_alerts >= 1`；事件阈值为 100 |
| QA04-04 | 多阈值跨越 | `thresholds=70,90,100`，月消费=95 | 调用检查接口 1 次 | 至少触发 70 与 90；100 不触发 |
| QA04-05 | 未达阈值不触发 | `thresholds=90`，月消费=80 | 调用检查接口 1 次 | `triggered_alerts = 0` |
| QA04-06 | 幂等去重 | 任一可触发阈值样本 | 连续调用检查接口 2 次 | 第 2 次 `triggered_alerts=0` 且 `deduplicated` 增加 |
| QA04-07 | 策略 warn 透传 | `over_limit_policy=warn` | 触发后读事件缓存 | 事件字段 `over_limit_policy=warn` |
| QA04-08 | 策略 reject 透传 | `over_limit_policy=reject` | 触发后读事件缓存 | 事件字段 `over_limit_policy=reject` |
| QA04-09 | 禁用规则 | `enabled=0` 且月消费超阈值 | 调用检查接口 | 不触发该空间告警 |
| QA04-10 | 跨月重置 | 上月已触发，本月同阈值继续超限 | 月份切换后调用检查 | 本月可再次触发，不受上月键影响 |

## 4. 判定口径
1. 幂等维度固定为：`month + space_id + threshold`。
2. 事件缓存键固定为：`platform_billing_budget_alert_event_<month>_<space_id>_<threshold>`。
3. 幂等键固定为：`platform_billing_budget_alert_sent_<month>_<space_id>_<threshold>`。

## 5. 执行顺序建议
1. 先执行 `QA04-05`（未达阈值）确认无误报。
2. 执行 `QA04-01/02/03/04`（触发准确性）。
3. 执行 `QA04-06`（去重）。
4. 执行 `QA04-07/08`（策略透传）。
5. 执行 `QA04-09/10`（边界与跨月）。
