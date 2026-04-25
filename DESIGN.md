# Design System — InkForge · 三更书房 (Study at Third Watch)

> **核心原则**：always read this before any visual or UI decision. 所有字体、颜色、间距、动效、美学方向以此为权威来源。偏离需显式用户确认。

---

## Product Context

- **What this is**: AI-powered novel writing workstation for Chinese web novel authors (中文网文作者)
- **Who it's for**: 深夜写作的网文作者 — 半夜 2–5 点一口气写 8,000–20,000 CJK 字，屏幕是房间里的唯一光源
- **Space / industry**: 创作工具 (creator tools) · 中文网文 · AI 助写
- **Project type**: Productivity web app (long-dwell, multi-panel)
- **Memorable thing**: **深夜注力、极极安静** — 打开即进入半夜书房；界面在你进入心流时消失

---

## Aesthetic Direction

- **Direction**: Monastic Dark + Literary CJK（僧院式深色 + 文学化中文排版）
- **Decoration level**: **Minimal** — 字体承担所有情绪；无 gradient / glow / pulse / shimmer
- **Mood**: 煤黑底 + 暖墨白字；唯一的彩色是写作者的朱笔。像数字化的稿纸书桌，不是 SaaS dashboard
- **Reference points（synthesized, not copied）**:
  - iA Writer — typographical discipline as differentiator
  - Obsidian — dark-first as confidence signal
  - 传统印刷 / 线装书 — 楷体标题、朱砂批注的仪式感
- **Eureka / EUREKA principle**: Every Chinese writing tool today is either a "Chinese IDE clone" (码字猫/橙瓜) or a "translated Scrivener". Neither serves the deep-night web novelist. The right answer is a **dark monastic chamber** that treats each chapter like a printed book page.

---

## Typography

All fonts are free to use (OFL / Google Fonts / Jsdelivr CDN).

| Role | Font | Weight | 使用场景 |
|------|------|--------|---------|
| **Display / 章节标题** | **LXGW WenKai** (霞鹜文楷) | 500 | 章节标题、大纲标题、引言、欢迎屏 |
| **Body / 稿纸正文** | **LXGW Neo XiHei** (霞鹜新晰黑) | 400/500 | 编辑器正文、世界观条目正文 |
| **UI / 标签** | Noto Sans SC | 400/500/600 | 侧边栏、按钮、tooltip、系统提示 |
| **Numeric display** | **Instrument Serif** (italic) | 400 | 字数、日期、章节号、Day N |
| **Mono / 代码** | JetBrains Mono | 400/500 | 代码块、section eyebrow、tnum 数字 |

**关键决策**：
- 编辑器正文用 **霞鹜新晰黑**（不是宋体）—— 屏幕长时段阅读友好，有文学温度但不疲劳
- 章节标题用 **霞鹜文楷** —— 楷体神韵 + 现代渲染。每个章节开头的印刷仪式感是差异化信号
- 商业工具通常不敢用楷体（显"旧"），但网文作者自我认同是"在写书"，仪式感直接强化这种身份

### Loading

```tsx
// src/app/layout.tsx
import { Noto_Sans_SC, Instrument_Serif, JetBrains_Mono } from "next/font/google";
// LXGW fonts via CDN (Google Fonts 不提供):
//   <link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" rel="stylesheet" />
//   <link href="https://cdn.jsdelivr.net/npm/lxgw-neoxihei@1.1.0/style.css" rel="stylesheet" />
```

### Scale (CJK-tuned)

CJK 每字是独立字形（非字母流），长时段阅读需要更松行距。西文 1.5 的行距对 CJK 偏紧。

| Token | Size | Line-height | 用途 |
|-------|------|-------------|------|
| `--fs-xs` | 12px | 1.4 | 元信息、section eyebrow |
| `--fs-sm` | 13px | 1.6 | 说明文字、次要按钮、tooltip |
| `--fs-base` | 15px | 1.7 | UI 主文、侧栏条目、对话消息 |
| `--fs-md` | **17px** | **1.9** | **编辑器正文**（长时段阅读甜蜜点） |
| `--fs-lg` | 19px | 1.5 | 强调正文、引言 |
| `--fs-xl` | 24px | 1.4 | 小节标题、面板 head |
| `--fs-display` | 34px | 1.35 | 章节标题 |
| `--fs-hero` | 52px | 1.15 | 欢迎页、空态图景 |

