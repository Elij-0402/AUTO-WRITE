# Phase 4: World Bible - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 04-world-bible
**Areas discussed:** Entry data model & fields, Entry browsing & navigation, Entry editing & creation, Relationship linking, Empty state & guidance, Entry ordering, Read/edit mode, Type icons, Timeline sorting, Tag mechanism, Relationship boundary with character fields, Editor linkage, Image support, Data storage, Name uniqueness, Batch operations, Tab name & icon, New entry defaults, Entry navigation, Field input types, Entry quantity limits, List interaction, Association area layout, Deletion warnings, Chinese labels

---

## Entry Data Model & Fields

| Option | Description | Selected |
|--------|-------------|----------|
| 统一基础 + 类型专属字段 | Four types share base fields, each has dedicated fields | ✓ |
| 统一模型，类型标签区分 | Same fields for all, type tag distinguishes | |
| 完全独立的四种模型 | Separate data tables for each type | |

**User's choice:** 统一基础 + 类型专属字段
**Notes:** Consistent with per-project IndexedDB pattern, supports type-specific forms while maintaining query flexibility

### Character Fields

| Option | Description | Selected |
|--------|-------------|----------|
| 核心字段 | name, alias, appearance, personality, background | ✓ |
| 核心 + 结构化字段 | + age, gender, occupation etc. | |
| 极简字段 | Only name + one free text field | |

**User's choice:** 核心字段（姓名、别名、外貌、性格、背景）
**Notes:** No gender field — can be mentioned in background free text if needed

### Location & Rule Fields

| Option | Description | Selected |
|--------|-------------|----------|
| 简洁字段 | Location: name, description, features. Rule: name, content, scope | ✓ |
| 详细字段 | More structured fields per type | |

**User's choice:** 简洁字段
**Notes:** Consistent with the principle of keeping entries simple and letting free text handle complexity

### Timeline Time Field

| Option | Description | Selected |
|--------|-------------|----------|
| 自由文本时间点 | No structured date format, supports expressions like "第三年春" | ✓ |
| 结构化时间字段 | Absolute time, duration fields | |

**User's choice:** 自由文本时间点
**Notes:** Web novels often use non-standard time expressions

### Tag System

| Option | Description | Selected |
|--------|-------------|----------|
| 自由标签 | Multiple tags per entry, autocomplete + instant creation | ✓ |
| 仅类型分类，无标签 | Only 4 type categories, no custom tags | |
| 预定义分类列表 | Pre-defined category list | |

**User's choice:** 自由标签（自动补全 + 即建即用）
**Notes:** Tags are global across all entity types, autocomplete shows existing tags, new tags created on-the-fly

### Entry Name Uniqueness

| Option | Description | Selected |
|--------|-------------|----------|
| 名称不需要唯一 | Same name can exist across types and within types | ✓ |
| 同类型内唯一 | Same name within same type not allowed | |
| 全局唯一 | No duplicate names at all | |

**User's choice:** 名称不需要唯一

---

## Entry Browsing & Navigation

### Tab Location

| Option | Description | Selected |
|--------|-------------|----------|
| 侧边栏第三标签页 | "世界观" tab alongside chapters and outline | ✓ |
| 独立全屏页面 | Separate page for world bible | |
| 编辑区内容视图 | World bible as a view in editor area | |

**User's choice:** 侧边栏第三标签页 "世界观"
**Notes:** Tab name: "世界观", icon: lucide-react BookOpen. Consistent with existing tab pattern

### List Display

| Option | Description | Selected |
|--------|-------------|----------|
| 按类型分组展示 | Four collapsible sections with type icons and counts | ✓ |
| 混合列表 + 筛选器 | All entries mixed, filter by type | |
| 类型分页 | Each type as separate sub-page | |

**User's choice:** 按类型分组展示

### Search

| Option | Description | Selected |
|--------|-------------|----------|
| 简单实时搜索 | Search box at top, filters by name and tags | ✓ |
| 搜索 + 高级筛选 | Search + filters by type, tags, date | |

**User's choice:** 简单实时搜索

### Entry List Items

