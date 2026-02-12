# 教育平台集成测试指南

**创建时间**: 2026-02-04
**状态**: ✅ 路由集成完成，准备测试

---

## 📋 集成完成情况

### ✅ 已完成的工作

1. **路由配置**
   - ✅ 在 `async-components.tsx` 中添加了教育平台组件的 lazy imports
   - ✅ 在 `index.tsx` 中配置了完整的教育平台路由
   - ✅ 默认入口指向学习中心（`/space/:space_id/edu/learning-center`）

2. **依赖管理**
   - ✅ 在主应用 `package.json` 中添加了 `@coze-edu/common` 和 `@coze-edu/learning` 依赖
   - ✅ 运行 `rush update` 成功安装所有依赖
   - ✅ TypeScript 编译无错误

3. **新增路由**
   ```
   /space/:space_id/edu
   ├─ /learning-center          # 学习中心（默认入口）
   ├─ /my-projects              # 我的项目
   ├─ /projects/:projectId/script-learning  # 剧本学习工作区
   ├─ /scripts                  # 剧本列表（遗留，向后兼容）
   └─ /scripts/:id              # 剧本详情（遗留）
   ```

---

## 🚀 如何启动和测试

### 1. 启动后端服务

```bash
cd /home/hjy/work/coze-studio

# 方式 1：使用 Docker（推荐）
cd docker
docker compose up -d

# 方式 2：本地启动
make middleware  # 启动中间件服务（MySQL、Redis 等）
make server      # 启动 Go 后端
```

**验证后端启动成功**：
```bash
curl http://localhost:8888/api/health
```

### 2. 启动前端服务

```bash
cd /home/hjy/work/coze-studio/frontend/apps/coze-studio
npm run dev
```

**预期输出**：
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 3. 访问教育平台

浏览器访问：
```
http://localhost:3000/space/{space_id}/edu
```

**获取 space_id**：
- 登录后，从 URL 中获取你的个人空间 ID
- 或者使用测试数据中的 space_id: `7602171965524148224`

---

## 🧪 测试流程

### 测试用例 1：学习中心访问

1. **访问学习中心**
   ```
   http://localhost:3000/space/{space_id}/edu/learning-center
   ```

2. **预期结果**：
   - ✅ 页面正常加载
   - ✅ 显示 Tab 切换（剧本学习 / 模板学习）
   - ✅ 显示搜索框和筛选器
   - ✅ 显示剧本卡片（如果有数据）

3. **可能的错误**：
   - ❌ 404 错误 → 检查路由配置
   - ❌ 空白页面 → 打开浏览器控制台查看错误
   - ❌ API 错误 → 检查后端是否启动

### 测试用例 2：我的项目页面

1. **访问我的项目**
   ```
   http://localhost:3000/space/{space_id}/edu/my-projects
   ```

2. **预期结果**：
   - ✅ 页面正常加载
   - ✅ 显示项目列表（可能为空）
   - ✅ 显示筛选器和搜索框
   - ✅ 显示"前往学习中心"按钮（如果没有项目）

### 测试用例 3：完整学习流程（如果有数据）

**前置条件**：数据库中需要有剧本数据

1. **浏览剧本** → 学习中心选择剧本
2. **开始学习** → 点击"开始学习"按钮
3. **创建项目** → 系统创建学习项目记录
4. **进入工作区** → 跳转到剧本学习页面
   ```
   /space/{space_id}/edu/projects/{projectId}/script-learning
   ```
5. **学习互动**：
   - 左侧：查看学习进度和阶段指导
   - 右侧：Bot 对话 + Markdown 编辑器
6. **提交产出** → 点击"完成当前阶段"
7. **AI 评估** → 查看评估结果
8. **下一阶段** → 进入第 2 阶段（重复步骤 5-7）
9. **完成项目** → 三个阶段全部完成后返回项目列表

---

## 🐛 常见问题排查

