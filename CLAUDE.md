# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概览

Coze Studio 是一个集成的 AI 智能体开发平台，包含前端（React + TypeScript）和后端（Go）组件。项目使用由 Rush.js 管理的复杂 monorepo 架构，包含 135+ 个前端包，按 4 层依赖体系组织。

**核心技术栈**：
- 前端：React 18 + TypeScript 5.8 + Rsbuild (Rspack) + Zustand
- 后端：Go 1.24 + Hertz HTTP 框架 + Eino（智能体/工作流引擎）
- 组件库：`@coze-arch/coze-design`（基于 Semi Design ~2.72.3 的定制设计系统）
- 工作流引擎：FlowGram 可视化画布编辑器

## 开发命令

### 快速开始（Docker 部署）
```bash
# 克隆仓库
git clone https://github.com/coze-dev/coze-studio.git
cd coze-studio

# 使用 Docker 部署（推荐首次使用）
make web
# 访问 http://localhost:8888/sign 注册账号
# 在 http://localhost:8888/admin/#model-management 配置模型（必需！）
# 访问应用 http://localhost:8888/

# 停止 Docker 部署
make down_web
```

### 本地开发环境设置
```bash
# 1. 安装前端依赖（使用 rush，不要在根目录使用 npm install）
rush update

# 2. 设置环境文件
make env  # 从示例创建 docker/.env.debug

# 3. 启动中间件服务（MySQL, Redis, ES, Milvus, MinIO, NSQ, etcd）
make middleware

# 4. 设置 Python 环境（用于工作流代码节点）
make python

# 5. 以调试模式启动 Go 后端
make server  # 如需要会先构建前端，然后启动后端

# 替代方案：一次性启动所有服务
make debug  # 等同于：env + middleware + python + server
```

### 前端开发
```bash
# 启动前端开发服务器（http://localhost:3000）
cd frontend/apps/coze-studio
npm run dev

# 仅构建前端
make fe

# Rush monorepo 操作
rush update              # 安装/更新依赖（使用它而不是 npm install）
rush build               # 按依赖顺序构建所有包
rush rebuild -o @coze-studio/app  # 构建特定包及其依赖
rush test                # 运行所有包的测试
rush lint                # 检查所有包
rush commit              # 创建规范化提交

# 操作特定包
cd frontend/packages/[package-path]
npm run build            # 仅构建此包
npm run test             # 运行测试
npm run test:cov        # 运行测试并生成覆盖率报告
npm run lint            # 检查此包
```

### 后端开发
```bash
# 仅构建后端
make build_server

# 运行后端测试
cd backend && go test ./...

# 数据库操作
make sync_db            # 应用 Atlas 迁移到数据库
make dump_db            # 导出 schema 到 HCL 并生成迁移文件
make sql_init           # 初始化 SQL 数据
make dump_sql_schema    # 导出 schema 到 SQL 文件（docker/volumes/mysql/schema.sql）
make atlas-hash         # 重新计算 Atlas 迁移文件哈希

# Elasticsearch 设置
make setup_es_index     # 设置 Elasticsearch 索引
```

### Docker & 清理
```bash
make web                # 启动完整堆栈（如需要会构建镜像）
make down               # 停止所有容器
make clean              # 停止容器并删除卷数据
make build_docker       # 构建 Docker 镜像但不启动
```

## 架构概览

### 前端架构（Rush.js Monorepo）

**4 层包层次结构**（135+ 个包）：
- **Level 1**（`arch/`、`config/`、`infra/`）：核心基础设施、构建配置、设计系统基础
  - `@coze-arch/coze-design`：主设计系统（基于 Semi Design ~2.72.3）- 必须使用这个，不要用 `@douyinfe/semi-ui`
  - `@coze-arch/i18n`：国际化系统，默认 `zh-CN`，回退到 `en-US`
  - `@coze-arch/bot-api`、`@coze-arch/bot-http`：API 层和 HTTP 客户端
  - 构建配置：`eslint-config`、`ts-config`、`rsbuild-config`、`vitest-config` 等

- **Level 2**（`common/`）：共享组件、工具、适配器
  - 聊天组件：`chat-core`、`chat-uikit`、`chat-area`
  - 通用 UI：`virtual-list`、`table-view`、`scroll-view`、`biz-components`
  - FlowGram 适配器：`free-layout-editor`、`fixed-layout-editor`

- **Level 3**（功能域）：业务逻辑模块
  - `agent-ide/`：智能体开发 IDE 组件
  - `workflow/`：工作流画布、节点、渲染、变量
  - `studio/`：Studio 特定组件和功能
  - `foundation/`：账号、空间、布局管理
  - `data/`：知识库、数据库、记忆管理

- **Level 4**（`apps/`）：主应用
  - `@coze-studio/app`：Coze Studio 主应用入口

