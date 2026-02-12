# 教师端快速访问指南

## ✅ 已添加的功能

### 1. 主导航菜单中的教师端入口

我已经在主应用的左侧导航栏中添加了"教师端"菜单项，你现在可以通过以下方式访问：

#### 方式一：点击导航菜单（推荐）
1. 打开应用：`http://localhost:8888`
2. 登录后，在左侧导航栏中找到 **"Teacher"（教师端）** 菜单项
3. 图标：👥 团队图标
4. 点击即可进入教师端班级列表页面

#### 方式二：直接访问 URL
```
http://localhost:8888/space/{your_space_id}/edu/teacher/classes
```

---

## 📍 导航栏菜单顺序

现在左侧导航栏的菜单顺序为：
1. 🤖 **Develop** (开发)
2. 📚 **Library** (资源库)
3. 📄 **Education** (教育平台) - 学生端
4. 👥 **Teacher** (教师端) - **[新增]**

---

## 🎨 界面预览

```
┌─────────────────────────────────────────┐
│  Workspace Name              ▼          │
├─────────────────────────────────────────┤
│  🤖  Develop                            │
│  📚  Library                            │
│  📄  Education                          │
│  👥  Teacher          ← 新增菜单项      │
├─────────────────────────────────────────┤
│                                         │
│         (主内容区域)                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 技术实现

### 修改的文件

1. **frontend/packages/foundation/space-ui-adapter/src/const.ts**
   - 添加了 `TEACHER = 'edu/teacher/classes'` 枚举

2. **frontend/packages/foundation/space-ui-adapter/src/components/workspace-sub-menu/index.tsx**
   - 导入 `IconTeam` 和 `IconTeamFilled` 图标
   - 在 `subMenu` 数组中添加教师端菜单项

3. **frontend/packages/arch/resources/studio-i18n-resource/src/locales/zh-CN.json**
   - 添加 `"navigation_workspace_teacher": "教师端"`

4. **frontend/packages/arch/resources/studio-i18n-resource/src/locales/en.json**
   - 添加 `"navigation_workspace_teacher": "Teacher"`

---

## 🚀 使用步骤

### 第一次访问
1. 启动应用并登录
2. 选择或创建一个 Workspace
3. 在左侧菜单点击 **"Teacher"**
4. 进入教师端班级管理页面

### 功能验证
进入教师端后，你可以：
- ✅ 查看"我的班级"列表
- ✅ 点击"创建班级"按钮
- ✅ 填写班级信息并创建
- ✅ 进入班级详情查看成员和邀请码
- ✅ 添加成员、创建邀请码

---

## 📝 注意事项

1. **权限要求**：需要登录后才能访问
2. **Space ID**：确保你在正确的 workspace 中
3. **后端服务**：确保 Docker 容器都在运行
4. **浏览器缓存**：如果看不到新菜单，尝试刷新页面（Ctrl+R 或 Cmd+R）

---

## 🐛 问题排查

### 问题1：看不到"Teacher"菜单
**解决方案**：
1. 清除浏览器缓存并刷新页面
2. 检查是否已登录
3. 确认前端已重新构建：`rush build --to @coze-foundation/space-ui-adapter`

### 问题2：点击菜单后页面404
**解决方案**：
1. 检查路由是否正确配置
2. 确认 URL 格式：`/space/{space_id}/edu/teacher/classes`
3. 查看浏览器控制台是否有错误

### 问题3：菜单显示但功能异常
**解决方案**：
1. 检查后端 API 服务：`docker ps | grep coze-server`
2. 查看后端日志：`docker logs coze-server`
3. 验证数据库表是否创建

---

## ✨ 下一步

现在你可以：
1. 点击左侧的 **"Teacher"** 菜单进入教师端
2. 按照 [TESTING.md](./TESTING.md) 进行完整功能测试
3. 测试班级创建、成员管理、邀请码等功能

---

**更新时间**：2026-02-05
**版本**：v1.0