### 问题 1：页面 404 Not Found

**原因**：路由配置未生效

**解决**：
```bash
# 1. 清除缓存并重启
rm -rf frontend/apps/coze-studio/.rsbuild
cd frontend/apps/coze-studio
npm run dev
```

### 问题 2：组件导入错误

**错误示例**：
```
Module not found: Error: Can't resolve '@coze-edu/learning'
```

**解决**：
```bash
# 1. 检查依赖是否安装
ls frontend/packages/edu-learning/node_modules

# 2. 重新安装依赖
rush update --purge

# 3. 重启开发服务器
```

### 问题 3：API 调用失败

**错误示例**：
```
GET http://localhost:3000/api/space/.../edu/... 404
```

**解决**：
1. 检查后端是否启动：`curl http://localhost:8888/api/health`
2. 检查 API 路由配置（backend/api/router/edu/）
3. 检查代理配置（如果使用代理）

### 问题 4：样式错误或组件显示异常

**解决**：
```bash
# 检查 Semi Design 版本
grep "@coze-arch/coze-design" frontend/packages/edu-learning/package.json

# 确保使用一致的 coze-design 版本
```

### 问题 5：数据库无数据

**解决**：
```bash
# 初始化测试数据
cd /home/hjy/work/coze-studio/backend/infra/database/sql
mysql -u root -p < edu_platform_v1_test_data.sql
```

---

## 📝 测试检查清单

### 前端测试

- [ ] 学习中心页面正常加载
- [ ] 我的项目页面正常加载
- [ ] 剧本学习页面正常加载
- [ ] Tab 切换功能正常
- [ ] 搜索和筛选功能正常
- [ ] 路由导航正常（页面间跳转）
- [ ] 样式显示正确
- [ ] 无控制台错误

### API 测试

- [ ] 获取剧本列表 API 正常
- [ ] 获取剧本详情 API 正常
- [ ] 创建项目 API 正常
- [ ] 获取项目列表 API 正常
- [ ] 更新阶段产出 API 正常
- [ ] 完成阶段 API 正常（触发 AI 评估）

### 集成测试

- [ ] 完整的学习流程可以走通
- [ ] 数据持久化正常
- [ ] AI 评估结果正确返回
- [ ] 页面状态更新正常

---

## 🔧 调试技巧

### 1. 浏览器控制台

打开浏览器开发者工具（F12）：
- **Console**：查看 JavaScript 错误
- **Network**：查看 API 请求和响应
- **React DevTools**：检查组件状态

### 2. 后端日志

```bash
# Docker 方式
docker logs -f coze-studio-backend

# 本地方式
tail -f logs/coze-studio.log
```

### 3. 数据库查询

```bash
mysql -u root -p

USE coze_studio;

-- 查看剧本数据
SELECT * FROM edu_scripts LIMIT 10;

-- 查看学生项目
SELECT * FROM edu_student_projects WHERE user_id = YOUR_USER_ID;

-- 查看评估记录
SELECT * FROM edu_evaluations ORDER BY created_at DESC LIMIT 10;
```

---

## ✅ 验收标准

当以下所有项目都能正常工作时，集成测试即为通过：

1. ✅ 所有页面都能正常加载，无 404 错误
2. ✅ API 调用正常，数据正确返回
3. ✅ 用户可以完成完整的学习流程（如果有数据）
4. ✅ 无关键性 JavaScript 错误
5. ✅ 样式显示正确，UI 交互流畅

---

## 📌 下一步工作

集成测试通过后，可以进入下一阶段开发：

1. **优先级 1**：修复测试中发现的 bug
2. **优先级 2**：开始教师端功能开发（Task 18-21）
3. **优先级 3**：完善权限验证系统（Task 22）
4. **优先级 4**：集成真实 Bot API（Task 23）

---

**创建者**: Claude Code
**更新时间**: 2026-02-04 15:20