---

## Color

### Approach: Monastic — one color ecosystem

中性 surface 阶梯承担所有信息层级。**朱砂是唯一的彩色**。出现即"注意"。

### Surfaces (dark is default)

| Token | Hex | 用途 |
|-------|-----|------|
| `--surface-0` | `#0E0F11` | App 背景（煤黑，非纯黑，减轻对比） |
| `--surface-1` | `#161719` | Topbar、侧边栏、AI 面板 |
| `--surface-2` | `#1E1F22` | 卡片、条目、引用 |
| `--surface-3` | `#26272B` | Hover state |

### Ink (text)

| Token | Hex | 用途 |
|-------|-----|------|
| `--foreground` | `#EDE7DC` | 正文（暖墨白，老纸色调，非冷白） |
| `--muted` | `#8A857D` | 说明、次要文本 |
| `--faint` | `#575249` | 元信息、占位 |

**克制**：只有 3 级文本灰。不允许再加第 4 级。信息层级由 size / 字重 / 位置承担，不靠灰度堆叠。

### The Only Accent: 朱砂 Cinnabar

| Token | Hex | Rationale |
|-------|-----|-----------|
| `--accent` | `#C8553D` | 朱砂红 — 中文印章、书页批注的颜料色。文化符号，第一眼识别为"写中文的" |
| `--accent-soft` | `#C8553D33` (20% alpha) | Citation chip 背景、选中高亮 |
| `--accent-dim` | `#A03A2A` | 主按钮 hover |

**朱砂 = 写作者的笔迹，不是 UI 装饰。所有"需要被注意"的元素都用这一色，且仅此一色：**

- 文字光标（闪烁）
- 当前章节的左标 2px
- 主按钮（primary CTA）
- 引用标记 citation chip
- Focus ring（输入框聚焦）
- 世界观条目的左侧 type-rail

### Semantic (rare usage, < 5 times per month)

| Token | Hex | 中文名 | 用途 |
|-------|-----|--------|------|
| `--success` | `#6B8E4E` | 竹青 | 完稿、同步成功、达成每日字数 |
| `--warning` | `#C79A5E` | 陈黄 | 草稿、未保存、矛盾提醒 |
| `--danger` | `#A03A2A` | 重朱砂 | 删除确认、严重矛盾、API 错误 |

### Light mode (rice-paper / 米纸 — opt-in)

暗色是默认，浅色是镜像备选。浅色用暖米纸 `#F4EFE4`（非 Claude.ai 式冷白），保持"纸"的气质。

| Token | Dark | Light (米纸) |
|-------|------|-------------|
| `--surface-0` | `#0E0F11` | `#F4EFE4` |
| `--surface-1` | `#161719` | `#EEE7D6` |
| `--surface-2` | `#1E1F22` | `#E6DFCC` |
| `--surface-3` | `#26272B` | `#DCD4BE` |
| `--foreground` | `#EDE7DC` | `#1A1814` |
| `--muted` | `#8A857D` | `#5C574D` |
| `--faint` | `#575249` | `#8A857A` |
| `--accent` | `#C8553D` | `#C8553D` (same) |

---

## Spacing

- **Base unit**: 4px
- **Density**: Comfortable — 这是写作工具，不是 dashboard
- **Editor body padding**: 48px top/bottom（呼吸感是 quiet 的物理体现）

| Token | Value | 用途 |
|-------|-------|------|
| `--sp-2xs` | 2px | Icon margin |
| `--sp-xs` | 4px | Inline gap |
| `--sp-sm` | 8px | Small gap |
| `--sp-md` | 16px | Default gap |
| `--sp-lg` | 24px | Section inner padding |
| `--sp-xl` | 40px | Section outer padding |
| `--sp-2xl` | 64px | Between major sections |
| `--sp-3xl` | 96px | Hero top padding |

---

## Layout

