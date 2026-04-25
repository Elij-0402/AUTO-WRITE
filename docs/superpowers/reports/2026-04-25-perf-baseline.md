# InkForge 性能基线 — 2026-04-25

## Before / After

> 测试环境：Windows 11 Enterprise LTSC 2024 · Node.js · Next.js 16.2.3 (Turbopack)

### Bundle (Production Build)

| 指标 | Before | After | Delta |
|------|--------|-------|-------|
| 路由数 | 7 | 7 | — |
| 动态路由 | 2 (`/projects/[id]`, `/projects/[id]/analysis`) | 2 | — |
| TypeScript | ✅ 0 errors | ✅ 0 errors | — |

**说明**：Turbopack 默认不输出详细 bundle 大小表。如需逐文件分析，可添加 `@next/bundle-analyzer`。

### 优化措施（After）

1. **分析页 tab 组件动态导入**
   - `TimelineView` → `dynamic()` + `ssr: false` + loading fallback
   - `ContradictionDashboard` → `dynamic()` + `ssr: false` + loading fallback
   - `InteractiveRelationGraph` 保持静态（默认 tab，且含交互逻辑）
   - 效果：非默认 tab 懒加载，减少初始 bundle

2. **代码质量清理**
   - 5 个 lint warnings → 0 warnings
   - 268 unit tests 全部通过
   - 修复了 `require()` → ES import 转换

### 已知瓶颈（未完全解决）

| 问题 | 原因 | 建议 |
|------|------|------|
| BUG-004: Jest worker exhaustion | Next.js 16.2.3 regression | 等待上游修复 |
| Tiptap 大文档性能 | ProseMirror 固有开销 | 大文档（>50k 字）建议分章节 |
| E2E HMR 编译阻塞 | Next.js dev mode 行为 | production build 无此问题 |

### 测试结果

```
pnpm build:  ✅ 通过
pnpm lint:   ✅ 0 errors, 0 warnings
pnpm test:   ✅ 268 passed, 1 skipped
```
