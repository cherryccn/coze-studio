# 添加工作空间业务逻辑文档

## 概述

本文档详细描述了 Coze Studio 中添加工作空间（Workspace/Space）的完整业务逻辑实现。

## 一、后端数据结构

### 1.1 空间类型（SpaceType）

```typescript
enum SpaceType {
  Personal = 1,  // 个人空间
  Team = 2,      // 团队空间
}
```

- **个人空间**：每个用户有且仅有一个，系统自动创建
- **团队空间**：用户可创建多个，但有数量限制

### 1.2 空间数据模型

**数据库表结构** (`space`):

```sql
CREATE TABLE `space` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned NOT NULL DEFAULT 0,
  `name` varchar(200) NOT NULL DEFAULT '',
  `description` varchar(2000) NOT NULL DEFAULT '',
  `icon_uri` varchar(200) NOT NULL DEFAULT '',
  `creator_id` bigint unsigned NOT NULL DEFAULT 0,
  `created_at` bigint unsigned NOT NULL DEFAULT 0,
  `updated_at` bigint unsigned NOT NULL DEFAULT 0,
  `deleted_at` bigint unsigned NULL,
  PRIMARY KEY (`id`)
)
```

**前端类型定义**:

```typescript
interface SaveSpaceV2Request {
  space_id?: string;        // 空间ID（创建时不传）
  name: string;            // 空间名称（必填，最大50字符）
  description: string;     // 空间描述（最大200字符）
  icon_uri: string;        // 图标URI
  space_type: SpaceType;   // 空间类型
  space_mode?: SpaceMode;  // 空间模式
  space_config?: SpaceConfigV2; // 空间配置
}

interface SaveSpaceRet {
  id?: string;              // 创建成功后返回的空间ID
  check_not_pass?: boolean; // 机审校验是否失败
}
```

### 1.3 空间成员关系（SpaceUser）

```sql
CREATE TABLE `space_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `space_id` bigint unsigned NOT NULL DEFAULT 0,
  `user_id` bigint unsigned NOT NULL DEFAULT 0,
  `role_type` int NOT NULL DEFAULT 3,  -- 1:owner, 2:admin, 3:member
  `created_at` bigint unsigned NOT NULL DEFAULT 0,
  `updated_at` bigint unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_space_user` (`space_id`, `user_id`)
)
```

## 二、API接口

### 2.1 创建/更新空间

**接口**: `POST /api/playground_api/space/save_v2`

**请求参数**: `SaveSpaceV2Request`

**响应数据**:
```typescript
{
  code: number;
  msg: string;
  data: SaveSpaceRet;
}
```

**前端调用**:
```typescript
import { PlaygroundApi } from '@coze-arch/bot-api';

const result = await PlaygroundApi.SaveSpaceV2({
  name: 'My Team Space',
  description: 'Team workspace for collaboration',
  icon_uri: '',
  space_type: SpaceType.Team,
});
```

### 2.2 获取空间列表

**接口**: `POST /api/playground_api/space/list`

**响应数据**:
```typescript
{
  code: number;
  msg: string;
  data: {
    bot_space_list: BotSpace[];         // 所有空间列表
    has_personal_space: boolean;        // 是否有个人空间
    team_space_num: number;             // 已创建团队空间数量
    max_team_space_num: number;         // 最大团队空间数量
    recently_used_space_list: BotSpace[];
  }
}
```

## 三、前端实现

### 3.1 状态管理（SpaceStore）

**位置**: `frontend/packages/foundation/space-store-adapter/src/space/index.ts`

**关键状态**:
```typescript
interface SpaceStoreState {
  space: BotSpace;              // 当前选中的空间
  spaceList: BotSpace[];        // 所有空间列表
  createdTeamSpaceNum: number;  // 已创建团队空间数量
  maxTeamSpaceNum: number;      // 最大团队空间数量（默认3）
}
```

