# InkForge 文档索引

本目录下的文档分两层：**长青参考文档**（直接平级）与 **过程文档**（按日期记录的 specs / plans）。

## 长青参考

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统分层、两层 IndexedDB 模式、域模型
- [AI-LAYER.md](./AI-LAYER.md) — provider 抽象、tool use、prompt caching
- [RAG.md](./RAG.md) — 嵌入、向量存储、hybrid 检索

## 过程文档

- [`superpowers/specs/`](./superpowers/specs) — 设计规范（战略层）
- [`superpowers/plans/`](./superpowers/plans) — 可执行的 task-by-task 实施计划
- [`superpowers/archive/`](./superpowers/archive) — 已完成并入库的 spec + plan 对

### 当前活跃

- `specs/2026-04-18-post-v0.2-roadmap-design.md` + `plans/2026-04-18-post-v0.2-roadmap.md`
  —— v0.3 / v0.4 迭代路线图（F3 已完成并归档；F1 / F2 / F4–F6 待办）

## 命名约定

所有 spec / plan 文件遵循：`YYYY-MM-DD-kebab-slug-{design,plan}.md`
—— 见 [`/CONTRIBUTING.md`](../CONTRIBUTING.md)。

## 根目录文档

- [`/README.md`](../README.md) — 项目介绍、快速上手
- [`/CHANGELOG.md`](../CHANGELOG.md) — 版本变更（Keep a Changelog）
- [`/CLAUDE.md`](../CLAUDE.md) — 面向 Claude Code 的项目指令