- **Approach**: Grid-disciplined（网格严格） + editorial 节奏
- **Workspace grid**: `260px / 1fr / 320px` (left sidebar / editor / AI panel)
- **Editor column**: `max-width: 42em`（约 38 CJK 字宽，阅读甜蜜点），`margin: 0 auto`
- **Max content width**: 1280px（Design System 预览、analysis 页）
- **Sidebar widths**: left 260px default（原 280），right 320px default（原 320 保留）

### Border radius — 柔软来自字体，不来自角

| Token | Value | 用途 |
|-------|-------|------|
| `--r-sm` | 4px | 控件（button 次要、chip、入框） |
| `--r-md` | 6px | 按钮 primary、message bubble、card 行 |
| `--r-lg` | 8px | Dialog、大 card、面板 |

⚠️ **不要**用 12px / 16px / full-pill 圆角。大圆角 = SaaS 气质，与"书房"冲突。

### Hairlines

- `--line`: `rgba(255,255,255,0.06)` (dark) / `rgba(26,24,20,0.08)` (light) — 默认 1px 边
- `--line-strong`: `rgba(255,255,255,0.12)` (dark) / `rgba(26,24,20,0.16)` (light) — hover、分隔

---

## Motion

- **Approach**: Minimal-functional
- **Philosophy**: 落笔感 —— 快进慢收，像墨滴落在纸上
- **Easing**: `cubic-bezier(0.2, 0, 0, 1)` for all transitions

| Token | Duration | 用途 |
|-------|----------|------|
| `--t-fast` | 100ms | Hover 底色、tooltip、icon 色 |
| `--t-base` | 150ms | 菜单展开、focus ring、button state、章节切换 |
| `--t-slow` | 200ms | Drawer、dialog、panel resize、消息进入 |

### 被删除的动效（legacy）

全部删除或置为 no-op，不允许回归：
- ~~`animate-amber-pulse` / `animate-inkwell-breathe` / `animate-ink-drop`~~
- ~~`animate-shimmer`~~
- ~~`bg-grain` / `bg-amber-vignette` / `bg-spotlight`~~
- ~~`lift-on-hover`（translate / shadow）~~

保留类名作 no-op 别名避免组件崩，但视觉上无效果。

### 允许的动效

- `fade-in` (opacity only, 150ms)
- `fade-up` (opacity + 4px translateY, 200ms)
- `message-enter` (opacity + 4px translateY, 150ms)
- `slide-in-left`（菜单/抽屉，200ms）
- Accordion expand/collapse

---

## Components (最少必要)

### Button

- `.btn--primary` → 朱砂底 + 白字；hover 加深
- `.btn--ghost` → 透明 + 发丝边；hover `surface-2`
- `.btn--danger` → 透明 + 重朱砂边；hover 15% fill

### Input

- 底 `surface-2`，1px 发丝边，6px 圆角
- Focus → 边框切朱砂（非 ring shadow，单层边）

### Chip / World Bible Type

类型用字形符号作前缀（即使无彩也可区分），颜色仅在活跃态出现：
- 角色 ◈ — 朱砂（`var(--accent)`）
- 地点 ◆ — 竹青（`var(--success)`）
- 规则 ◇ — 陈黄（`var(--warning)`）
- 时间线 ◍ — 灰（`var(--muted)`）

### Card / Entry Card

- 底 `surface-2`，6px 圆角，左侧 2px type-rail
- 无 box-shadow

### AI Chat Message

- User: `surface-2` bubble，右对齐，85% max-width
- AI: 无 bubble，左侧 2px 朱砂 rail
- Citation chip: 朱砂小圆角胶囊 + 数字用 Instrument Serif italic

---

## Relation Graph（可视化关系编辑器）

> 组件：`src/components/analysis/interactive-relation-graph.tsx`
> Memorable thing：**族谱印章感** — 透明描边圆节点，像印章印在媒黑纸上；连线是墨线，不是数据可视化

### Nodes

节点是**透明描边圆**（不是彩色实心圆）。节点类型沿用现有 World Entry Type chip 的颜色体系：

| 类型 | 描边颜色 | 来源 token | 字形前缀 |
|------|---------|-----------|---------|
| 角色 ◈ | `var(--accent)` #C8553D | 朱砂 | 朱砂描边 |
| 地点 ◆ | `var(--success)` #6B8E4E | 竹青 | 竹青描边 |
| 规则 ◇ | `var(--warning)` #C79A5E | 陈黄 | 陈黄描边 |
| 时间线 ◍ | `var(--muted)` #8A857D | 暖灰 | 灰色描边 |