**关键方法**:
```typescript
interface SpaceStoreAction {
  // 创建空间
  createSpace: (request: SaveSpaceV2Request) => Promise<SaveSpaceRet | undefined>;

  // 刷新空间列表
  fetchSpaces: (force?: boolean) => Promise<SpaceInfo | undefined>;

  // 获取个人空间ID
  getPersonalSpaceID: () => string | undefined;
}
```

### 3.2 创建空间Hook

**位置**: `frontend/packages/foundation/space-ui-adapter/src/hooks/use-create-space.tsx`

**功能特性**:

1. **数量限制检查**
   ```typescript
   const canCreateTeamSpace = createdTeamSpaceNum < maxTeamSpaceNum;
   ```

2. **机审校验处理**
   ```typescript
   if (result?.check_not_pass) {
     Toast.warning('空间名称或描述包含不当内容，请修改后重试');
     return;
   }
   ```

3. **表单验证**
   - 空间名称：必填，最大50字符
   - 空间描述：可选，最大200字符

4. **创建成功后处理**
   - 刷新空间列表
   - 显示成功提示
   - 可选：自动跳转到新空间
   - 可选：触发自定义回调

**使用示例**:
```typescript
const { node, open, canCreateTeamSpace } = useCreateSpace({
  autoNavigate: true,  // 创建成功后自动跳转
  onSuccess: (spaceId) => {
    console.log('Space created:', spaceId);
  },
});

// 在组件中渲染模态框
<>
  <Button onClick={open} disabled={!canCreateTeamSpace}>
    添加工作空间
  </Button>
  {node}
</>
```

## 四、业务流程

### 4.1 创建工作空间完整流程

```
用户点击"添加工作空间"
    ↓
检查团队空间数量限制
    ↓ (未达到上限)
显示创建空间模态框
    ↓
用户输入空间名称和描述
    ↓
点击确认按钮
    ↓
前端表单验证（非空、长度限制）
    ↓
调用 PlaygroundApi.SaveSpaceV2
    ↓
后端接收请求
    ↓
后端机审校验（名称、描述）
    ↓ (校验通过)
创建空间记录到数据库
    ↓
创建空间成员关系（创建者为owner）
    ↓
返回 { id: "新空间ID", check_not_pass: false }
    ↓
前端刷新空间列表
    ↓
显示成功提示
    ↓
自动跳转到新空间的develop页面
```

### 4.2 错误处理流程

**达到数量上限**:
```typescript
if (!canCreateTeamSpace) {
  Toast.warning(`已达到团队空间上限（${maxTeamSpaceNum}个）`);
  return;
}
```

**机审不通过**:
```typescript
if (result?.check_not_pass) {
  Toast.warning('空间名称或描述包含不当内容，请修改后重试');
  // 保持模态框打开，允许用户修改
  return;
}
```

**网络错误**:
```typescript
catch (error) {
  Toast.error((error as Error)?.message || '创建工作空间失败');
  console.error('Create space error:', error);
}
```

## 五、权限控制（预留接口）

### 5.1 资源类型定义

```go
const (
  ResourceTypeWorkspace = 2  // 工作空间资源类型
)
```

### 5.2 权限检查接口

```go
type CheckAuthzData struct {
  ResourceIdentifier []*ResourceIdentifier  // 资源标识符
  OperatorID         int64                  // 操作者ID
}

type CheckAuthzResult struct {
  Decision Decision  // Allow(1) 或 Deny(2)
}
```

### 5.3 预留权限实现点

**创建空间时的权限检查**:
```typescript
// 未来可在这里添加权限检查
const hasCreatePermission = await checkPermission({
  resourceType: ResourceType.Workspace,
  action: 'create',
});

if (!hasCreatePermission) {
  Toast.warning('您没有创建工作空间的权限');
  return;
}
```

**空间类型权限**:
- 个人空间：自动创建，用户拥有完全权限
- 团队空间：
  - 创建者自动成为 Owner（role_type=1）
  - 可邀请成员（role_type=2: Admin, 3: Member）
  - 未来可实现细粒度权限控制

## 六、测试要点

### 6.1 功能测试

