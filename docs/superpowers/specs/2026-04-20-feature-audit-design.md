# InkForge 功能简化设计

**日期**: 2026-04-20
**类型**: 技术债务清理 + 发布前精简
**目标**: 识别并简化过度设计的功能，确保 v1.0 发布时功能集精炼

---

## 背景

InkForge 目前实现了 93 项功能，涵盖双层 IndexedDB、多 Provider AI、RAG 向量搜索、Supabase 云同步、版本历史、多会话管理等。经过全面审计，部分功能存在以下问题：

- **过度工程化**: 实现了超出中文网文写作场景需要的复杂度
- **用户价值不明确**: 功能面向开发者或高级用户，普通用户无法受益
- **Phase 特性半到位**: 部分 Phase B-D 特性只有一半实现，影响用户体验一致性

---

## 简化决策

### 类别 1：完全移除（不保留代码）

#### 1.1 DevStatsDrawer（开发者统计抽屉）
- **文件**: `src/components/workspace/dev-stats-drawer.tsx`
- **移除理由**: P95 索引延迟、缓存命中率、RAG 延迟中位数等指标面向开发者，普通用户无法理解。"开发者统计"本身说明这不是面向最终用户的功能。
- **附带移除**:
  - `Ctrl+Alt+S` 快捷键绑定
  - `src/lib/db/dev-stats-queries.ts` 中无读取出口的聚合查询
  - `DevStatsDrawer` 在 `WorkspaceTopbar` 中的引用

#### 1.2 RAG 向量系统
- **移除文件**:
  - `src/lib/rag/indexer.ts` — 增量索引器
  - `src/lib/rag/vector-store.ts` — 向量存储
  - `src/lib/rag/hybrid-search.ts` — RRF 混合搜索算法
  - `src/lib/rag/default-embedder.ts` — 本地嵌入实现
  - `src/lib/rag/indexer-latency.ts` — 索引延迟监控
- **移除数据库表**: `embeddings` 表（project-db schema v13）
- **迁移**: schema version bump 到 v14，执行迁移删除 embeddings 表数据

#### 1.3 Sync 冲突解析器
- **文件**: `src/lib/sync/conflict-resolver.ts`
- **移除理由**: Last-Write-Wins 冲突解析复杂度高，但实际场景中本地优先模式下冲突极少发生。简单队列推送足以满足 v1.0 需求。
- **移除内容**:
  - `conflict-resolver.ts` 全文
  - `syncQueue` 表的 `retryCount` / `lastRetryAt` 字段
  - `performInitialSync` 中的复杂合并逻辑

#### 1.4 Sync 队列重试逻辑
- **移除内容**:
  - 指数退避重试机制（最多 5 次）
  - 基础延迟 1 秒的退避策略
- **替代**: 变更推送失败后记录 `failed` 状态，不重试，由用户手动触发同步

---

### 类别 2：降级保留（保留代码但缩减范围）

#### 2.1 `useContextInjection` — 降级为纯关键词匹配

```
Before:
- 关键词 + 向量双检索
- 4000 token 预算
- topK = 12 条目

After:
- 纯关键词匹配（从 worldEntries 直接 filter）
- 2000 token 预算
- topK = 6 条目
- 移除 embeddings 表写入和读取
```

**新实现**:
1. 从用户消息提取关键词（中文分词，现有 `extractKeywords` 逻辑）
2. 从 `worldEntries` 直接过滤匹配条目（名称/标签/描述包含关键词）
3. 按匹配分数排序，取 topK=6
4. `trimToTokenBudget(2000)` 裁剪
5. 格式化后注入 system prompt 的 `【世界观百科】` 区块

**影响文件**:
- `src/lib/hooks/use-context-injection.ts` — 重写检索逻辑
- `src/lib/rag/search.ts` — 删除，逻辑合并到 use-context-injection
- `src/lib/db/project-db.ts` — embeddings 表保留但不再使用（待后续迁移删除）

#### 2.2 Sync 队列 — 简化为单向推送

```
Before:
- 完整队列状态管理（pending/processing/failed/retrying）
- 指数退避重试
- Last-Write-Wins 冲突解析

After:
- 变更直接推入队列（pending）
- 定时刷新到 Supabase（每 30 秒）
- 失败记录 failed 状态，不重试
- 用户可手动触发重同步
```

**保留的文件**:
- `src/lib/sync/sync-queue.ts` — 队列写入
- `src/lib/sync/sync-engine.ts` — 简化为 flushSyncQueue 单向推送
- `src/lib/sync/field-mapping.ts` — 保留

---

### 类别 3：重构

#### 3.1 Onboarding Tour 第 2 步 — 题材选择驱动

```
Before:
- 一键创建主角/反派/师父三个固定角色模板
- 假定用户写的是武侠/仙侠类型

After:
- 让用户先选择创作题材
- 根据题材生成对应初始角色模板
```

**题材 → 模板映射**:

| 题材 | 角色 1 | 角色 2 | 角色 3 |
|---|---|---|---|
| 武侠 | 主角（江湖侠客） | 反派（魔教高手） | 师父（武林前辈） |
| 仙侠 | 主角（修士） | 反派（魔道修士） | 师父（老仙人） |
| 都市 | 主角（普通人） | 反派（商业对手） | — |
| 悬疑 | 主角（侦探/记者） | 反派（真凶） | — |
| 科幻 | 主角（船长/研究员） | 反派（外星势力） | — |
| 其他/跳过 | 不生成模板 | — | — |

**修改文件**: `src/components/workspace/onboarding-tour-dialog.tsx` 第 2 步组件