| Option | Description | Selected |
|--------|-------------|----------|
| 名称 + 图标 + 标签预览 | Type icon prefix, name, 1-2 tag previews | ✓ |
| 仅名称 | Just the entry name | |
| 名称 + 描述预览 | Name + first line of description | |

**User's choice:** 名称 + 类型图标前缀 + 标签预览

### Entry Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| 按名称字母排序 | Alphabetical by name (pinyin for Chinese) | ✓ |
| 按创建时间排序 | Newest or oldest first | |
| 手动拖拽排序 | User-defined order | |

**User's choice:** 按名称字母排序（所有类型统一，包括时间线）

---

## Entry Editing & Creation

### Edit Location

| Option | Description | Selected |
|--------|-------------|----------|
| 编辑区显示 | Edit form replaces editor area, consistent with outline editing | ✓ |
| 模态弹窗编辑 | Modal dialog for editing | |
| 独立页面编辑 | Separate page for editing | |

**User's choice:** 编辑区显示
**Notes:** Consistent with outline edit form pattern (D-17 from Phase 3)

### Entry Creation

| Option | Description | Selected |
|--------|-------------|----------|
| 分组标题旁"+"按钮 | "+" button next to each type group header | ✓ |
| 顶部统一新建按钮 | Single "new" button at top, then choose type | |
| 底部添加按钮 | "Add" button at bottom | |

**User's choice:** 每个类型分组标题旁的"+"按钮

### Edit Form Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 类型标签 + 结构化表单 | Type indicator at top, structured fields per type | ✓ |
| 单页平铺所有字段 | All fields flat on one page | |
| 多标签页编辑 | Separate tabs for different field groups | |

**User's choice:** 类型标签 + 结构化表单

### Deletion

| Option | Description | Selected |
|--------|-------------|----------|
| 软删除 + 回收机制 | deletedAt timestamp, confirmation with relationship count warning | ✓ |
| 硬删除 + 确认弹窗 | Permanent delete with simple confirmation | |

**User's choice:** 软删除 + 回收机制
**Notes:** Confirmation dialog warns: "此条目有 N 个关联关系，删除后关联将一并移除。确定删除？"

### Save Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 自动保存 | Auto-save with debounce, same as chapter editor | ✓ |
| 手动保存按钮 | Explicit save button | |

**User's choice:** 自动保存

### Edit Mode

| Option | Description | Selected |
|--------|-------------|----------|
| 直接编辑模式 | Click to select and immediately edit | ✓ |
| 只读 → 点击编辑 | View mode first, then click edit | |

**User's choice:** 直接编辑模式

### Field Input Types

| Option | Description | Selected |
|--------|-------------|----------|
| 文本输入为主 | Single-line for names, auto-growing textarea for long fields | ✓ |
| 混合输入类型 | Dropdowns for structured fields, text for free-form | |

**User's choice:** 文本输入为主
**Notes:** Names and short fields use single-line input. Personality, background, description etc. use auto-growing textarea. Tags use autocomplete + create component.

### New Entry Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| 类型化默认名 + 自动进入编辑 | "未命名角色"/"未命名地点" etc., auto-selected | ✓ |
| 通用默认名 | "新建条目" regardless of type | |

**User's choice:** 类型化默认名 + 自动进入编辑

### Entry Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| 上一条/下一条导航 | Prev/Next buttons at bottom of edit form | ✓ |
| 仅通过侧边栏切换 | Only sidebar navigation | |

**User's choice:** 上一条/下一条导航（按类型分组内顺序）

### Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| 友好提示 + 添加按钮 | Prompt like "还没有角色，点击添加第一个角色" | ✓ |
| 仅显示分组标题 + 加号 | Minimal, just header and + button | |

**User's choice:** 友好提示 + 添加按钮

---

## Relationship Linking

### How to Create Relationships

| Option | Description | Selected |
|--------|-------------|----------|
| 编辑区内"关联"区域 | "添加关联" button in edit form's relation section | ✓ |
| 拖拽建立关系 | Drag from one entry to another | |
| 右键菜单"关联到..." | Right-click context menu option | |

**User's choice:** 编辑区内"关联"区域

### Bidirectionality

| Option | Description | Selected |
|--------|-------------|----------|
| 双向自动可见，类型可不同 | A→B and B→A both visible, types can differ | ✓ |
| 双向对称 | Same relationship both ways | |
| 单向可见 | Only visible from source | |

