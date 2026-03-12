# 平台管理模块工作文档

## 1. 文档目标
本目录用于沉淀「平台管理」模块（左侧菜单入口）的产品与研发协同文档，覆盖以下范围：
- 计费管理
- 统计模块
- 权限与入口可见性
- 前后端开发与联调流程

## 2. 文档清单
1. [PRD：平台管理产品需求文档](./prd.md)
2. [原型：页面线框与交互稿](./prototype-wireframes.md)
3. [研发：开发流程图、数据模型与接口草案](./development-flow.md)
4. [契约：平台管理接口契约文档（字段级）](./platform-management-api-contract.md)
5. [执行：任务工作进度文档（含上下文不足时的交接记录）](./platform-management-work-progress.md)
6. [Smoke：QA-01 权限运行态验收](./platform-management-qa01-smoke.md)
7. [Smoke：BE-09 预算阈值告警运行态验收](./platform-management-be09-smoke.md)

## 3. 版本信息
- 版本：`v0.1-MVP`
- 更新时间：`2026-03-06`
- 适配范围：Coze Studio 当前空间管理、发布管理、成员管理基础能力

## 4. 交付边界
MVP 先完成「可见、可查、可控」：
- 可见：平台级总览与明细
- 可查：筛选、排序、导出
- 可控：预算与阈值告警（基础版）