**关键模式**：
- **适配器模式**：`-adapter` 后缀的包提供层间松耦合（例如 `space-ui-adapter` → `space-ui-base`）
- **Base/Interface 模式**：`-base` 后缀用于共享实现，`-interface` 用于契约
- **工作区引用**：所有内部依赖使用 `workspace:*` 协议

**构建系统**：
- **Rsbuild**（基于 Rspack）提供快速构建和热重载
- **Tailwind CSS** 用于样式（自定义配置在 `@coze-arch/tailwind-config`）
- **IDL 代码生成**：Thrift IDL → TypeScript，通过 `@coze-arch/idl2ts-*` 包

### 后端架构（Go + DDD）

**框架和库**：
- **HTTP 服务器**：Cloudwego Hertz（高性能 Go 框架）
- **AI 引擎**：Cloudwego Eino 用于智能体/工作流运行时、模型抽象、RAG
- **数据库**：GORM 配合 MySQL 8.4+（也支持 OceanBase）
- **缓存**：Redis 8.0
- **搜索**：Elasticsearch 8.18+ 配合 SmartCN 分析器
- **向量数据库**：Milvus v2.5+ 用于嵌入
- **消息队列**：NSQ（也支持 Kafka、Pulsar、RocketMQ、NATS）
- **对象存储**：MinIO（S3 兼容）
- **配置**：etcd 3.5

**DDD 结构**：
```
backend/
├── domain/           # 业务实体和领域逻辑
│   ├── {domain}/     # 每个领域是独立的包
│   └── ...
├── application/      # 应用服务和用例
├── api/              # HTTP 处理器、路由、请求/响应模型
│   ├── handler/      # 请求处理器
│   ├── router/       # 路由注册
│   └── model/        # API 模型
├── infra/            # 基础设施实现
│   ├── database/     # 数据库设置和迁移
│   └── ...
├── crossdomain/      # 跨领域关注点（共享工具）
└── conf/             # 配置文件
    ├── model/        # AI 模型配置（使用前必需）
    └── plugin/       # 插件配置
```

**模型支持**：OpenAI、Volcengine Ark、Claude (Anthropic)、Gemini、Qwen、DeepSeek、Ollama

**数据库迁移**：基于 Atlas 的 schema 管理，支持 HCL 和 SQL 导出

## 关键开发规范

### 前端包开发

#### 组件导入规范（必须遵守）
```typescript
// ✅ 正确 - 始终使用定制设计系统
import { Button, Modal } from '@coze-arch/coze-design';
import { IconPlus } from '@coze-arch/coze-design/icons';

// ❌ 错误 - 永远不要直接导入 Semi UI
import { Button } from '@douyinfe/semi-ui';  // 不要使用
```

#### i18n 最佳实践（强制要求）
```typescript
import { I18n } from '@coze-arch/i18n';

// ✅ 正确 - 始终对用户可见文本使用 I18n.t()
const title = I18n.t('menu_title_personal_space', {}, spaceName);
const label = useMemo(() => I18n.t('button_submit'), []);  // 缓存以避免副作用

// ❌ 错误 - 永远不要硬编码显示文本
const title = 'Personal Space';  // 不要使用
const label = I18n.t('button_submit');  // 缺少 useMemo/useCallback - 可能导致渲染问题
```

**i18n 要点**：
- 翻译文件：`frontend/packages/arch/resources/studio-i18n-resource/src/locales/{zh-CN,en}.json`
- 默认语言：`zh-CN`，回退语言：`en-US`
- 始终在组件中用 `useMemo`/`useCallback` 包装 i18n 调用以防止副作用
- 对于个人空间名称：`I18n.t('menu_title_personal_space', {}, actualName)` - 会返回翻译或回退值

#### 包结构要求
每个包必须包含：
- `README.md`：包的目的和用法
- `package.json`：包含正确的 `workspace:*` 依赖
- `tsconfig.json`：继承自 `@coze-arch/ts-config`
- `eslint.config.js`：继承自 `@coze-arch/eslint-config`

#### 类型导入
```typescript
// 从生成的代码导入 API 类型
import type { BotInfo } from '@coze-arch/bot-api/developer_api';
```

### 后端开发

#### DDD 原则
- 保持领域逻辑纯粹且独立于框架
- 使用接口作为依赖（依赖注入）
- 实现适当的错误处理和自定义错误类型
- 编写全面的领域测试

#### 模型配置（必需）
使用 AI 功能前：
1. 从 `backend/conf/model/template/` 复制模板
2. 配置：`id`、`meta.conn_config.api_key`、`meta.conn_config.model`
3. 支持：OpenAI、Volcengine Ark、Claude、Gemini、Qwen、DeepSeek、Ollama

