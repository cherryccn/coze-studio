# 工作空间图标上传模块检查报告

## 📋 检查结果总结

### ✅ 通过检查的部分

1. **项目架构规范** - 符合
   - `@coze-foundation/space-ui-adapter` 引用 `@coze-common/biz-components` 符合架构规范
   - 其他 foundation 包（如 `account-ui-base`）也同样引用了 common 包
   - 依赖层级关系正确：foundation (基础层) → common (共享组件层)

2. **组件选择** - 正确
   - `PictureUpload` 是项目标准的图标/头像上传组件
   - 所有地方（bot图标、项目图标、工作空间图标）都使用此组件
   - 组件位置：`@coze-common/biz-components/picture-upload`

3. **依赖引用** - 正确
   - `FileBizType`, `IconType` 从 `@coze-arch/bot-api/developer_api` 引入
   - `IconCozUpload` 图标从 `@coze-arch/coze-design/icons` 引入
   - `UploadValue` 类型从 `@coze-common/biz-components/picture-upload` 引入

### ❌ 已修复的问题

**maxSize 参数单位错误**
- **原代码**：`maxSize={2 * 1024 * 1024}` (以为是字节)
- **修正后**：`maxSize={2 * 1024}` (正确单位是 KB)
- **说明**：PictureUpload 组件的 maxSize 参数单位是 **KB**，不是字节
- **限制**：2MB = 2 * 1024 KB

## 📚 参考实现

### 项目表单中的图标上传实现
**文件**：`frontend/packages/studio/workspace/project-entity-base/src/components/project-form/index.tsx`

```tsx
<PictureUpload
  accept=".jpeg,.jpg,.png,.gif"
  label={I18n.t('bot_edit_profile_pircture')}
  field={filedKeyMap.icon_uri}
  rules={[{ required: true }]}
  fileBizType={FileBizType.BIZ_BOT_ICON}
  iconType={IconType.Bot}
  maskIcon={<IconCozUpload />}
  withAutoGenerate
  renderAutoGenerate={renderAutoGenerate}
  generateInfo={() => ({
    name: values?.name,
    desc: values?.description,
  })}
  beforeUploadCustom={onBeforeUpload}
  afterUploadCustom={onAfterUpload}
/>
```

**区别**：
- 项目表单中使用在 `Form` 组件内，需要 `field` 和 `label` props
- 我们的实现在普通 `Modal` 中，不需要这些 props
- 项目表单中包含 AI 自动生成功能 (`withAutoGenerate`)，我们暂不需要

### 当前工作空间创建表单实现
**文件**：`frontend/packages/foundation/space-ui-adapter/src/hooks/use-create-space.tsx`

```tsx
<PictureUpload
  accept=".jpeg,.jpg,.png,.gif"
  value={iconUrl}
  onChange={setIconUrl}
  fileBizType={FileBizType.BIZ_BOT_ICON}
  iconType={IconType.Bot}
  maskIcon={<IconCozUpload />}
  maxSize={2 * 1024}  // ✅ 修正后：2MB = 2*1024 KB
/>
```

## 🔍 PictureUpload 组件详解

### 核心功能
1. **文件上传**：通过 `DeveloperApi.UploadFile()` 上传
2. **Base64 转换**：文件先转为 Base64 再上传
3. **预览显示**：自动显示已上传的图标
4. **编辑遮罩**：hover 时显示编辑按钮
5. **错误处理**：文件大小、格式验证

### 上传流程
```
用户选择文件
    ↓
文件转 Base64
    ↓
调用 DeveloperApi.UploadFile({
  file_head: {
    file_type: 文件扩展名,
    biz_type: FileBizType.BIZ_BOT_ICON
  },
  data: Base64字符串
})
    ↓
返回 { upload_uri, upload_url }
    ↓
保存为 UploadValue: [{ uid: string, url: string }]
    ↓
createSpace 时提取: icon_uri: iconUrl?.[0]?.url || ''
```

### 必需参数
| 参数 | 类型 | 说明 |
|------|------|------|
| `fileBizType` | FileBizType | 业务类型，使用 `BIZ_BOT_ICON` |
| `value` | UploadValue | 受控组件的值 |
| `onChange` | function | 值变化回调 |

### 可选参数
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `accept` | string | `'image/*'` | 接受的文件类型 |
| `maxSize` | number | `2 * 1024` | 最大文件大小 (KB) |
| `iconType` | IconType | `IconType.Bot` | 图标类型 |
| `maskIcon` | ReactNode | - | 编辑按钮图标 |
| `maskMode` | string | `'full-center'` | 遮罩模式 |
| `disabled` | boolean | `false` | 是否禁用 |
| `withAutoGenerate` | boolean | `false` | 是否启用 AI 生成 |

## 📦 相关包依赖关系

```
@coze-foundation/space-ui-adapter (当前包)
    ↓ 依赖
@coze-common/biz-components (共享业务组件)
    ↓ 内部使用
@coze-arch/bot-api (API 客户端)
    ↓ 调用
DeveloperApi.UploadFile (后端 API)
```

## 🎯 最佳实践建议

### 1. 使用标准化配置
```tsx
// ✅ 推荐
fileBizType={FileBizType.BIZ_BOT_ICON}
iconType={IconType.Bot}
maxSize={2 * 1024}  // 2MB

// ❌ 避免
fileBizType={1}  // 使用魔法数字
maxSize={2048000}  // 混淆单位
```

### 2. 数据提取
```tsx
// ✅ 推荐：安全地提取 URL
icon_uri: iconUrl?.[0]?.url || ''

// ❌ 避免
icon_uri: iconUrl[0].url  // 可能报错
```

### 3. 状态管理
```tsx
// ✅ 推荐：使用正确的类型
const [iconUrl, setIconUrl] = useState<UploadValue>([]);

// 清空时
setIconUrl([]);

// ❌ 避免
const [iconUrl, setIconUrl] = useState('');  // 类型不匹配
```

## 🚀 当前实现状态

### 已完成 ✅
- [x] 添加必要的包依赖
- [x] 正确引入组件和类型
- [x] 实现文件上传功能
- [x] 修复 maxSize 单位错误
- [x] 状态管理和数据提取
- [x] 与表单其他字段集成

### 功能特性 ✅
- [x] 支持 .jpeg, .jpg, .png, .gif 格式
- [x] 2MB 文件大小限制
- [x] 实时预览已上传图标
- [x] Hover 显示编辑按钮
- [x] 可选字段（不强制上传）
- [x] 与后端 API 正确集成

### 不包含的功能（可选扩展）
- [ ] AI 自动生成图标 (withAutoGenerate)
- [ ] 图标候选列表
- [ ] 自定义上传/下载回调

## 📝 总结

当前的工作空间图标上传实现：
1. ✅ **架构规范正确** - 符合项目分层结构
2. ✅ **组件使用正确** - 使用标准的 PictureUpload 组件
3. ✅ **参数配置正确** - 所有参数符合组件规范
4. ✅ **功能完整可用** - 满足工作空间创建需求

**修正的唯一问题**：maxSize 单位从字节改为 KB (2 * 1024)

代码现在完全符合项目规范，可以正常使用！🎉
