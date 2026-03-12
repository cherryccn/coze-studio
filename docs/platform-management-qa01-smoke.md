# QA-01 运行态 Smoke（权限可见性与越权）

## 1. 目标
验证平台管理 MVP 权限方案在以下场景下行为一致：
1. `AdminEmails` 为空时，任意已登录用户可见并可访问平台管理。
2. `AdminEmails` 已配置且当前邮箱命中时，平台管理员可见并可访问平台管理。
3. `AdminEmails` 已配置且当前邮箱未命中时，普通用户不可见且访问平台接口返回 `40301`。

## 2. 当前权限口径
1. 唯一真相源为 `AdminEmails -> platform_management_access`。
2. 不引入 `platform_admin` 新角色。
3. 不引入独立 feature flag / 白名单。
4. `AdminEmails` 为空时，MVP/演示环境默认放行所有已登录用户；正式环境不应保留该配置。

## 3. 前置条件
1. 前后端服务已启动，可访问 `http://127.0.0.1:8888`。
2. 已准备至少 2 个可登录账号：
   - 管理员账号：如 `admin@example.com`
   - 普通账号：如 `member@example.com`
3. 可修改基础配置中的 `AdminEmails`。
4. 可在浏览器登录并获取对应 `session_key`。

## 4. 观测点
> 如需减少手工比对，可使用仓库脚本：
> `scripts/setup/platform_management_qa01_smoke.sh`

### 4.1 账号能力接口
```bash
curl -i -X POST 'http://127.0.0.1:8888/passport/account/info/v2/' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: session_key=<你的会话>' \
  --data '{}'
```

预期关注字段：
1. HTTP `200`
2. `code = 0`
3. `data.platform_management_access = true/false`

### 4.2 平台保护接口
```bash
curl -i 'http://127.0.0.1:8888/api/platform/billing/budgets?page=1&size=20' \
  -H 'Cookie: session_key=<你的会话>'
```

预期关注字段：
1. 有权限时：不应返回 `40301`
2. 无权限时：HTTP `403` 且 `code = 40301`

### 4.3 浏览器表现
1. 左侧菜单是否出现 `平台管理`
2. 直接访问 `/platform` 时是否进入页面
3. 无权限时页面是否展示 `暂无权限查看平台管理内容`

### 4.4 可选脚本化校验
脚本可自动核对：
1. `POST /passport/account/info/v2/` 的 `platform_management_access`
2. 平台保护接口是否命中 `40301`

示例：
```bash
./scripts/setup/platform_management_qa01_smoke.sh \
  --label scene-a-member \
  --session-key '<普通账号会话>' \
  --expect-access true \
  --expect-api allow

./scripts/setup/platform_management_qa01_smoke.sh \
  --label scene-c-member \
  --session-key '<普通账号会话>' \
  --expect-access false \
  --expect-api forbidden
```

说明：
1. 脚本不会验证浏览器菜单显隐和 `/platform` 页面文案，这两项仍需手动确认。
2. 默认平台保护接口使用 `GET /api/platform/billing/budgets?page=1&size=20`，如需替换可用 `--platform-api-path` 覆盖。

## 5. 场景 A：`AdminEmails` 为空
### 5.1 配置
1. 将基础配置中的 `AdminEmails` 置空。

### 5.2 执行
1. 使用普通账号登录浏览器。
2. 调用 `POST /passport/account/info/v2/`。
3. 直接访问 `/platform`。
4. 调用 `GET /api/platform/billing/budgets?page=1&size=20`。

### 5.3 预期
1. `platform_management_access = true`
2. 左侧菜单可见 `平台管理`
3. `/platform` 页面可进入，不显示 `暂无权限查看平台管理内容`
4. 平台接口不返回 `40301`

## 6. 场景 B：`AdminEmails` 包含当前用户
### 6.1 配置
1. 将 `AdminEmails` 设置为管理员邮箱，例如：
```text
admin@example.com
```

### 6.2 执行
1. 使用 `admin@example.com` 登录浏览器。
2. 调用 `POST /passport/account/info/v2/`。
3. 打开 `/platform`。
4. 调用 `GET /api/platform/billing/budgets?page=1&size=20`。

### 6.3 预期
1. `platform_management_access = true`
2. 左侧菜单可见 `平台管理`
3. `/platform` 正常可见平台内容
4. 平台接口不返回 `40301`

## 7. 场景 C：`AdminEmails` 不包含当前用户
### 7.1 配置
1. 保持 `AdminEmails` 为：
```text
admin@example.com
```

### 7.2 执行
1. 使用 `member@example.com` 登录浏览器。
2. 调用 `POST /passport/account/info/v2/`。
3. 检查左侧菜单。
4. 直接访问 `/platform`。
5. 调用 `GET /api/platform/billing/budgets?page=1&size=20`。

### 7.3 预期
1. `platform_management_access = false`
2. 左侧菜单不显示 `平台管理`
3. 直接访问 `/platform` 时显示 `暂无权限查看平台管理内容`
4. 平台接口返回：
   - HTTP `403`
   - `code = 40301`

## 8. 建议记录格式
建议按下表记录结果：

| 场景 | 账号 | `platform_management_access` | 菜单显隐 | `/platform` 页面 | 平台接口 | 结果 |
|---|---|---|---|---|---|---|
| A | 普通账号 | true | 可见 | 可进入 | 非 40301 | 通过/失败 |
| B | 管理员账号 | true | 可见 | 可进入 | 非 40301 | 通过/失败 |
| C | 普通账号 | false | 不可见 | 无权限文案 | 40301 | 通过/失败 |

## 9. 失败排查
1. 场景 A 未放行：优先检查当前环境是否误带了 `AdminEmails` 配置。
2. `platform_management_access` 与接口行为不一致：优先检查 `/passport/account/info/v2/` 与 `/api/platform/*` 是否部署到同一后端版本。
3. 菜单隐藏但手输 `/platform` 仍可进入：优先检查前端页面权限兜底是否为最新版本。
4. 页面无权限但接口返回非 `40301`：优先检查平台路由是否已接入 `PlatformAdminAuthMW`。
