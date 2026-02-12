# @coze-edu/common

教育平台 - 公共组件和工具库

## 功能说明

提供教育平台通用的组件、工具函数、类型定义和常量：

- **Components**: 通用UI组件（Loading、EmptyState、ErrorBoundary等）
- **Hooks**: 通用React Hooks（useProject、useEvaluation等）
- **Utils**: 工具函数（时间格式化、评分计算等）
- **Types**: 通用类型定义（ProjectType、StageStatus等）
- **API**: API调用封装
- **Constants**: 常量定义

## 使用示例

```tsx
import { ProjectType } from '@coze-edu/common/types';
import { useProject } from '@coze-edu/common/hooks/use-project';
import { ScoreCard } from '@coze-edu/common/components/score-card';
```

## 安装

```bash
rush update
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 测试

```bash
npm run test
npm run test:cov  # 带覆盖率
```

## Lint

```bash
npm run lint
```
