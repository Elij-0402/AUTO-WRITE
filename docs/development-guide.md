# InkForge 开发指南

## 环境设置

### 前置条件

- **Node.js** ≥ 18.x
- **pnpm** ≥ 8.x (推荐) 或 npm ≥ 9.x
- **Git**

### 安装步骤

```bash
# 克隆仓库
git clone <repo-url>
cd AUTO-WRITE

# 安装依赖
pnpm install

# 复制环境变量模板
cp .env.example .env.local

# 启动开发服务器
pnpm dev
```

### 环境变量 (.env.local)

```env
# Supabase (可选，用于云同步)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 (localhost:3000) |
| `pnpm build` | Turbopack 生产构建 |
| `pnpm lint` | ESLint 检查 (flat config) |
| `pnpm test` | Vitest 单元测试 |
| `pnpm test:watch` | Vitest 监听模式 |
| `pnpm test:e2e` | Playwright E2E 测试 |

### 运行单个测试

```bash
npx vitest run src/lib/db/meta-db.test.ts
```

---

## 项目结构

```
src/
├── app/           # Next.js App Router
├── components/    # React 组件
│   └── ui/        # 基础 UI 组件
├── lib/           # 业务逻辑
│   ├── db/        # 数据库层
│   ├── hooks/     # React Hooks
│   ├── ai/        # AI 层
│   ├── sync/      # 同步引擎
│   └── export/    # 导出功能
└── test/          # 测试配置
```

---

## 代码规范

### TypeScript

- **严格模式**: `tsconfig.json` 启用 `strict: true`
- **路径别名**: `@/*` → `./src/*`

### 代码风格

- 使用 **ESLint** (flat config: `eslint.config.mjs`)
- 规则: `core-web-vitals` + `typescript`
- 提交前必须通过 lint: `pnpm lint`

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

# 示例
feat(chapter): add drag-and-drop reordering
fix(ai-chat): resolve streaming interruption
docs(design): update color palette
```

---

## 测试

### 单元测试

- **框架**: Vitest
- **环境**: jsdom + @testing-library/react
- **数据库 Mock**: fake-indexeddb/auto
- **断言**: @testing-library/jest-dom

### 测试文件位置

测试文件与源码同目录：

```
src/lib/db/
├── meta-db.ts
├── meta-db.test.ts       # ← 测试
├── project-db.ts
└── project-db.test.ts
```

### 测试设置

`src/test/setup.ts` 提供：
- `fake-indexeddb/auto` 自动 mock
- `@/lib/supabase/client` 全局 mock
- `@testing-library/jest-dom` matchers

### 运行测试

```bash
# 所有测试
pnpm test

# 监听模式
pnpm test:watch

# 单个文件
npx vitest run src/lib/db/meta-db.test.ts
```

---

## 组件开发

### UI 组件模式

基于 Radix UI + Tailwind CSS：

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx } from "clsx"

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn--primary",
      ghost: "btn--ghost",
    },
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

### 变体设计

使用 `class-variance-authority` 管理组件变体：
- `variant`: primary, ghost, danger
- `size`: sm, md, lg

### 插槽组合

使用 `@radix-ui/react-slot` 实现组件 composition：

```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={clsx(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
```

---

## 数据库开发

### Dexie 数据库

```typescript
// 创建 per-project 数据库
import { createProjectDB } from '@/lib/db/project-db'

const db = createProjectDB(projectId)

// 查询
const chapters = await db.chapters
  .where('projectId').equals(projectId)
  .filter(c => !c.deletedAt)
  .sortBy('order')
```

### 软删除模式

所有实体使用 `deletedAt: Date | null`：

```typescript
// 查询活跃记录
.filter(c => !c.deletedAt)

// 软删除
await db.chapters.update(id, { deletedAt: new Date() })
```

### 添加新表/字段

编辑 `project-db.ts` 添加新 version：

```typescript
this.version(N)
  .stores({
    // ... existing tables
    newTable: 'id, ...indexes',
  })
  .upgrade(tx => {
    // migration logic
  })
```

---

## AI 功能开发

### Provider 架构

```typescript
import { streamChat, supportsToolUse } from '@/lib/ai/client'

// 发送消息
const events = streamChat(config, {
  segmentedSystem,
  messages,
  signal: abortController.signal,
})

for await (const event of events) {
  if (event.type === 'text_delta') {
    // 处理流式文本
  } else if (event.type === 'tool_call') {
    // 处理工具调用
  }
}
```

### Tool Use Schema

定义在 `src/lib/ai/tools/schemas.ts`：

```typescript
export const suggestEntrySchema = {
  name: 'suggest_entry',
  description: '建议新建世界观条目',
  input: z.object({
    entryType: z.enum(['character', 'location', 'rule', 'timeline']),
    name: z.string(),
    description: z.string().optional(),
    fields: z.record(z.string()).optional(),
    confidence: z.enum(['high', 'medium', 'low']).optional(),
  })
}
```

---

## 同步功能开发

### 添加同步表

1. 在 `sync-engine.ts` 的 `TABLE_MAP` 添加映射
2. 确保 `field-mapping.ts` 有对应的映射函数
3. **注意**: `aiConfig` 标记为不同步 (D-48)

### 离线队列

```typescript
import { enqueueChange } from '@/lib/sync/sync-queue'

await enqueueChange({
  table: 'chapters',
  operation: 'create' | 'update' | 'delete',
  data: chapterData,
  localUpdatedAt: Date.now(),
  userId,
})
```

---

## 设计系统

### 必读

**在进行任何 UI/视觉决策前，必须阅读 [`DESIGN.md`](./DESIGN.md)**

### 核心约束

- 禁止: shadow / border-radius > 8px / pulse/shimmer/glow 动画
- 唯一强调色: 朱砂 `#C8553D`
- 默认主题: 深色

### CSS 变量

```css
/* 表面 */
--surface-0: #0E0F11
--surface-1: #161719
--surface-2: #1E1F22
--surface-3: #26272B

/* 文本 */
--foreground: #EDE7DC
--muted: #8A857D
--faint: #575249

/* 强调 */
--accent: #C8553D
```

---

## 调试

### React DevTools

使用 React DevTools 检查组件树和 hooks 状态。

### Dexie Inspector

浏览器扩展 [Dexie.org](http://dexie.org) 可视化 IndexedDB。

### Next.js DevTools

- `pnpm dev` 启动后访问 localhost:3000
- 使用 React DevTools 检查组件

---

## 下一文档

- [部署指南](./deployment-guide.md)
