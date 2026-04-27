# InkForge

面向中文网文作者的 AI 小说写作工作台。InkForge 提供世界观百科、大纲、章节编辑器、AI 对话和创作者分析面板，重点解决长篇写作里的上下文注入、一致性维护和离线优先创作体验。

## 当前状态

- 当前公开版本：`0.2.0`
- 技术栈：Next.js 16、React 19、TypeScript、Tailwind CSS 4、Tiptap 3、Dexie、Supabase（可选）
- 运行方式：本地优先，BYOK（自带 API Key），核心数据保存在浏览器 IndexedDB

## 核心能力

- 世界观驱动的 AI 上下文注入
- 结构化建议与矛盾预警
- 中文场景优化的混合检索
- 创作者分析视图（关系图、时间线、文风分析）
- 章节版本历史与恢复
- Anthropic 原生接入与 OpenAI 兼容 Provider

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10+

### 安装与启动

```bash
pnpm install
pnpm dev
```

默认地址：`http://localhost:3000`

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

## 环境变量

复制 `.env.example`，按需填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Supabase 仅在启用云同步时需要；未配置时可使用本地优先能力。

## 架构概览

- `src/app/`：路由与页面入口
- `src/components/`：编辑器、工作区、分析面板与 UI 组件
- `src/lib/db/`：两层 IndexedDB 封装
- `src/lib/ai/`：Provider 抽象、提示词组装、tool use 与流式事件
- `tests/` / 同目录 `*.test.ts(x)`：e2e 与单元测试

## 开发约定

- UI 文案统一中文
- 视觉决策遵循 [DESIGN.md](DESIGN.md)
- 测试文件与源码同目录
- 提交前执行：

```bash
pnpm lint && pnpm test
```

## 许可证

[AGPL-3.0](LICENSE)