- 节点直径：52px
- 节点填充：**transparent**（零填充 — 这是印章语言的核心）
- 描边宽度：默认 1.5px，hover 2px，选中 2.5px

### Relationship Lines

- **实线**：暖白墨线 `rgba(237, 231, 220, 0.15)`，1px，8% opacity
- **AI 建议虚线**：朱砂淡描边 `rgba(200, 85, 61, 0.25)`，1px，dashed（`stroke-dasharray: 4,3`），带箭头
- 连线宽度：1px（与 force-layout 原生一致）

### Node States

| 状态 | 视觉变化 |
|------|---------|
| 默认 | 描边 1.5px，填充 transparent |
| Hover | 描边 2px，`cursor: pointer` |
| 选中/活跃 | 描边 2.5px + 背景晕染 `var(--accent-soft)` |
| 固定位置（手动拖拽后） | 左上角小锚点图标 `✦`（表示已手动固定，不受 force-layout 影响） |
| AI 待确认（新建节点） | 描边虚线 + 下方标签"AI 待确认" |

### Float Panels

- 背景：`var(--surface-2)`，1px `var(--line-strong)` 边
- 圆角：`var(--r-lg)` = 8px
- 出现动效：`fade-up`（`opacity 0→1` + `translateY(6px→0)`），200ms，`cubic-bezier(0.2, 0, 0, 1)`
- 标题字体：`LXGW WenKai`（与系统其他面板一致）

### Legend

- 位于图谱 toolbar 下方
- 用描边圆（不是实心圆）表示类型，保持印章语言一致性
- 背景：`var(--surface-1)`

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-20 | 朱砂 (#C8553D) 作唯一 accent，不用蓝/绿/紫 | 中文写作工具 category 用蓝或绿；朱砂是文化符号（印章/批注），让 InkForge 第一眼识别为"写中文小说的" |
| 2026-04-20 | 默认深色，浅色（米纸）作备选 | Memorable-thing = "深夜注力"，深色直接编码在首次打开体验 |
| 2026-04-20 | LXGW WenKai 楷体用于章节标题 | 商业工具通常不敢用楷体（显"旧"），但网文作者自我认同是"在写书"，仪式感强化身份 |
| 2026-04-20 | LXGW Neo XiHei 作正文，不用 Noto Sans SC | 新晰黑是为屏幕 CJK 长时段阅读优化的，有文学温度 |
| 2026-04-20 | 编辑器正文 17px / line-height 1.9 | CJK 每字独立字形，需要比西文更松的行距；17px 是大段中文屏幕阅读甜蜜点 |
| 2026-04-20 | 圆角下调 4/6/8（原 8/12/16） | 柔软来自字体（楷/宋），不来自圆角；大圆角 = SaaS 玩具气质 |
| 2026-04-20 | 删除所有 pulse / shimmer / amber-glow 装饰动画 | Memorable-thing = "极极安静"，任何"呼吸"动画抵触 |
| 2026-04-20 | 只有 3 级文本灰（fg / muted / faint），不再加 | 信息层级由 size / 字重 / 位置承担，不靠灰度堆叠 |
| 2026-04-25 | 关系图谱用透明描边节点（族谱印章语言）| 所有竞品（Obsidian/Roam/Notion）都用彩色实心圆，是数据可视化语言；透明描边 + 墨线是族谱/印章语言，跟 InkForge 的"深夜写作"氛围 coherent，且一眼区分 |
| 2026-04-25 | 关系图谱连线用 8% opacity 暖白墨线 | 连线承担的是"羁绊"视觉化，不是数据边；极低 opacity 保证图谱不喧宾夺主，保持"极极安静" |
| 2026-04-25 | AI 推荐用朱砂虚线 + toast banner，而非弹窗 | AI 建议是轻微推送（nudge），不是强制介入；toast banner 保持用户控制感，虚线视觉上与实线区分 |
| 2026-04-20 | Numeric display 用 Instrument Serif italic | 字数、日期、章节号这些 tabular 数字加一点 editorial serif 气息，避免全 sans 的扁平感 |