**User's choice:** 双向自动可见，类型可不同
**Notes:** e.g., A "是师父" B, B "是徒弟" A

### Relationship Categories

| Option | Description | Selected |
|--------|-------------|----------|
| 两大分类 + 自由描述 | 角色关系 + 通用关联, free-text description | ✓ |
| 预定义关系类型列表 | Fixed list of relationship types | |
| 无分类，纯自由文本 | Just free-text, no categories | |

**User's choice:** 两大分类 + 自由描述
**Notes:** 角色关系 (character_relation) for people-to-people connections. 通用关联 (general) for everything else (lives-in, belongs-to, related-to)

### Relationship Display

| Option | Description | Selected |
|--------|-------------|----------|
| 关系卡片列表 | Card list showing direction, type, target entry name | ✓ |
| 关系图谱可视化 | Graph/network visualization | |
| 纯文本列表 | Plain text list | |

**User's choice:** 关系卡片列表

### Relationship Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| 点击跳转到条目 | Click target entry name to navigate | ✓ |
| 弹窗预览目标条目 | Popup preview on click | |

**User's choice:** 点击跳转到条目

### Boundary: Background vs Relationships

| Option | Description | Selected |
|--------|-------------|----------|
| 背景 = 文本，关系 = 结构化链接 | Background field for narrative text, relation system for structured links | ✓ |
| 角色也有"关系"文本字段 | Separate text field plus relation system | |

**User's choice:** 背景 = 文本，关系 = 结构化链接
**Notes:** Clear separation: background is prose ("He studied under Master Li"), relationships are structured links (A → is-mentor-of → B)

### Association Area Layout

| Option | Description | Selected |
|--------|-------------|----------|
| 表单下方卡片列表 | Relation cards below the edit form fields | ✓ |
| 单独标签页显示关联 | Separate tab for associations | |

**User's choice:** 表单下方卡片列表 — "添加关联" button at bottom of the card list

---

## Additional Decisions

### Data Storage

| Option | Description | Selected |
|--------|-------------|----------|
| 两张新表（条目+关系）在项目DB中 | worldEntries + relations tables in InkForgeProjectDB | ✓ |
| 一张新表，关系作为子字段 | Single worldEntries table with embedded relations | |

**User's choice:** 两张新表（worldEntries + relations）in existing per-project IndexedDB

### Visual & Interaction

- Tab name: "世界观" with BookOpen icon from lucide-react
- Type icons: User (character), Map (location), BookOpen (rule), Clock (timeline) from lucide-react
- Entry list: click to select + three-dot context menu (编辑/删除), no drag-reorder
- No image/avatar support in Phase 4
- No batch operations in Phase 4
- No entry count limit

### Deletion Warning

| Option | Description | Selected |
|--------|-------------|----------|
| 提示关联数量并确认 | Warn about relationship count before delete | ✓ |
| 标准确认弹窗 | Simple "are you sure" without relationship info | |

**User's choice:** 提示关联数量并确认 — "此条目有 N 个关联关系，删除后关联将一并移除。确定删除？"

### Chinese Labels (Confirmed)

- 角色: 姓名, 别名, 外貌, 性格, 背景
- 地点: 名称, 描述, 特征
- 规则/设定: 名称, 内容, 适用范围
- 时间线: 名称, 时间点, 事件描述
- 关系区域: 添加关联

## the agent's Discretion

- Exact styling of relationship cards (colors, spacing, hover effects)
- Exact auto-grow behavior for textareas
- Search debounce timing
- Empty state illustration design
- Confirmation dialog wording details
- Tag input component interaction details
- Relationship direction indicator design

## Deferred Ideas

- AI-suggested relationships (WRLD-06) — Phase 6 scope
- AI-suggested new entries from drafts (WRLD-07) — Phase 6 scope
- Image/avatar support for entries — future iteration
- Batch operations (import/export/delete) — future iteration
- World bible visualization graph — Phase 6 scope
- Editor-world bible linkage (right-click create, text-to-entry jump) — Phase 6 scope
- Drag-to-reorder entries within groups — not needed since alphabetical sort