# 教师端班级管理功能 - 测试指南

## 📊 完成情况总结

### ✅ 后端开发 (100%)
- ✅ 数据模型层（Entity定义）
- ✅ 数据访问层（Repository）
- ✅ 数据库表（已创建并初始化）
- ✅ API层（Handler + Models）
- ✅ 路由注册（已集成到主路由）

### ✅ 前端开发 (100%)
- ✅ 创建 @coze-edu/teacher 包
- ✅ API 封装和 React Hooks
- ✅ 班级列表页面
- ✅ 创建/编辑班级表单
- ✅ 班级详情页面（成员管理 + 邀请码）
- ✅ 路由集成
- ✅ i18n 翻译
- ✅ ESLint 代码规范检查通过

---

## 🚀 快速开始

### 1. 启动服务

```bash
# 确保 Docker 服务正在运行
docker ps

# 如果需要重启
cd docker
docker compose up -d
```

### 2. 访问前端

打开浏览器访问：
```
http://localhost:8888
```

### 3. 访问教师端功能

教师端路由：
```
/space/{space_id}/edu/teacher/classes       # 班级列表
/space/{space_id}/edu/teacher/classes/{id}  # 班级详情
```

---

## 🧪 功能测试清单

### 测试场景 1：创建班级
- [ ] 访问班级列表页面
- [ ] 点击"创建班级"按钮
- [ ] 填写班级信息：
  - 班级名称（必填）
  - 班级代码（自动生成或自定义）
  - 学期（必填）
  - 描述（可选）
- [ ] 提交表单
- [ ] 验证班级出现在列表中

### 测试场景 2：查看班级详情
- [ ] 点击班级卡片进入详情页
- [ ] 验证班级信息正确显示
- [ ] 检查"成员"和"邀请码"两个Tab

### 测试场景 3：编辑班级
- [ ] 在班级详情页点击"编辑"
- [ ] 修改班级信息
- [ ] 保存并验证更新成功

### 测试场景 4：添加班级成员
- [ ] 切换到"成员" Tab
- [ ] 点击"添加成员"
- [ ] 输入邮箱地址（每行一个）
- [ ] 提交并验证成员列表更新

### 测试场景 5：移除班级成员
- [ ] 在成员列表中点击某个成员的"移除"按钮
- [ ] 确认移除操作
- [ ] 验证成员从列表中消失

### 测试场景 6：创建邀请码
- [ ] 切换到"邀请码" Tab
- [ ] 点击"创建邀请码"
- [ ] 验证邀请码出现在列表中
- [ ] 检查邀请码信息（代码、使用次数、状态）

### 测试场景 7：复制邀请码
- [ ] 点击邀请码旁的复制按钮
- [ ] 验证提示"已复制到剪贴板"
- [ ] 粘贴到其他地方验证内容

---

## 🔧 API 端点列表

| 方法 | 路径 | 功能 | 状态 |
|------|------|------|------|
| POST | `/api/space/:space_id/edu/classes` | 创建班级 | ✅ |
| GET | `/api/space/:space_id/edu/classes/my` | 获取我的班级 | ✅ |
| GET | `/api/space/:space_id/edu/classes/:class_id` | 获取班级详情 | ✅ |
| PUT | `/api/space/:space_id/edu/classes/:class_id` | 更新班级信息 | ✅ |
| POST | `/api/space/:space_id/edu/classes/:class_id/members` | 添加成员 | ✅ |
| GET | `/api/space/:space_id/edu/classes/:class_id/members` | 获取成员列表 | ✅ |
| DELETE | `/api/space/:space_id/edu/classes/:class_id/members/:user_id` | 移除成员 | ✅ |
| POST | `/api/space/:space_id/edu/classes/:class_id/invite-codes` | 创建邀请码 | ✅ |
| GET | `/api/space/:space_id/edu/classes/:class_id/invite-codes` | 获取邀请码 | ✅ |

---

## 📋 数据库表结构

### edu_classes（班级表）
```sql
- id: 主键
- space_id: 空间ID
- name: 班级名称
- code: 班级代码（唯一）
- description: 班级描述
- semester: 学期
- status: 状态（active/archived）
- teacher_id: 教师ID
- created_at: 创建时间
- updated_at: 更新时间
- deleted_at: 软删除时间
```

### edu_class_members（班级成员表）
```sql
- id: 主键
- class_id: 班级ID
- user_id: 用户ID
- role: 角色（teacher/student）
- joined_at: 加入时间
- created_at: 创建时间
```

### edu_class_invite_codes（邀请码表）
```sql
- id: 主键
- class_id: 班级ID
- code: 邀请码（唯一）
- expires_at: 过期时间
- max_uses: 最大使用次数
- used_count: 已使用次数
- is_active: 是否激活
- created_at: 创建时间
```

---

## ⚠️ 已知限制

1. **认证要求**：需要登录后才能访问教师端功能
2. **权限控制**：目前未实现细粒度权限检查（待后续优化）
3. **邮箱验证**：添加成员时未验证邮箱格式（前端有验证规则）
4. **批量操作**：删除成员时只能单个删除，暂不支持批量删除

---

## 🐛 问题排查

### 问题1：访问页面404
**解决方案**：
1. 确认路由路径正确
2. 检查前端是否正确构建：`rush build --to @coze-edu/teacher`
3. 检查路由是否正确导入

### 问题2：API 返回 401
**解决方案**：
1. 确保已登录系统
2. 检查 session_key cookie 是否存在

### 问题3：数据库连接错误
**解决方案**：
1. 确认 MySQL 容器正在运行：`docker ps | grep mysql`
2. 检查数据库表是否已创建
3. 查看后端日志：`docker logs coze-server`

---

## 📚 相关文档

- [开发路线图](../../../docs/edu-platform-development-roadmap.md)
- [技术架构设计](../../../docs/edu-platform-technical-architecture.md)
- [Task 18 进度报告](../../../docs/task-18-progress-report.md)

---

## ✨ 代码质量

### ESLint 检查
```bash
cd frontend/packages/edu-teacher
npm run lint
```

**结果**：✅ 通过（0 errors, 0 warnings）

### 代码优化亮点
1. **组件拆分**：将超长组件拆分为多个小组件，提高可维护性
2. **类型安全**：所有 any 类型都改为具体类型定义
3. **代码规范**：符合项目 ESLint 规则，无批量导出
4. **魔法数字**：硬编码数字提取为命名常量
5. **导入顺序**：自动修复导入顺序问题

---

## 📝 测试记录

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 包构建 | ✅ | rush build 成功 |
| ESLint 检查 | ✅ | 0 errors, 0 warnings |
| TypeScript 编译 | ✅ | 无类型错误 |
| 路由集成 | ✅ | 路由已注册到主应用 |
| API 路由 | ✅ | 后端路由已注册 |
| 数据库表 | ✅ | 表已创建 |
| Docker 服务 | ✅ | 所有容器运行正常 |

---

**生成时间**：2026-02-05
**生成人**：Claude Code
