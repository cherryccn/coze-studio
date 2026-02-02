# 个人空间按钮调试指南

## 在浏览器控制台运行以下代码来诊断问题：

### 1. 检查空间存储状态
```javascript
// 打开浏览器控制台（F12），运行：
window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState()
```

**预期输出应该包含：**
- `inited: true` - 已初始化
- `loading: false` - 未加载中
- `spaceList: [...]` - 空间列表不为空
- `space: { id: "xxx", ... }` - 当前空间有 ID

### 2. 检查当前空间 ID
```javascript
window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState().space.id
```

**如果返回 undefined 或空字符串，说明空间未设置！**

### 3. 检查空间列表
```javascript
window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState().spaceList
```

**应该返回至少包含一个个人空间的数组。**

### 4. 检查个人空间 ID
```javascript
window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState().getPersonalSpaceID()
```

---

## 常见问题及解决方案

### 问题 1：空间未初始化 (`inited: false`)

**原因：** `fetchSpaces()` 未被调用或调用失败

**解决方案：**
1. 检查网络请求是否成功（Network 标签查看 `/api/v1/space/list` 请求）
2. 检查用户登录状态
3. 手动触发初始化：
   ```javascript
   window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState().fetchSpaces(true)
   ```

### 问题 2：空间 ID 未设置 (`space.id` 为空)

**原因：** URL 中没有 `space_id` 参数，或 `setSpace()` 未被调用

**解决方案：**
检查当前 URL 路径格式是否为：`/space/{space_id}/xxx`

如果不是，手动设置空间：
```javascript
const personalSpaceId = window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState().getPersonalSpaceID()
window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState().setSpace(personalSpaceId)
```

### 问题 3：空间列表为空

**原因：** 后端未返回空间数据，或个人空间创建失败

**解决方案：**
1. 检查后端服务是否正常运行
2. 检查数据库中是否有空间数据
3. 尝试手动创建个人空间（会在 fetchSpaces 时自动创建）

### 问题 4：按钮被 CSS 遮挡

**检查方法：**
在浏览器控制台运行：
```javascript
document.querySelector('#workspace-submenu-develop')
```

如果返回 `null`，说明元素未渲染；如果有返回，检查 CSS 属性：
- `pointer-events: none` - 改为 `auto`
- `z-index` - 确保足够高
- `opacity: 0` - 改为 `1`

---

## 代码关键位置

### 初始化入口
- **文件：** `frontend/packages/foundation/space-ui-base/src/hooks/use-init-space.ts`
- **作用：** 初始化空间数据和设置当前空间

### 状态管理
- **文件：** `frontend/packages/foundation/space-store-adapter/src/space/index.ts`
- **关键方法：**
  - `fetchSpaces()` - 获取空间列表
  - `setSpace(id)` - 设置当前空间
  - `getPersonalSpaceID()` - 获取个人空间 ID

### 按钮组件
- **文件：** `frontend/packages/foundation/space-ui-base/src/components/workspace-sub-menu/components/workspace-list-item.tsx`
- **关键逻辑：** 第52-63行的条件渲染和点击事件

---

## 快速修复脚本

如果确认是初始化问题，可以在控制台运行：

```javascript
async function fixSpaceButton() {
  const store = window.__ZUSTAND_DEVTOOLS_STORES__?.botStudio?.spaceStore?.getState();

  if (!store) {
    console.error('❌ 无法访问空间存储');
    return;
  }

  console.log('🔄 正在初始化空间...');
  await store.fetchSpaces(true);

  const personalSpaceId = store.getPersonalSpaceID();

  if (personalSpaceId) {
    console.log('✅ 找到个人空间:', personalSpaceId);
    store.setSpace(personalSpaceId);
    console.log('✅ 已设置当前空间');
    window.location.href = `/space/${personalSpaceId}/develop`;
  } else {
    console.error('❌ 未找到个人空间');
  }
}

fixSpaceButton();
```

---

## 需要后端检查的事项

1. **数据库连接：** MySQL 是否正常运行
2. **空间 API：** `/api/v1/space/list` 接口是否正常返回数据
3. **用户认证：** 登录 token 是否有效
4. **数据表：** `spaces` 表中是否有该用户的个人空间记录

运行后端健康检查：
```bash
# 检查中间件服务
make middleware

# 检查后端服务日志
docker logs coze-studio-backend
```
