# InkForge 数据模型

## 数据库架构

InkForge 使用 **Dexie.js (IndexedDB)** 实现离线优先存储，采用两层数据库隔离策略。

---

## 两层数据库

### 1. inkforge-meta (共享元数据库)

**表结构：**

| 表名 | 索引 | 说明 |
|------|------|------|
| `projectIndex` | `id, title, updatedAt, deletedAt` | 项目列表 |
| `aiConfig` | `&id` | 全局 AI 配置 (Key: 'config') |

### 2. inkforge-project-{projectId} (Per-project 数据库)

**Schema 版本历史：** v1 → v15 (当前)

---

## 核心实体

### ProjectMeta

```typescript
interface ProjectMeta {
  id: string
  title: string
  genre: string
  synopsis: string
  coverImageId: string | null
  wordCount: number
  todayWordCount: number        // 今日写作字数
  todayDate: string              // YYYY-MM-DD 格式
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null         // 软删除
}
```

### Chapter

```typescript
interface Chapter {
  id: string
  projectId: string
  order: number
  title: string
  content: object | null        // Tiptap JSON (ProseMirror)
  wordCount: number
  status: 'draft' | 'completed'
  outlineSummary: string          // 大纲摘要
  outlineTargetWordCount: number | null
  outlineStatus: 'not_started' | 'in_progress' | 'completed'
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
```

### WorldEntry

```typescript
type WorldEntryType = 'character' | 'location' | 'rule' | 'timeline'

interface WorldEntry {
  id: string
  projectId: string
  type: WorldEntryType

  // 通用字段
  name: string
  description?: string
  tags: string[]

  // Character 专用
  alias?: string
  appearance?: string
  personality?: string
  background?: string

  // Location 专用
  features?: string

  // Rule 专用
  content?: string
  scope?: string

  // Timeline 专用
  timePoint?: string
  eventDescription?: string

  // v13: AI-inferred voice/style
  inferredVoice?: {
    aiDraft: string
    userEdit?: string
    generatedAt: Date
  }

  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
```

### Relation

```typescript
type RelationCategory = 'character_relation' | 'general'

interface Relation {
  id: string
  projectId: string
  sourceEntryId: string
  targetEntryId: string
  category: RelationCategory
  description: string              // 关系描述 (如"师徒")
  sourceToTargetLabel: string     // 方向标签 (如"是师父")
  createdAt: Date
  deletedAt: Date | null
}
```

---

## AI 相关实体

### ChatMessage

```typescript
interface ChatMessage {
  id: string
  projectId: string
  conversationId: string          // v10: 多线程支持
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasDraft?: boolean
  draftId?: string
}
```

### Conversation

```typescript
interface Conversation {
  id: string
  projectId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  rollingSummary?: string        // 对话摘要
  summarizedUpTo?: number         // 摘要截止索引
}
```

### AIConfig

```typescript
type AIProvider = 'anthropic' | 'openai-compatible'

interface AIConfig {
  id: 'config'                    // singleton
  provider?: AIProvider           // undefined = legacy = openai-compatible
  apiKey: string
  baseUrl: string
  model?: string
  availableModels?: string[]
  uiFlags?: UiExperimentFlags     // Phase F UI 特性开关
}
```

### AIUsageEvent

```typescript
interface AIUsageEvent {
  id: string
  projectId: string
  conversationId: string | null
  kind: 'chat' | 'summarize' | 'analyze' | 'generate'
  provider: AIProvider
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  latencyMs: number
  createdAt: number

  // v13: Draft telemetry
  draftOffered?: boolean
  draftAccepted?: boolean
  draftEditedPct?: number | null
  draftRejectedReason?: 'conflict' | 'other'
  draftRejectedNote?: string
  editedPctDeadline?: number
}
```

---

## 同步与历史

### Revision

```typescript
interface Revision {
  id: string
  projectId: string
  chapterId: string
  snapshot: object                // Tiptap JSON
  wordCount: number
  createdAt: Date
  label?: string                  // 手动标签
  source: 'autosnapshot' | 'manual' | 'ai-draft'
}
```

### Contradiction

```typescript
interface Contradiction {
  id: string
  projectId: string
  conversationId: string | null
  messageId: string | null
  entryName: string
  entryType: WorldEntryType
  description: string
  exempted: boolean               // 用户豁免标记
  createdAt: number
  chapterId?: string              // 溯源章节
}
```

### ConsistencyExemption

```typescript
interface ConsistencyExemption {
  id: string
  projectId: string
  exemptionKey: string            // hash(entryId + type + description)
  createdAt: number
  note?: string
}
```

### LayoutSettings

```typescript
interface LayoutSettings {
  id: string                      // 'default'
  sidebarWidth: number             // 侧边栏宽度 (px)
  activeTab: 'chapters' | 'outline' | 'world'
  chatPanelWidth?: number          // AI 面板宽度 (px)
}
```

---

## 索引设计

### inkforge-meta

```
projectIndex:
  - PRIMARY: id
  - title (查找)
  - updatedAt (排序)
  - deletedAt (软删除过滤)

aiConfig:
  - PRIMARY: id (='config')
```

### inkforge-project-{id}

```
chapters:
  - PRIMARY: id
  - projectId
  - order (排序)
  - deletedAt

worldEntries:
  - PRIMARY: id
  - projectId
  - type (过滤)
  - name (查找)
  - deletedAt

relations:
  - PRIMARY: id
  - projectId
  - sourceEntryId
  - targetEntryId
  - deletedAt

messages:
  - PRIMARY: id
  - projectId
  - conversationId (过滤)
  - role
  - timestamp (排序)

conversations:
  - PRIMARY: id
  - projectId
  - updatedAt

revisions:
  - PRIMARY: id
  - projectId
  - chapterId
  - createdAt

aiUsage:
  - PRIMARY: id
  - projectId
  - conversationId
  - createdAt
  - model

contradictions:
  - PRIMARY: id
  - projectId
  - messageId
  - entryName
  - exempted
  - createdAt
  - [projectId+entryName] (复合)
  - [projectId+createdAt] (复合)
```

---

## 数据保留策略

| 实体 | 保留策略 |
|------|---------|
| Chapters | 软删除，`deletedAt != null` 时过滤 |
| WorldEntries | 软删除 |
| Relations | 软删除 |
| Messages | 无限保留，按 conversationId 分组 |
| Revisions | 最多 50 条/章节，超出后清理旧快照 |
| AIUsage | 无限保留（BYOK 用户需要完整使用记录） |
| Contradictions | 按 (entryName+description) 去重，7天内不重复 |

---

## 字段映射 (Supabase Sync)

| 本地表 | 云端表 |
|--------|--------|
| projectIndex | project_index |
| chapters | chapters |
| worldEntries | world_entries |
| relations | relations |
| messages | messages |
| conversations | conversations |
| ~~aiConfig~~ | **不同步** (D-48) |

---

## 下一文档

- [开发指南](./development-guide.md)
- [部署指南](./deployment-guide.md)
