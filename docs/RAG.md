# RAG 层

## 为什么换掉关键词匹配

v1 的世界观注入用 `extractKeywords` 做 2–4 字组合的穷举子串匹配。对于指代性 / 意译性中文查询（"她的师父"、"那把剑叫什么"）召回率很差：查询里根本没出现条目名。

v2 引入**语义 + 关键词两路 hybrid 检索**，RRF 融合。语义路径用字符 n-gram 哈希嵌入（纯 JS，无模型下载），对中文友好。

## 目录结构

```
src/lib/rag/
├── embedder.ts           ← Embedder 接口 + HashGramEmbedder
├── default-embedder.ts   ← 项目级单例
├── vector-store.ts       ← Dexie embeddings 表 CRUD + cosine Top-K
├── indexer.ts            ← 增量索引（跳过未变）
├── hybrid-search.ts      ← RRF 融合
├── search.ts             ← searchRelevantEntries() 门面
└── types.ts              ← Embedding, RagDB
```

## HashGramEmbedder

- 字符 n-gram（默认 1/2/3 元）
- Feature hashing（FNV-1a）到固定 256 维
- 符号扰动避免碰撞偏置
- L2 归一化 → 余弦相似 = 点积

没有模型下载、没有 Web Worker、构造即可用。对中文的表现不如神经嵌入但远好于原始子串匹配，且实现风险最低。

### 替换为神经嵌入

`Embedder` 接口稳定：

```ts
interface Embedder {
  readonly dim: number
  readonly id: string
  embed(texts: string[]): Promise<Float32Array[]>
}
```

未来只需实现一个 `BGEEmbedder`（`@xenova/transformers` 加载 `bge-small-zh-v1.5`），在 `default-embedder.ts` 里切换即可。`embedderId` 变更会触发全量 reindex（`indexer.ts` 已处理）。

## 向量存储

`embeddings` 表（项目 DB v8）：

```ts
interface Embedding {
  id: string
  projectId: string
  sourceType: 'worldEntry' | 'chapter' | 'chapterChunk' | 'outline'
  sourceId: string
  chunkIndex?: number
  text: string
  vector: Float32Array        // IndexedDB 原生支持 typed arrays
  embedderId: string
  updatedAt: Date
}
```

复合索引 `[sourceType+sourceId]` 支持按源定位。线性扫描 + cosine 计算在 ~5000 条目以内 <5ms。超过该阈值需要切换到近似索引（HNSW/IVF），当前不需要。

## 增量索引

`indexWorldEntries(db, { projectId, entries, embedder })`：

1. 读取现有 embeddings（按 embedderId 过滤）
2. 对每个活跃 entry，比较 `entrySignature(entry)` 与已有向量的 `text`
3. 不同 → 重新嵌入；相同 → 跳过
4. 删除对应已软删除 / 硬删除 entries 的 embeddings

`entrySignature()` 用和系统提示词同款的 `formatEntryForContext`，保证嵌入文本与 LLM 看到的上下文一致。

## Hybrid 检索

```ts
searchRelevantEntries({ db, projectId, embedder, query, entries, entriesByType, topK })
```

流程：
1. 确保索引最新（除非 `skipReindex: true`）
2. **语义路径**：嵌入 query → cosine Top-K（默认 topK×2，最小 20）
3. **关键词路径**：复用 `use-context-injection` 的 `extractKeywords` + `findRelevantEntries`
4. **RRF 融合**：`weights: [1.5, 1.0]`，稍微偏向语义
5. 映射回 `WorldEntry[]`

## Reciprocal Rank Fusion

$$\mathrm{score}(d) = \sum_{l} w_l \cdot \frac{1}{k + \mathrm{rank}_l(d)}$$

- $k = 60$（原论文默认）
- $w$ = 每路权重
- 参数少、对分数尺度不敏感，适合"一路 cosine (0..1)，一路频率"的混合

## 性能参考

- 256 维 × 1000 条目 ≈ 1MB IndexedDB
- 首次索引 1000 条：~300ms（主线程，可接受）
- 每轮 AI 对话的 RAG 总开销：<10ms（嵌入 query + 线性扫描）
