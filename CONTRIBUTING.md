# 贡献指南

## 开发环境

- Node.js 20+
- pnpm 10+
- 推荐使用 `pnpm` 作为唯一包管理器

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
npx vitest run <file>
```

## 开发约定

- 所有 UI 文案使用中文
- UI 与视觉调整前先读 `DESIGN.md`
- 路径别名：`@/*` -> `./src/*`
- 测试文件与源码同目录：`*.test.ts` / `*.test.tsx`
- 软删除实体必须处理 `deletedAt: Date | null`
- 项目级数据库通过 `createProjectDB(projectId)` 获取

## 提交与校验

提交前至少运行：

```bash
pnpm lint && pnpm test
```

提交信息遵循 Conventional Commits：

```text
<type>(<scope>): <subject>
```

常用类型：`feat`、`fix`、`refactor`、`test`、`docs`、`chore`、`perf`

## Pull Request 建议

- 描述改动目的和影响范围
- 关联涉及的页面或模块
- UI 改动附截图
- 明确是否影响 IndexedDB schema、AI provider 或导出格式

## 发布说明

- 版本变更记录维护在 `CHANGELOG.md`
- 发布前确保 `package.json` 版本与 changelog 口径一致