- [ ] 创建团队空间成功
- [ ] 空间名称验证（非空、最大长度）
- [ ] 空间描述验证（最大长度）
- [ ] 数量限制检查
- [ ] 机审不通过提示
- [ ] 创建成功后列表刷新
- [ ] 自动跳转到新空间

### 6.2 边界测试

- [ ] 达到最大空间数量时禁用创建按钮
- [ ] 输入特殊字符（emoji、换行等）
- [ ] 网络错误处理
- [ ] 并发创建（防止重复提交）

### 6.3 UI测试

- [ ] 模态框居中显示
- [ ] 加载状态显示
- [ ] 错误提示样式
- [ ] 表单清空逻辑
- [ ] 取消按钮功能

## 七、国际化（i18n）

### 7.1 新增翻译key

需要在翻译文件中添加以下key：

```json
{
  "workspace_description": "描述",
  "workspace_description_placeholder": "请输入工作空间描述",
  "workspace_create_limit_reached": "您已创建 {{current}} 个团队空间，已达上限（{{max}}个）",
  "workspace_create_limit_warning": "您已创建 {{current}}/{{max}} 个团队空间，请先删除不使用的空间再创建新空间",
  "workspace_create_limit_reached_short": "已达到团队空间上限",
  "workspace_create_check_failed": "工作空间名称或描述包含不当内容，请修改后重试",
  "Optional": "可选"
}
```

## 八、未来扩展

### 8.1 图标上传功能

```typescript
// 添加图标上传组件
<Upload
  accept="image/*"
  maxSize={2 * 1024 * 1024}  // 2MB
  onChange={(file) => {
    // 上传到存储服务
    // 获取 icon_uri
  }}
/>
```

### 8.2 空间模板

```typescript
// 预设空间模板
const spaceTemplates = [
  { name: '开发团队', description: '用于软件开发协作', icon: '...' },
  { name: '营销团队', description: '用于市场营销活动', icon: '...' },
  { name: '客服团队', description: '用于客户支持', icon: '...' },
];
```

### 8.3 成员邀请

```typescript
// 创建完成后可直接邀请成员
interface InviteMemberRequest {
  space_id: string;
  user_ids: string[];
  role_type: number;  // 1:owner, 2:admin, 3:member
}
```

## 九、相关文件清单

### 前端文件
- `frontend/packages/foundation/space-ui-adapter/src/hooks/use-create-space.tsx` - 创建空间Hook
- `frontend/packages/foundation/space-ui-adapter/src/components/workspace-sub-menu/index.tsx` - 空间切换菜单
- `frontend/packages/foundation/space-store-adapter/src/space/index.ts` - 空间状态管理
- `frontend/packages/arch/bot-api/src/playground-api.ts` - API调用封装
- `frontend/packages/arch/idl/src/auto-generated/playground_api/namespaces/playground.ts` - API类型定义

### 后端文件
- `backend/domain/user/entity/space.go` - 空间实体定义
- `backend/domain/user/service/user_impl.go` - 用户服务实现
- `backend/domain/user/internal/dal/space.go` - 空间数据访问
- `backend/api/handler/coze/playground_service.go` - API处理器
- `backend/domain/permission/permission.go` - 权限检查接口

### 数据库
- `docker/volumes/mysql/schema.sql` - 数据库表结构

## 十、注意事项

1. **默认空间数量限制**：目前默认最大3个团队空间，可通过后端配置调整
2. **个人空间**：系统自动创建，用户无法手动创建第二个个人空间
3. **机审校验**：后端会对空间名称和描述进行内容审核
4. **会话认证**：所有API调用需要有效的session cookie
5. **并发控制**：使用 `confirmLoading` 防止重复提交
6. **错误处理**：所有错误都应该给用户友好的提示信息

## 十一、更新日志

### 2025-02-02
- ✅ 实现基础创建工作空间功能
- ✅ 添加团队空间数量限制检查
- ✅ 添加机审校验处理
- ✅ 添加描述字段（可选）
- ✅ 实现创建成功后自动跳转
- ✅ 完善错误处理和用户提示
- 🔄 权限控制接口预留（待实现）
- 🔄 图标上传功能（待实现）