---

### 类别 4：默认关闭（代码保留，UI 不渲染）

#### 4.1 Citations API 溯源

- **保持代码**: `src/lib/ai/citations.ts`, `CitationChip` 组件
- **默认状态**: `experimentFlags.citations = false`
- **渲染条件**: `CitationChip` 只在 `citations=true` 时挂载到消息气泡
- **理由**: 依赖 Anthropic provider + Custom Content Document 格式，大多数用户使用 OpenAI 兼容接口，该功能不适用

#### 4.2 `extendedCacheTtl` 和 `thinking` 保持现状

- **extendedCacheTtl**: 默认 `true`，Anthropic 用户受益，非 Anthropic 无影响
- **thinking**: 默认 `false`，行为未实现（v1.1 特性），仅记录偏好到 `abTestMetrics`

#### 4.3 `abTestMetrics` 表保留观察

- 该表目前仅被 `useAIChat` 写入（记录实验组分配和 citation count）
- DevStatsDrawer 移除后无读取出口
- 保留但标记为"待观察"，后续决定是否清理

---

### 类别 5：UI 简化

#### 5.1 版本历史 — 移除快照类型分类

```
Before:
- 每条快照显示类型标签（autosnapshot / manual / ai-draft）
- 按类型分组展示

After:
- 统一按时间倒序列表
- 不显示快照类型标签
- 用户价值不变（能恢复到任意历史版本）
```

**修改文件**: `src/components/editor/history-drawer.tsx`
- 移除快照类型的 UI 标签
- `useRevisions` hook 逻辑不变（写入仍按类型分类）

#### 5.2 多会话管理 — 降级为"历史查看"

```
Before:
- 支持新建/切换/重命名/删除多会话

After:
- 保留对话历史列表（可查看/清空）
- 用户始终在一个会话中
- 移除新建/切换/重命名会话功能
- ConversationDrawer 改为"对话历史"抽屉（只读查看 + 清空）
```

**修改文件**:
- `src/components/workspace/conversation-drawer.tsx` — 移除新建/切换/重命名 UI
- `src/components/workspace/ai-chat-panel.tsx` — 移除会话切换 UI
- `useConversations` hook — 保留查询，移除主动创建/切换逻辑

#### 5.3 草稿卡片不采纳原因 — 简化选项

```
Before: 世界观冲突 / 文风不对 / 情节不对 / 其他（4选）
After:  不符合设定 / 其他（2选）
```

**理由**: 详细分类用于遥测，但普通用户不需要这么细的选项。"世界观冲突" ≈ "不符合设定"（中文语境）。保留"其他"用于自由输入。

---

## 数据库迁移

### Schema Version: v13 → v14

```ts
// src/lib/db/project-db.ts
const db = new Dexie('inkforge-project-${projectId}')
db.version(13).stores({ /* v13 schema */ })

// v14: 删除 embeddings 表
db.version(14).stores({
  projects: '++id, ...',
  chapters: '++id, projectId, ...',
  worldEntries: '++id, projectId, ...',
  relations: '++id, projectId, ...',
  conversations: '++id, projectId, ...',
  messages: '++id, conversationId, ...',
  consistencyExemptions: '++id, projectId, ...',
  revisions: '++id, chapterId, ...',
  // embeddings: REMOVED
  analyses: '++id, projectId, ...',
  aiUsage: '++id, projectId, ...',
  abTestMetrics: '++id, projectId, ...',
  contradictions: '++id, projectId, ...',
})
```

迁移时执行：`await db.embeddings.clear()` 删除所有向量数据。

---

## 保留的功能（不做改动）

以下功能经审计后判定为设计合理，无需简化：

| 功能 | 理由 |
|---|---|
| 矛盾警告卡（忽略/豁免/去修改） | 三个操作逻辑清晰，用户价值明确 |
| 矛盾豁免机制 | "有意为之"和"忽略本次"区分清晰，实现简洁 |
| 空闲模式顶栏透明 | 实现简单（一个 boolean），深夜场景有美学价值 |
| 三种导出（Markdown/EPUB/DOCX） | 网文作者实际需求，互相独立无耦合 |
| 版本历史核心功能 | 快照/恢复能力保留，只简化了 UI 分类 |
| AI Config BYOK 配置 | Base URL + API Key 是 OpenAI 兼容接口的必要字段 |

---

## 实施顺序

1. **Phase 1（无依赖）**: 移除 DevStatsDrawer、简化 Onboarding、简化版本历史 UI、简化草稿驳回选项
2. **Phase 2（依赖 Phase 1）**: 删除 RAG 向量系统文件 + embeddings 表迁移
3. **Phase 3（依赖 Phase 2）**: 简化 useContextInjection 为纯关键词、降级 Sync 队列
4. **Phase 4**: 多会话降级、对话历史只读化

---

## 验证标准

简化完成后，以下条件应满足：

- [ ] DevStatsDrawer 相关代码和快捷键完全移除
- [ ] `src/lib/rag/` 目录删除，`embeddings` 表迁移脚本执行
- [ ] `useContextInjection` 改为纯关键词，topK=6，2000 token
- [ ] Sync 队列无重试逻辑，失败即标记
- [ ] Onboarding 第 2 步显示题材选择
- [ ] Citations Chip 只在 `citations=true` 时渲染
- [ ] 版本历史列表无类型标签
- [ ] 多会话降级为单一会话 + 历史查看
- [ ] 所有测试通过 (`npm test`)
- [ ] 生产构建成功 (`npm run build`)
