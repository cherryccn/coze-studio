# 垂直侧边导航菜单

全新的垂直布局侧边导航菜单组件，提供统一的导航体验。

## 功能特性

### 顶部区域
- ✅ **应用 Logo**：显示 "扣子" 文字和图标
- ✅ **空间切换下拉框**：支持搜索和切换空间
- ✅ **创建按钮**：浅灰色背景、圆角样式的创建按钮

### 导航菜单
- ✅ **三个视觉分组**：组与组之间有明显间距分隔
  - 第一组：主页、项目开发、资源库、任务中心、效果评测、空间配置（带橙色提示圆点）
  - 第二组：模板商店、插件商店、作品社区
  - 第三组：API 管理、文档中心、通用管理
- ✅ **图标 + 文字**：每个菜单项由图标和文字水平排列
- ✅ **高亮状态**：当前选中的菜单项有浅灰色背景
- ✅ **悬停效果**：鼠标悬停时有轻微的背景色变化

### 交互功能
- ✅ 点击菜单项切换选中状态并更新高亮样式
- ✅ 鼠标悬停反馈
- ✅ 支持空间切换
- ✅ 创建按钮点击事件

### 视觉风格
- 简约浅色系配色
- 白色背景，深灰色文字
- 选中态浅灰色背景
- 统一的图标风格（线性/填充双态）

## 快速开始

### 1. 基础组件（space-ui-base）

基础的垂直侧边栏菜单组件：

```typescript
import { VerticalSidebarMenu } from '@coze-foundation/space-ui-base';

<VerticalSidebarMenu
  onLogoClick={() => console.log('Logo clicked')}
  currentSpace={currentSpace}
  spaceList={spaceList}
  onSpaceSwitch={(spaceId) => navigate(`/space/${spaceId}/home`)}
  onCreateClick={() => console.log('Create clicked')}
  menuGroups={menuGroups}
  currentMenuKey="home"
  onAddSpace={() => openCreateSpaceModal()}
/>
```

### 2. 适配器组件（space-ui-adapter）

集成了路由、状态管理和事件处理的完整实现：

```typescript
import { VerticalSidebarMenuAdapter } from '@coze-foundation/space-ui-adapter';

// 在布局组件中使用
<Layout>
  <VerticalSidebarMenuAdapter />
  <Content>{children}</Content>
</Layout>
```

## 组件 API

### VerticalSidebarMenu Props

| 属性 | 类型 | 说明 | 必需 |
|------|------|------|------|
| `onLogoClick` | `() => void` | Logo 点击事件 | 否 |
| `currentSpace` | `SpaceInfo` | 当前空间信息 | 否 |
| `spaceList` | `SpaceInfo[]` | 空间列表 | 否 |
| `onSpaceSwitch` | `(spaceId: string) => void` | 空间切换回调 | 否 |
| `onCreateClick` | `() => void` | 创建按钮点击回调 | 否 |
| `menuGroups` | `MenuGroup[]` | 菜单分组数据 | 是 |
| `currentMenuKey` | `string` | 当前选中的菜单 key | 否 |
| `onAddSpace` | `() => void` | 添加空间回调 | 否 |

### MenuItem 接口

```typescript
interface MenuItem {
  key: string;              // 菜单项唯一标识
  icon: React.ReactNode;    // 默认图标
  activeIcon: React.ReactNode; // 激活状态图标
  label: string;            // 菜单文字
  path: string;             // 路由路径
  badge?: boolean;          // 是否显示橙色提示圆点
  onClick?: () => void;     // 点击事件
}
```

### MenuGroup 接口

```typescript
interface MenuGroup {
  items: MenuItem[];        // 该组的菜单项列表
}
```

## 国际化

组件已完整支持国际化，所有用户可见文本都使用 `I18n.t()` 函数：

### 中文翻译（zh-CN.json）
```json
{
  "navigation_home": "主页",
  "navigation_workspace_develop": "项目开发",
  "navigation_workspace_library": "资源库",
  "navigation_task_center": "任务中心",
  "navigation_effect_test": "效果评测",
  "navigation_space_config": "空间配置",
  "navigation_template_store": "模板商店",
  "navigation_plugin_store": "插件商店",
  "navigation_community": "作品社区",
  "navigation_api_management": "API 管理",
  "navigation_doc_center": "文档中心",
  "navigation_general_management": "通用管理",
  "app_name_coze": "扣子",
  "button_create": "创建",
  "workspace_search_placeholder": "搜索空间"
}
```

### 英文翻译（en.json）
```json
{
  "navigation_home": "Home",
  "navigation_workspace_develop": "Development",
  "navigation_workspace_library": "Library",
  ...
}
```

## 使用示例

### 完整示例

```typescript
import React from 'react';
import { VerticalSidebarMenuAdapter } from '@coze-foundation/space-ui-adapter';
import { Layout } from '@coze-arch/coze-design';

export const AppLayout: React.FC = ({ children }) => {
  return (
    <Layout className="h-screen">
      <VerticalSidebarMenuAdapter />
      <Layout.Content className="flex-1 overflow-auto">
        {children}
      </Layout.Content>
    </Layout>
  );
};
```

### 自定义菜单项

```typescript
import { VerticalSidebarMenu, type MenuGroup } from '@coze-foundation/space-ui-base';

const customMenuGroups: MenuGroup[] = [
  {
    items: [
      {
        key: 'dashboard',
        icon: <IconDashboard />,
        activeIcon: <IconDashboardFill />,
        label: '仪表盘',
        path: '/dashboard',
        onClick: () => navigate('/dashboard'),
      },
      // ... 更多菜单项
    ],
  },
];

<VerticalSidebarMenu
  menuGroups={customMenuGroups}
  currentMenuKey="dashboard"
  // ... 其他 props
/>
```

## 样式定制

组件使用 Tailwind CSS 和 Coze Design System 的设计令牌：

- `coz-bg-max`: 最大亮度背景色（白色）
- `coz-bg-secondary`: 次级背景色（浅灰色）
- `coz-bg-secondary-hovered`: 次级背景悬停色
- `coz-bg-brand`: 品牌色背景
- `coz-fg-primary`: 主要文字颜色
- `coz-fg-secondary`: 次要文字颜色
- `coz-fg-tertiary`: 三级文字颜色
- `coz-fg-brand`: 品牌色文字
- `coz-stroke-primary`: 主要边框颜色

## 注意事项

1. **图标要求**：必须从 `@coze-arch/coze-design/icons` 导入图标
2. **国际化**：所有文本必须使用 `I18n.t()` 并配合 `useMemo` 缓存
3. **路由依赖**：适配器组件依赖 `react-router-dom` 的 `useNavigate` 和 `useLocation`
4. **状态管理**：适配器组件使用 `@coze-foundation/space-store` 管理空间状态

## 文件结构

```
frontend/packages/foundation/
├── space-ui-base/
│   └── src/
│       └── components/
│           └── vertical-sidebar-menu/
│               └── index.tsx          # 基础组件
└── space-ui-adapter/
    └── src/
        └── components/
            └── vertical-sidebar-menu-adapter/
                └── index.tsx          # 适配器组件
```

## 相关资源

- [Coze Design System](../coze-design/README.md)
- [国际化文档](../../arch/resources/studio-i18n-resource/README.md)
- [空间管理](../space-store/README.md)
