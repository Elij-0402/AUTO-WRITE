# InkForge 部署指南

## 部署选项

### 1. Vercel (推荐)

InkForge 适配 Next.js 16，默认部署到 Vercel。

```bash
# 构建
pnpm build

# 部署到 Vercel
vercel --prod
```

**环境变量 (Vercel Dashboard):**

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |

### 2. Docker (自托管)

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@8 && pnpm install --frozen-lockfile

# 构建
FROM deps AS builder
WORKDIR /app
COPY . .
RUN pnpm build

# 运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 构建镜像

```bash
docker build -t inkforge .
docker run -p 3000:3000 --env-file .env.local inkforge
```

---

## 环境变量

### 必需

无需必需变量即可运行（本地 IndexedDB 模式）。

### 可选 (云同步)

| 变量 | 说明 | 获取位置 |
|------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase Dashboard → Settings → API |

---

## Supabase 设置

### 1. 创建项目

访问 [supabase.com](https://supabase.com) 创建新项目。

### 2. 获取凭证

项目设置 → API → 获取 `URL` 和 `anon public` 密钥。

### 3. 配置客户端 (可选)

如需启用云同步，需要在 Supabase 中创建表结构。

### 数据库 Schema

```sql
-- 项目索引
CREATE TABLE project_index (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  genre TEXT DEFAULT '',
  synopsis TEXT DEFAULT '',
  cover_image_id UUID,
  word_count INTEGER DEFAULT 0,
  today_word_count INTEGER DEFAULT 0,
  today_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 章节
CREATE TABLE chapters (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  content JSONB,
  "order" INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  outline_summary TEXT DEFAULT '',
  outline_target_word_count INTEGER,
  outline_status TEXT DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 世界观条目
CREATE TABLE world_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  alias TEXT,
  appearance TEXT,
  personality TEXT,
  background TEXT,
  features TEXT,
  content TEXT,
  scope TEXT,
  time_point TEXT,
  event_description TEXT,
  tags JSONB DEFAULT '[]',
  inferred_voice JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 关系
CREATE TABLE relations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID NOT NULL,
  source_entry_id UUID NOT NULL,
  target_entry_id UUID NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT DEFAULT '',
  source_to_target_label TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 对话
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID NOT NULL,
  title TEXT DEFAULT '对话',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  rolling_summary TEXT,
  summarized_up_to INTEGER
);

-- 消息
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  has_draft BOOLEAN DEFAULT FALSE,
  draft_id UUID
);

-- RLS 策略 (示例)
ALTER TABLE project_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON project_index
  FOR ALL USING (auth.uid() = user_id);
```

---

## 性能考虑

### 构建优化

- **Turbopack**: Next.js 16 默认使用 Turbopack (可选)
- **图片优化**: 使用 `next/image` 自动优化
- **字体优化**: 使用 `next/font` 字体优化

### 运行优化

- **ISR**: 可使用 Incremental Static Regeneration
- **Edge Runtime**: 可部署到 Edge Network

---

## 监控

### 错误追踪

建议集成:
- **Sentry**: `npm install @sentry/nextjs`
- **LogRocket**: 前端会话回放

### 健康检查

```bash
curl https://your-domain.com/api/health
```

---

## 故障排查

### 问题: 页面空白

1. 检查浏览器控制台错误
2. 确认 JavaScript 已启用
3. 检查 IndexedDB 是否可用

### 问题: 云同步不工作

1. 确认 Supabase 凭证正确
2. 检查 RLS 策略配置
3. 查看浏览器 Network 面板

### 问题: 字体加载失败

确认 CDN 链接可访问:
- `https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css`
- `https://cdn.jsdelivr.net/npm/lxgw-neoxihei@1.1.0/style.css`

---

## CI/CD

### GitHub Actions

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - uses: vercel/actions/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 下一步

- 返回 [项目概览](./project-overview.md)
- 查看 [架构文档](./architecture.md)
