# InkForge

**AI 小说专业工作台 — 让 AI 真正理解你构建的故事世界。**

InkForge 是一款面向中文网文作者的 AI 小说写作工作台。多面板布局集成「世界观百科」「大纲」「章节编辑器」「AI 聊天」「创作者分析」，核心差异化在于 AI 基于世界观**自动注入上下文**并**主动检查矛盾**，解决现有 AI 写作工具丢失上下文和一致性的核心痛点。

离线优先，BYOK（自带 API Key），数据完全留在你的浏览器本地。

## 亮点

- **世界观驱动的 AI 上下文**：每次对话自动检索相关角色 / 地点 / 规则 / 时间线，注入系统提示词。
- **Anthropic 原生 + Prompt Caching**：世界观上下文自动命中 Claude prompt cache，一个项目会话内节省 80%+ 输入 token。v0.3 起默认启用 1 小时 cache TTL（`extendedCacheTtl`），长 session 命中率更高；可在 AI 配置对话框关闭。
- **结构化建议**：AI 通过 tool use 发送"新建条目"、"建立关系"、"矛盾预警"结构化建议卡片，告别正则解析的脆弱。
- **语义 RAG 检索**：字符 n-gram 哈希嵌入 + 关键词 RRF 融合，中文指代性查询（"她的师父"、"那把剑"）可命中。
- **创作者分析面板**：力导向关系图、事件时间线、AI 文风指纹（缓存后秒开）。
- **版本历史**：每 5 分钟自动快照，最多 50 条 / 章节，支持命名与恢复。
- **多 Provider 支持**：Claude 原生 + 任意 OpenAI 兼容端点（DeepSeek、SiliconFlow、本地 LiteLLM 等）。

## 技术栈

- Next.js 16 (App Router) · React 19 · TypeScript strict
- Tailwind CSS 4 · Radix UI · Tiptap 3
- Dexie.js（IndexedDB，两层数据库隔离每个项目）
- Supabase（可选云同步）
- `@anthropic-ai/sdk` 原生调用，OpenAI 兼容协议 fallback
- Vitest + Playwright

## 本地开发

```bash
pnpm install          # 或 npm install
pnpm dev              # localhost:3000
pnpm test             # 180 个单测
pnpm build            # Turbopack 生产构建
```

可选 Supabase 同步：`.env.local` 设置
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 文档

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 系统分层与数据模型
- [`docs/AI-LAYER.md`](docs/AI-LAYER.md) — provider 抽象 / tool use / prompt caching
- [`docs/RAG.md`](docs/RAG.md) — 嵌入、向量存储、hybrid 检索
- [`CHANGELOG.md`](CHANGELOG.md) — 版本变更

## License

[AGPL-3.0](LICENSE)
