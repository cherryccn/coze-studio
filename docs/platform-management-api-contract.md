# 平台管理接口契约文档（MVP）

## 1. 文档信息
- 版本：`v0.1`
- 状态：`Draft`（用于前后端联调基线）
- 更新时间：`2026-03-06`
- 关联文档：
  - [平台管理产品需求文档（PRD）](./prd.md)
  - [平台管理开发流程与技术工作文档](./development-flow.md)
  - [平台管理任务工作进度文档](./platform-management-work-progress.md)

## 2. 契约目标
1. 冻结平台管理模块的字段口径，减少联调返工。
2. 冻结分页、排序、筛选规则，避免前后端协议漂移。
3. 给 QA 提供可直接转测试用例的验收输入/输出样例。

## 3. 全局约定

### 3.1 通用响应结构
```json
{
  "code": 0,
  "msg": "ok",
  "data": {}
}
```

- `code = 0` 表示成功。
- 非 0 表示失败，见第 8 节错误码。

### 3.2 时间与时区
1. 时间戳字段统一使用毫秒级 Unix 时间戳（`int64`）。
2. 日期聚合展示字段（例如 `date`）统一为 `YYYY-MM-DD`。
3. 默认时区：`Asia/Shanghai`（可后续扩展 `tz` 参数）。

### 3.3 分页约定
1. 入参：`page`（从 1 开始）、`size`（建议 20，最大 200）。
2. 出参：`page`、`size`、`total`、`list`。

### 3.4 排序约定
1. 入参：`order_by`、`order_direction`（`asc`/`desc`）。
2. 非白名单字段一律返回参数错误。

### 3.5 枚举约定
- `project_type`: `agent` / `app` / `workflow` / `all`
- `status`: `success` / `failed` / `refund`
- `over_limit_policy`: `warn` / `reject`

## 4. 接口清单（MVP）
1. `GET /api/platform/billing/overview`
2. `GET /api/platform/billing/records`
3. `POST /api/platform/billing/records/export`
4. `GET /api/platform/billing/records/export/status`
5. `GET /api/platform/billing/budgets`
6. `POST /api/platform/billing/budgets`
7. `GET /api/platform/stats/overview`
8. `GET /api/platform/stats/rankings`
9. `POST /api/platform/billing/budgets/alerts/check`（管理端手动触发，内部联调/验收）

## 5. 接口详细定义

## 5.1 计费总览
`GET /api/platform/billing/overview`

### 请求参数（Query）
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| start_time | int64 | 是 | - | 开始时间（ms） |
| end_time | int64 | 是 | - | 结束时间（ms） |
| space_ids | string | 否 | 空 | 空间 ID 列表，逗号分隔 |
| project_type | string | 否 | `all` | 项目类型 |

### 响应 `data`
```json
{
  "cards": {
    "today_cost": "123.456789",
    "month_cost": "2345.678901",
    "token_consumption": 1234567,
    "active_space_count": 12
  },
  "cost_trend": [
    { "date": "2026-03-01", "amount": "100.123456" }
  ],
  "token_trend": [
    { "date": "2026-03-01", "tokens": 120000 }
  ],
  "top_spaces": [
    { "space_id": 10001, "space_name": "空间A", "amount": "345.678901", "tokens": 300000 }
  ]
}
```

## 5.2 账单明细
`GET /api/platform/billing/records`

### 请求参数（Query）
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| start_time | int64 | 是 | - | 开始时间（ms） |
| end_time | int64 | 是 | - | 结束时间（ms） |
| page | int | 否 | 1 | 页码（>=1） |
| size | int | 否 | 20 | 每页数量（1~200） |
| keyword | string | 否 | 空 | 搜索关键词（空间名/项目名，后续由维表补齐） |
| space_ids | string | 否 | 空 | 空间 ID 列表，逗号分隔 |
| project_type | string | 否 | `all` | 项目类型 |
| order_by | string | 否 | `occurred_at` | 排序字段（白名单） |
| order_direction | string | 否 | `desc` | 排序方向 |

### 排序白名单
1. `occurred_at`
2. `amount`
3. `usage_tokens`

### 响应 `data`
```json
{
  "page": 1,
  "size": 20,
  "total": 100,
  "list": [
    {
      "id": 1,
      "request_id": "req_xxx",
      "space_id": 10001,
      "space_name": "空间A",
      "project_type": "agent",
      "project_id": 20001,
      "project_name": "客服机器人",
      "model_id": "doubao-1.5-pro",
      "usage_tokens": 12000,
      "unit_price": "0.00000100",
      "amount": "12.000000",
      "status": "success",
      "occurred_at": 1772328000000,
      "created_at": 1772328000000
    }
  ]
}
```

## 5.3 账单导出（发起）
`POST /api/platform/billing/records/export`

### 请求体
```json
{
  "start_time": 1772323200000,
  "end_time": 1772927999000,
  "keyword": "",
  "space_ids": [10001, 10002],
  "project_type": "all",
  "order_by": "occurred_at",
  "order_direction": "desc"
}
```

### 响应 `data`
```json
{
  "task_id": "exp_202603061500_abc123",
  "status": "processing"
}
```

## 5.4 账单导出状态查询
`GET /api/platform/billing/records/export/status`

### 请求参数（Query）
| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| task_id | string | 是 | 导出任务 ID |

