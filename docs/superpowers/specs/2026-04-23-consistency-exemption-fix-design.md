# 一致性扫描豁免系统改进设计

**日期**: 2026/04/23
**状态**: 草稿

## 背景

当前 InkForge 存在三个与一致性扫描豁免相关的问题：

1. **"去第 X 章" 显示 bug** — `ContradictionRow` 组件显示章节号时只有 UUID，没有转换成实际章节序号
2. **豁免后无法撤销** — `consistencyExemptions` 表支持添加但没有 UI 入口删除
3. **豁免范围不一致** — AI Chat 场景和主动扫描场景对同一"豁免"操作的范围定义不同

## 修复方案

### 问题 1：章节号显示

**根因**：`ContradictionRow` 只收到 `chapterId`，组件内没有章节列表供查询。

**修复**：
- `ContradictionGroup` 接收章节列表 `{ id, title, order }[]`
- 向下传递 `chapterId → chapterTitle` 的映射或直接传章节对象
- `ContradictionRow` 根据 `chapterId` 找到对应章节，显示为「去第 N 章」或「去第 [章节标题]」

### 问题 2：豁免撤销

**根因**：豁免后只写入了 `consistencyExemptions` 表，没有 UI 入口删除。

**修复**：
- 在 `ContradictionRow` 的已豁免行中显示「撤销」按钮
- 点击后：
  1. 从 `consistencyExemptions` 表删除对应记录（按 `exemptionKey` 匹配）
  2. 将 `contradictions` 表中该条目所有 `exempted=true` 的行改回 `exempted=false`
  3. 显示 toast「已撤销豁免」

### 问题 3：豁免范围统一

**根因**：
- AI Chat：`handleIntentionalContradiction` 只标记最新一条 contradiction row
- 主动扫描：`exemptResult` 标记该条目所有未豁免行

**修复**：
统一为 **entry-level 豁免**：调用 `exemptResult` 时，该条目所有 `exempted=false` 的 rows 都被标记为 `exempted=true`。

修改 `handleIntentionalContradiction`（`ai-chat-panel.tsx:307`），改用 `useConsistencyScan.exemptResult` 的同一套逻辑。

## 涉及文件

- `src/components/analysis/contradiction-dashboard.tsx`
  - `ContradictionGroupProps` 增加 `chapters` 属性
  - `ContradictionRowProps` 增加 `onRevoke` 回调
  - `ContradictionRow` 渲染撤销按钮 + 正确章节号
- `src/components/workspace/ai-chat-panel.tsx`
  - `handleIntentionalContradiction` 改为条目级豁免

## 数据模型

### 新增能力

- `ConsistencyExemption.removeExemption(exemptionKey)` — 按 key 删除
- `ContradictionRow` 新增 `onRevoke` 交互

### 不变

- `ConsistencyExemption` 表结构不变
- `Contradiction` 表结构不变
- 7 天去重窗口逻辑不变