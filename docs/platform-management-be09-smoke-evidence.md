# BE-09 运行态验收证据（2026-03-10）

## 1. 验收目标
1. 验证预算阈值首次触发会产生告警。
2. 验证同月同空间同阈值重复触发会走幂等去重，不重复告警。

## 2. 环境与前提
1. 后端服务已启动（`127.0.0.1:8888`）。
2. MySQL/Redis 本地可用（`127.0.0.1:3306`、`127.0.0.1:6379`）。
3. 鉴权会话通过 `/api/passport/web/email/login/` 获取 `session_key`。

## 3. 样本准备（clean-room）
1. 样本空间：`space_id=990022`
2. 阈值策略：`threshold=78`，`monthly_budget=100.00`，`over_limit_policy=warn`
3. 消费样本：当月插入一条 `amount=95.00` 成功账单
4. 预处理：删除该空间阈值对应的 Redis 幂等键与事件键

执行输出摘要：
```text
space_id=990022 threshold=78 month=2026-03
cleaned_keys=platform_billing_budget_alert_sent_2026-03_990022_78,platform_billing_budget_alert_event_2026-03_990022_78
inserted_request_id=be09_smoke_rt2_1773105350496987945 month_total=95.00
```

## 4. 双次触发结果
### 4.1 第一次触发
```json
{"code":0,"msg":"ok","data":{"checked_spaces":3,"triggered_alerts":1,"deduplicated":1,"failed_checks":0}}
```

### 4.2 第二次触发
```json
{"code":0,"msg":"ok","data":{"checked_spaces":3,"triggered_alerts":0,"deduplicated":2,"failed_checks":0}}
```

判定：
1. 第一次存在新增触发（`triggered_alerts=1`），满足首次触发条件。
2. 第二次新增触发归零且去重计数增加（`deduplicated=2`），满足幂等去重条件。

## 5. Redis 键验证
```text
sent_key=platform_billing_budget_alert_sent_2026-03_990022_78
sent_val=2 err=<nil>
event_key=platform_billing_budget_alert_event_2026-03_990022_78
event_val={"space_id":990022,"space_name":"space-990022","budget_month":"2026-03","alarm_threshold":78,"usage_rate":"95.00","current_spend":"95.00","monthly_budget":"100.00","over_limit_policy":"warn",...}
```

判定：
1. `sent_val=2` 对应两次检查累加，符合 `INCR` 幂等逻辑。
2. 事件键存在且业务字段正确（`space_id=990022`、`alarm_threshold=78`、`usage_rate=95.00`）。

## 6. 结论
`BE-09` 的运行态核心验收通过，可将后端任务状态更新为 `已完成`。后续进入 `QA-04` 全量场景补齐阶段（70/90/100 与 warn/reject 矩阵）。

## 7. QA-04 追加抽样（2026-03-10）
### 7.1 QA04-05 未达阈值不触发
样本：
1. `space_id=990023`
2. `threshold=91`，`monthly_budget=100`，`amount=80`，`policy=warn`

检查接口返回：
```json
{"code":0,"msg":"ok","data":{"checked_spaces":4,"triggered_alerts":0,"deduplicated":2,"failed_checks":0}}
```

Redis 验证：
```text
sent_key=platform_billing_budget_alert_sent_2026-03_990023_91 err=redis: nil
event_key=platform_billing_budget_alert_event_2026-03_990023_91 err=redis: nil
```

判定：未达阈值场景无告警键生成，结果符合预期。

### 7.2 QA04-08 reject 策略透传
样本：
1. `space_id=990024`
2. `threshold=82`，`monthly_budget=100`，`amount=85`，`policy=reject`

检查接口返回：
```json
{"code":0,"msg":"ok","data":{"checked_spaces":5,"triggered_alerts":1,"deduplicated":2,"failed_checks":0}}
```