### 响应 `data`
```json
{
  "task_id": "exp_202603061500_abc123",
  "status": "success",
  "download_url": "https://xxx/export/exp_202603061500_abc123.csv",
  "expire_at": 1773014400000
}
```

`status` 枚举：`processing` / `success` / `failed`

## 5.5 预算规则查询
`GET /api/platform/billing/budgets`

### 请求参数（Query）
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| space_ids | string | 否 | 空 | 空间 ID 列表，逗号分隔；空表示全部 |
| page | int | 否 | 1 | 页码 |
| size | int | 否 | 50 | 每页数量 |

### 响应 `data`
```json
{
  "page": 1,
  "size": 50,
  "total": 2,
  "list": [
    {
      "id": 1,
      "space_id": 10001,
      "space_name": "空间A",
      "monthly_budget": "5000.00",
      "alarm_thresholds": [70, 90, 100],
      "over_limit_policy": "warn",
      "enabled": true,
      "updated_by": 999,
      "updated_at": 1772328000000
    }
  ]
}
```

## 5.6 预算规则保存
`POST /api/platform/billing/budgets`

### 请求体
```json
{
  "rules": [
    {
      "space_id": 10001,
      "monthly_budget": "5000.00",
      "alarm_thresholds": [70, 90, 100],
      "over_limit_policy": "warn",
      "enabled": true
    }
  ]
}
```

### 响应 `data`
```json
{
  "success_count": 1,
  "failed": []
}
```

## 5.7 统计概览
`GET /api/platform/stats/overview`

### 请求参数（Query）
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| start_time | int64 | 是 | - | 开始时间（ms） |
| end_time | int64 | 是 | - | 结束时间（ms） |
| space_ids | string | 否 | 空 | 空间 ID 列表，逗号分隔 |
| project_type | string | 否 | `all` | 项目类型 |

### 响应 `data`
```json
{
  "active_space_dau": 123,
  "active_space_wau": 456,
  "active_project_count": 90,
  "total_calls": 100000,
  "success_rate": "0.9876",
  "avg_latency_ms": 123,
  "total_tokens": 123456789
}
```

## 5.8 统计排行
`GET /api/platform/stats/rankings`

### 请求参数（Query）
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| start_time | int64 | 是 | - | 开始时间（ms） |
| end_time | int64 | 是 | - | 结束时间（ms） |
| metric | string | 是 | - | `calls`/`tokens`/`cost`/`fail_rate` |
| page | int | 否 | 1 | 页码 |
| size | int | 否 | 20 | 每页数量 |
| space_ids | string | 否 | 空 | 空间 ID 列表，逗号分隔 |
| project_type | string | 否 | `all` | 项目类型 |

### 响应 `data`
```json
{
  "page": 1,
  "size": 20,
  "total": 100,
  "list": [
    {
      "project_id": 20001,
      "project_name": "客服机器人",
      "project_type": "agent",
      "calls": 10000,
      "tokens": 2345678,
      "cost": "1234.567890",
      "fail_rate": "0.0123"
    }
  ]
}
```

## 5.9 预算阈值告警手动检查（管理端）
`POST /api/platform/billing/budgets/alerts/check`

### 请求参数（Query）
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| now_ms | int64 | 否 | 当前时间 | 仅用于验收调试，指定告警检查时间（ms） |

### 响应 `data`
```json
{
  "checked_spaces": 2,
  "triggered_alerts": 1,
  "deduplicated": 1,
  "failed_checks": 0
}
```

说明：
1. 该接口仅用于平台管理员触发告警任务检查，便于 `BE-09`/`QA-04` 验收。
2. 正式调度仍由后台 worker 定时执行，本接口不替代定时任务。

## 6. 核心口径（冻结）
1. `token_consumption = prompt_tokens + completion_tokens`
2. `cost_amount = token_consumption * unit_price + extra_charge`
3. `active_space`: 统计周期内至少一次成功调用的空间
4. `success_rate = success_count / total_count`
5. `avg_latency_ms = total_latency_ms / success_count`

## 7. 表结构映射（当前版本）
1. `billing_records`：明细主表，支撑明细查询/导出。
2. `billing_daily_agg`：日聚合表，支撑趋势与统计概览。
3. `billing_budget_rules`：预算规则配置表，支撑预算查询/保存。

## 8. 错误码（MVP）
| code | HTTP | 含义 | 场景 |
|---|---|---|---|
| 0 | 200 | 成功 | - |
| 40001 | 400 | 参数错误 | 时间范围、分页参数非法、枚举非法 |
| 40002 | 400 | 排序字段非法 | `order_by` 不在白名单 |
| 40003 | 400 | 时间范围非法 | `start_time > end_time` |
| 40101 | 401 | 未登录或登录失效 | 鉴权失败 |
| 40301 | 403 | 无平台管理权限 | 非 `platform_admin` |
| 40401 | 404 | 资源不存在 | 导出任务不存在/空间不存在 |
| 40901 | 409 | 冲突 | 预算规则并发更新冲突 |
| 50001 | 500 | 内部错误 | 未分类错误 |

## 9. 联调检查单
1. 时间单位是否均为毫秒。
2. `page/size/total/list` 是否统一。
3. 排序白名单是否后端强校验。
4. 导出任务是否异步与可查询状态。
5. 预算阈值数组是否按升序存储和返回。
6. 权限错误是否统一返回 `40301`。