### 安全注意事项
⚠️ **公网部署风险**（来自 README）：
- 账号注册默认开放
- 工作流代码节点中的 Python 执行环境
- 潜在的 SSRF 漏洞
- 部分 API 存在水平越权风险
- 公网部署前请评估风险并添加防护措施

## 测试策略

### 前端测试（Vitest）
```bash
# 在特定包中运行测试
cd frontend/packages/{package-path}
npm run test              # 运行测试
npm run test:cov         # 生成覆盖率报告

# 在整个 monorepo 中运行所有测试
rush test
```

**按包层级的覆盖率要求**：
- **Level 1**（arch/config/infra）：80% 覆盖率，90% 增量
- **Level 2**（common）：30% 覆盖率，60% 增量
- **Level 3-4**（features/apps）：0% 最低要求（灵活，建议添加覆盖率）

**测试框架**：Vitest（基于 Vite，快速的单元/集成测试）

### 后端测试（Go）
```bash
cd backend
go test ./...                    # 运行所有测试
go test ./domain/bot/...         # 测试特定领域
go test -v -cover ./...          # 带详细覆盖率信息
```

**测试工具**：
- 标准 `testing` 包
- `github.com/stretchr/testify` 用于断言
- `github.com/DATA-DOG/go-sqlmock` 用于数据库 mock
- `github.com/bytedance/mockey` 用于函数 mock

## 常见问题和故障排查

### 前端开发
- ❌ **不要使用** `npm install` 在 monorepo 根目录 → ✅ **使用** `rush update`
- ❌ **不要导入** `@douyinfe/semi-ui` → ✅ **使用** `@coze-arch/coze-design`
- 按依赖顺序构建包：`rush build`
- 热重载问题：检查包中的 Rsbuild 配置
- 语言偏好存储在 localStorage 键：`i18next`（影响初始加载）

### 后端开发
- 确保中间件服务运行：`make middleware`
- 检查数据库连接并根据需要运行 `make sync_db`
- 验证 `backend/conf/model/` 中的模型配置（AI 功能必需）

### Docker 问题
- **最低要求**：2 核 CPU，4GB RAM
- **端口冲突**：检查 8888（前端）或服务端口是否被占用
- **重置环境**：`make clean`（删除容器和卷）
- **首次启动**：可能需要几分钟来拉取/构建镜像
- **启动失败**：查看 [GitHub Wiki 常见问题](https://github.com/coze-dev/coze-studio/wiki/9.-FAQ)

### 数据库问题
```bash
# 重置并同步数据库 schema
make down
make clean
make middleware
make sync_db
```

### Git 操作
```bash
# 使用 Rush 进行提交（强制规范化提交）
rush commit

# 代码检查（在 pre-commit 钩子中自动运行）
rush lint-staged
```

## IDL 和代码生成

**目的**：维护前后端之间的 API 契约

**位置**：`idl/` 目录（Thrift 格式）

**代码生成**：
- **前端**：Thrift IDL → TypeScript，通过 `@coze-arch/idl2ts-*` 包
- **后端**：Thrift IDL → Go 结构体（由 Hertz 框架使用）

**生成代码的使用**：
```typescript
// 导入生成的类型/API
import { BotAPI } from '@coze-arch/bot-api/developer_api';
import type { CreateBotRequest } from '@coze-arch/bot-api/developer_api';
```

## 插件开发

**配置文件**：
- 模板：`backend/conf/plugin/pluginproduct/`
- OAuth schema：`backend/conf/plugin/common/oauth_schema.json`
- 使用官方插件前需添加第三方服务的鉴权密钥

## 重要资源

**官方文档**：
- Wiki：https://github.com/coze-dev/coze-studio/wiki
- API 参考：https://github.com/coze-dev/coze-studio/wiki/6.-API-Reference
- 架构：https://github.com/coze-dev/coze-studio/wiki/7.-Development-Standards
- Coze 平台文档：https://www.coze.cn/open/docs（智能体/工作流使用指南）

**关键依赖**：
- [Eino](https://github.com/cloudwego/eino)：智能体/工作流运行时引擎、模型抽象、RAG
- [FlowGram](https://github.com/bytedance/flowgram.ai)：工作流画布编辑器引擎
- [Hertz](https://github.com/cloudwego/hertz)：后端 Go HTTP 框架

**版本要求**：
- Node.js：>=21
- Go：1.24+
- pnpm：8.15.8（由 Rush 管理）
- Rush：5.147.1

## 贡献指南

- 使用 `rush commit` 创建规范化提交
- 提交前运行 `rush lint-staged`（pre-commit 钩子中自动执行）
- 遵循基于团队的包组织和标签约定
- 确保测试通过：`rush test`（前端）、`cd backend && go test ./...`（后端）
- 参见 [CONTRIBUTING.md](https://github.com/coze-dev/coze-studio/blob/main/CONTRIBUTING.md)
