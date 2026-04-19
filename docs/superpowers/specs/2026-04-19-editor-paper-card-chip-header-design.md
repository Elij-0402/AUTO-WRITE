# Editor 纸张容器 + 章节元数据 Chip 条 — 设计规范

**日期**：2026-04-19
**作者**：Claude (Opus 4.7)
**相关产品分支**：main @ `6c2ba13`

## 背景

Stitch 在 `https://stitch.withgoogle.com/projects/12590881722419801521`
生成的一套视觉重设计中，章节编辑器把正文放在一张"纸"上（`max-w-3xl` 居中卡片、柔和投影、大内边距），
并在卡片顶部用三枚横排胶囊展示 `CHAPTER N` / `字数` / `AI 语调` 等元信息。

Stitch 整体配色（深墨绿 `#17362e` + Material 3 surface ladder + Newsreader 斜体）
与本项目 `src/app/globals.css` 明确坚持的 "Quiet Writing Surface"（暖米白 + 单一 cobalt
蓝锚点 + Noto Sans SC）冲突，**不能整包迁移**。

本 spec 只挑选两个**与现有 token 体系正交、可纯加法实现**的结构性元素落地：

1. **Paper 容器**——仅在聚焦模式（Focus Mode）下把编辑器包进一张卡片。
2. **章节元数据 Chip 条**——无论是否聚焦模式，在编辑器顶部展示章节序号、字数、状态。

其余 Stitch 元素（人物肖像卡、叙事弧时间线、AI Muse 侧栏、Newsreader 字体、深墨绿色、Material Symbols）不在本次实施范围内。

## 设计目标

* 不引入任何新的色值、字体或阴影基元——只复用 `globals.css` 已经定义的变量/工具类。
* 不改变既有组件的对外 API；两项改动都是**纯视觉增强**。
* 中文优先：所有新增文案使用中文。
* 保留现有编辑器 640px 正文栏宽不变——Paper 容器只是在外围再套一层壳。

## 元素 1 — `.paper` 工具类

### 视觉目标

* 居中、最大宽度较正文更宽一点，让 640px 正文与卡片边缘之间有呼吸空间。
* 柔和投影，但不破坏 `globals.css` 既定的"feather-light shadows"基调。
* 圆角沿用 `--radius-card`（12px）。
* 明暗主题都要有合理表现：亮色用 `--card` 作背景；暗色因为 `--card` 已经是
  `--surface-1`，视觉差需要加一层 `border` 描边强调"纸"。

### 落地

在 `src/app/globals.css` `@layer utilities` 内新增：

```css
.paper {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lift-lg);
  max-width: 768px;          /* ~max-w-3xl */
  width: 100%;
  margin-inline: auto;
  overflow: hidden;           /* 裁剪子组件不越过圆角 */
}
```

**不**新增 dark 特别处理——`--shadow-lift-lg` 基于 `hsl(240 10% 12% / ...)`，在暗色下会弱化；
`--border` 同时有 dark 变体，已经够用。

### 使用位置

`src/app/projects/[id]/page.tsx` 的 Focus Mode 分支。**条件**：仅当
`mainContent` 对应的是章节编辑器（即 `activeChapterId && activeTab !== 'outline' && activeTab !== 'world'`）。
对 `OutlineEditForm` / `WorldEntryEditForm` 不包裹——它们是表单密集页，套纸张反而挤压布局。

## 元素 2 — `ChapterMetaStrip` 组件

### 视觉目标

* 三枚胶囊横排：`第 N 章`、`X 字`、`草稿`/`已完成`。
* 用现成 `.chip` / `.chip-jade` / `.chip-amber` 工具类。
* 极细的上边距与正文隔开，下方与编辑器正文自然衔接。
* 右侧留空位 —— 给未来的"AI 语调"或"已同步"扩展留接口（通过 `extras?: ReactNode` prop）。

### 组件 API

```tsx
// src/components/editor/chapter-meta-strip.tsx
interface ChapterMetaStripProps {
  chapterNumber: number           // 第几章 (1-indexed)
  wordCount: number               // 字数
  status: 'draft' | 'completed'   // 章节状态
  extras?: React.ReactNode        // 右侧扩展位
}
```

### 数据来源

`src/app/projects/[id]/page.tsx` 里 `EditorWithStatus` 已经接收到
`projectId` 和 `chapterId`。升级为也接收 `chapter: Chapter` 对象（父级已有
`sortedChapters`，findById 即可）。

章节序号 = `sortedChapters.findIndex(c => c.id === chapterId) + 1`（语义正确，不依赖 `order` 字段存储策略）。

### 位置

`EditorWithStatus` 内部的顶部——即 `<FloatingToolbar>` 之后、`<Editor>` 之前。
这样无论 Focus Mode 与否，都会随着编辑器显示。

### Focus Mode 里原有的 `<ChapterTitleDivider>`

保留——其信息（章节标题）与 Chip 条（章节序号/字数/状态）互补，不重复。
如果后续觉得冗余，再在 v1.1 中并入 ChapterMetaStrip 的 extras。

## 关键文件

| 文件 | 动作 |
|---|---|
| `src/app/globals.css` | 新增 `.paper` 工具类 |
| `src/components/editor/chapter-meta-strip.tsx` | 新建组件 |
| `src/components/editor/chapter-meta-strip.test.tsx` | 新建组件测试 |
| `src/app/projects/[id]/page.tsx` | ① 在 `EditorWithStatus` 顶部挂载 ChapterMetaStrip<br/>② Focus Mode 条件性包裹 `.paper` |

## 验证

1. `npm run lint`
2. `npx vitest run src/components/editor/chapter-meta-strip.test.tsx`
3. `npx vitest run`（整套，确保未打破现有测试）
4. `npm run dev` 手动验证：
   - 非聚焦模式：编辑器顶部应出现三枚 chip。
   - 切换聚焦模式：chip 条仍在；编辑器周围出现纸张卡片；大纲/世界观页面不应出现纸张。
   - 字数切换章节实时更新。
   - 暗色主题：chip 与纸张卡片对比度足够。

## 非本次范围（YAGNI）

* AI 语调徽章（需 AI 调用，待 Phase 之后）
* Chapter 标题在 Paper 头部的 Stitch 风 hero title（与现有 `<Editor>` 内联标题冲突）
* 右侧 AI Muse 侧栏重设计
* 人物档案页 Stitch 风重构
* 叙事弧时间线组件