Redis 验证：
```text
sent_key=platform_billing_budget_alert_sent_2026-03_990024_82 val=1
event_key=platform_billing_budget_alert_event_2026-03_990024_82 val={...\"over_limit_policy\":\"reject\", ... \"策略：拒绝新增调用。\"}
```

判定：触发成功，且事件载荷与消息文案均体现 `reject` 策略，结果符合预期。

## 8. 清理记录（2026-03-10）
为避免影响后续联调，已执行测试数据与键清理：
1. 删除空间 `990021~990024` 的预算规则测试数据。
2. 删除对应 `request_id` 前缀的账单测试数据。
3. 删除本月对应的 Redis `sent/event` 测试键。

执行输出：
```text
cleanup_done_for_spaces=990021,990022,990023,990024
```

## 9. QA-04 剩余场景验证（2026-03-10）
### 9.1 QA04-01/02/03 阈值矩阵（70/90/100）
样本：
1. `space_id=990031`
2. `thresholds=70,90,100`，`monthly_budget=100`，`amount=100`，`policy=warn`

检查接口返回：
```json
{"code":0,"msg":"ok","data":{"checked_spaces":2,"triggered_alerts":3,"deduplicated":0,"failed_checks":0}}
```

Redis 验证：
```text
sent[70]=1, sent[90]=1, sent[100]=1
event[70]/event[90]/event[100] 均存在，usage_rate=100.00
```

判定：70/90/100 阈值触发准确。

### 9.2 QA04-04 多阈值跨越（95 仅触发 70/90）
样本：
1. `space_id=990032`
2. `thresholds=70,90,100`，`monthly_budget=100`，`amount=95`，`policy=warn`

检查接口返回：
```json
{"code":0,"msg":"ok","data":{"checked_spaces":3,"triggered_alerts":2,"deduplicated":3,"failed_checks":0}}
```

Redis 验证：
```text
sent[70]=1, sent[90]=1, sent[100]=nil
event[70]/event[90] 存在，event[100] 不存在
```

判定：跨阈值行为正确，100 阈值未误触发。

### 9.3 QA04-09 禁用规则不触发
样本：
1. `space_id=990033`
2. `threshold=80`，`enabled=0`，`monthly_budget=100`，`amount=95`

检查接口返回：
```json
{"code":0,"msg":"ok","data":{"checked_spaces":3,"triggered_alerts":0,"deduplicated":5,"failed_checks":0}}
```

Redis 验证：
```text
sent[80]=nil
event[80]=nil
```

判定：禁用规则不触发，行为正确。

### 9.4 QA04-10 跨月重置
样本：
1. `space_id=990034`，`threshold=75`，`monthly_budget=100`，`amount=80`
2. 3 月执行两次（`now_ms=2026-03-20`），4 月执行一次（`now_ms=2026-04-10`）

检查接口返回：
```json
cross_march_first={"code":0,"msg":"ok","data":{"checked_spaces":4,"triggered_alerts":1,"deduplicated":5,"failed_checks":0}}
cross_march_second={"code":0,"msg":"ok","data":{"checked_spaces":4,"triggered_alerts":0,"deduplicated":6,"failed_checks":0}}
cross_apr_first={"code":0,"msg":"ok","data":{"checked_spaces":4,"triggered_alerts":1,"deduplicated":0,"failed_checks":0}}
```

Redis 验证：
```text
2026-03 sent[75]=2
2026-04 sent[75]=1
```

判定：月份切换后可重新触发，跨月幂等维度生效。

## 10. 追加清理记录（2026-03-10）
已清理本节新增样本空间与键：
```text
cleanup_done space=990031 prefix=qa04_mtx_ months=2026-03,2026-04 thresholds=70,90,100
cleanup_done space=990032 prefix=qa04_multi_ months=2026-03,2026-04 thresholds=70,90,100
cleanup_done space=990033 prefix=qa04_dis_ months=2026-03,2026-04 thresholds=80
cleanup_done space=990034 prefix=qa04_month_ months=2026-03,2026-04 thresholds=75
```
