# 贡献指南

## 开发规范

- 包管理器：pnpm（见 `package.json`）
- 新功能**必须**伴随测试：单测（Vitest）+ 必要时 e2e（Playwright）
- 提交前跑 `pnpm lint && pnpm test`

## 常用命令

```bash
pnpm dev              # 本地开发 (localhost:3000)
pnpm build            # 生产构建
pnpm lint             # ESLint
pnpm test             # Vitest 单测
pnpm test:watch       # 单测 watch
npx vitest run <file> # 跑单个测试文件
```

## spec / plan 工作流

面向非平凡的功能或架构改动，先写设计 spec 再写实施 plan：

1. **spec（设计规范）** —— 战略层，落在 `docs/superpowers/specs/YYYY-MM-DD-<kebab-slug>-design.md`。回答"做什么、为什么、边界在哪"。
2. **plan（实施计划）** —— 可执行清单，落在 `docs/superpowers/plans/YYYY-MM-DD-<kebab-slug>-plan.md`。由 task 组成，每个 task 有 step-by-step 指令 + 验证命令。
3. 完成后（所有 task 已合并），把 spec + plan 一同移到 `docs/superpowers/archive/`。

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>
```

类型：`feat | fix | refactor | test | docs | chore | perf`

示例（摘自本仓库 git log）：

- `feat: inject world bible context into chapter generation`
- `fix: preserve whitespace in paragraph rendering`
- `refactor: rewrite use-chapter-generation with timeout and retry`

## CHANGELOG 与发布

每次发布按 [Keep a Changelog](https://keepachangelog.com/) 更新 `CHANGELOG.md`（Added / Changed / Fixed / Deferred），并在 main 分支打 annotated tag：

```bash
git tag -a v0.X.0 -m "v0.X.0: 简述"
```

## 目录约定

- 生成产物（构建、缓存、报告）必须 gitignore，不进入仓库
- 源码 alias `@/*` → `./src/*`（见 `tsconfig.json`）
- 单测文件和源码同目录（`*.test.ts` / `*.test.tsx`）
- e2e 测试集中在 `tests/`
- 中文 UI 文案；设计参考注释用 `D-XX` 编号引用
