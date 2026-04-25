# InkForge E2E 测试与代码质量提升 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对 InkForge 当前主分支做一次全面 QA 实测 + 四项代码质量优化（性能、代码质量、可访问性、测试覆盖），交付带证据的总报告与一组有序 commit。

**Architecture:** 三阶段执行 — A: 自动化测试 baseline；B: 浏览器穷举 QA → bug 清单 → 修复；C: 四项独立优化子项。每个子项独立 commit，跨阶段两次检查点同步用户。

**Tech Stack:** Vitest（unit）· Playwright（E2E）· `/browse` 技能（手动 QA）· DeepSeek API（AI 测试）· 现有 Next.js 16 / React 19 / TS 严格模式 / Dexie / Tiptap / Radix。

**Reference Spec:** `docs/superpowers/specs/2026-04-25-e2e-testing-and-quality-improvement-design.md`

---

## File Structure

新建：

- `docs/superpowers/reports/2026-04-25-e2e-qa-and-quality-report.md` — 最终报告（QA 清单、修复状态、性能 before/after、产品决策、剩余 TODO）
- `docs/superpowers/reports/2026-04-25-bug-list.md` — 阶段 B QA 实测产出的 bug 清单（中间产物，commit 保留）
- `docs/superpowers/reports/2026-04-25-perf-baseline.md` — 阶段 C-perf 基线数据
- `tests/<新单测>` — C-test 阶段补全的 vitest 用例（实际文件路径由发现的覆盖空缺决定）

修改（候选，按发现的问题决定）：

- `src/components/**` — bug 修复 / a11y 修复 / DESIGN.md 合规
- `src/lib/**` — 业务逻辑 bug 修复 / 类型修正 / 重复代码提取
- `src/app/**` — 路由与布局 bug 修复
- `next.config.ts` — 性能优化（如启用某些选项、动态 import 配置）

不动：`openspec/`、已有 spec、已有 test 仓本身。

---

## Stage A: 自动化测试 baseline

### Task A1: 建立 baseline

**Files:** 无新文件，只产生命令输出。

- [ ] **Step 1: 跑 lint**

```bash
pnpm lint
```

捕获完整输出。期望：可能有 warnings 或 errors，全部记录。

- [ ] **Step 2: 跑单元测试**

```bash
pnpm test
```

捕获完整输出。记录：通过数 / 失败数 / 失败用例文件清单。

- [ ] **Step 3: 跑 E2E**

```bash
pnpm test:e2e --reporter=list
```

捕获完整输出。如果 dev server 启动失败，先排查再继续。记录：通过数 / 失败数 / 跨浏览器结果。

- [ ] **Step 4: 整理 baseline 笔记**

把以上三项结果写到工作记录（任务 metadata 或临时文件 `.tmp-baseline.md`）。这是后续 bug 清单的输入之一。

- [ ] **Step 5: 修阻塞性失败**

只修阻塞性的（编译报错、测试基础设施崩溃）。功能性 bug 留到阶段 B 集中处理。每修一项独立 commit：

```bash
git add <files>
git commit -m "fix(<scope>): <subject>"
```

### Task A2: 检查点决定

- [ ] **Step 1: 判断**

如果阶段 A 出现大量失败（例如 ≥10 个 E2E 失败 / ≥5 个 unit 失败），暂停并简短同步用户；否则直接进入阶段 B。

---

## Stage B: 浏览器穷举 QA + bug 修复

### Task B1: 启动 dev server + 配置 DeepSeek

**Files:** 无（运行时配置写入 IndexedDB，不入仓）。

- [ ] **Step 1: 启动 dev server（后台）**

```bash
pnpm dev
```

run_in_background=true。确认 http://localhost:3000 可访问。

- [ ] **Step 2: 用 /browse 打开应用**

通过 `/browse` 技能加载 http://localhost:3000，截图首屏。

- [ ] **Step 3: 创建测试项目并配置 AI**

在 UI 中：
1. 创建项目 "QA-测试-2026-04-25"
2. 进入项目设置 → AI 配置
3. 选择 OpenAI-compatible，填入：
   - base URL: `https://api.deepseek.com`
   - API key: 用户提供的临时 key（仅运行时输入，不写文件）
   - model: `deepseek-chat`（或 UI 中默认）
4. 测试连通：发送一条 "你好" 验证流式输出

⚠️ 安全：DeepSeek key 仅通过浏览器输入到 IndexedDB，不写入任何 commit / doc / log 文件。

### Task B2: 穷举 QA 矩阵

**Files:** 测试笔记写到 `docs/superpowers/reports/2026-04-25-bug-list.md`。

- [ ] **Step 1: 创建 bug 清单文件骨架**

```markdown
# InkForge QA Bug List — 2026-04-25

## 表头说明
- ID: BUG-NNN
- 严重: P0 崩溃/数据丢失 | P1 功能错误 | P2 体验问题 | P3 吹毛求疵
- 状态: open / fixed / wontfix

## 模块清单
（待填）
```

- [ ] **Step 2: 逐模块测试，每模块上限 15 分钟**

对下列每个模块走一遍核心 + 边界 + 次要，截图归档到任务 metadata，发现的问题立即追加到 bug 清单。

模块顺序与覆盖矩阵（与 spec §7 阶段 B 一致）：

1. 项目 CRUD：建/列/删/恢复 · 重复名/空名/超长名 · 设置弹窗
2. 章节：建/写/排序/删 · 大文档/重命名/草稿 · 元信息、上下文菜单
3. Tiptap 编辑器：输入/格式/撤销 · 5k/20k/50k 字 / 粘贴 HTML · 浮动工具条
4. AI 对话：流式/工具建议 · key 错误/网络错/中断 · provider 切换
5. 世界观：增/改/删/标签 · 关系互引/软删恢复 · 模板
6. 关系图：拖拽/点击/AI 推荐 · 节点>50/孤立节点 · 布局快照
7. 分析页：时间线/矛盾仪表 · 空数据
8. 同步：入口可见 · 无 key 状态
9. 导出：主格式 · 空章节
10. 全局：路由/快捷键 · 移动端响应式 · 深色

每发现一个问题，按以下格式追加：

```markdown
### BUG-NNN: <短描述>
- 模块: <模块名>
- 严重: <P0|P1|P2|P3>
- 复现:
  1. ...
  2. ...
- 期望: ...
- 实际: ...
- 截图: <文件名或 metadata 引用>
- 备注（产品决策？）: ...
```

- [ ] **Step 3: 关掉 dev server，提交 bug 清单**

```bash
git add docs/superpowers/reports/2026-04-25-bug-list.md
git commit -m "docs(qa): add bug list from 2026-04-25 e2e qa session"
```

### Task B3: 检查点 1 — 同步 bug 清单

- [ ] **Step 1: 简短报告**

向用户汇报：bug 总数、按严重等级分布、是否有计划外的大问题。无需用户答复，等用户提出意见即可继续。

### Task B4: 按优先级修复 bug

**Files:** 视具体 bug 而定。

按 P0 → P1 → P2 顺序处理。P3 仅记录到最终报告。

- [ ] **Step 1: 取下一个未修 bug，定位文件**

读 bug 描述 → grep / 代码导航定位涉及文件。

- [ ] **Step 2: 写复现测试（优先 vitest 单测，其次 playwright E2E）**

如果是逻辑 bug，用 vitest 写最小复现：

```ts
import { describe, it, expect } from "vitest";
// import 真实模块

describe("BUG-NNN <模块>", () => {
  it("<期望行为>", () => {
    // 触发逻辑
    expect(actual).toBe(expected);
  });
});
```

如果是 UI / 流程 bug 且单测难以覆盖，写 Playwright case 加到 `tests/e2e/` 或现有 spec。

- [ ] **Step 3: 跑测试确认失败**

```bash
npx vitest run <new-test-file>
# or
pnpm test:e2e <new-spec>
```

期望：FAIL，失败原因匹配 bug 描述。

- [ ] **Step 4: 实现修复**

修改源码，做最小必要改动。不顺手重构无关代码。

- [ ] **Step 5: 跑测试确认通过**

```bash
npx vitest run <new-test-file>
```

期望：PASS。再跑一遍全量 unit：

```bash
pnpm test
```

确认未引入回归。

- [ ] **Step 6: 浏览器复测（仅 UI bug）**

用 `/browse` 重走 bug 复现路径，确认实际行为符合期望，截图记录。

- [ ] **Step 7: 在 bug 清单中更新状态**

把 BUG-NNN 状态改为 `fixed`，注明 commit hash（占位，commit 后回填）。

- [ ] **Step 8: 决定 commit 分组**

- 若与已修同模块 bug ≤5 分钟内连续修：合并到同一 commit
- 否则独立 commit

- [ ] **Step 9: Commit**

```bash
git add <files>
git commit -m "fix(<scope>): <subject>

Resolves BUG-NNN[, BUG-MMM]
"
```

回填 bug 清单中的 commit hash。

- [ ] **Step 10: 取下一个 bug，回到 Step 1**

直至 P0 / P1 全部 fixed，P2 已尽量修。

---

## Stage C: 四项代码质量优化

### Task C1: 检查点 2 — 阶段 C 开始前同步

- [ ] **Step 1: 简短同步**

告知用户阶段 B 已完成、修复数、即将进入阶段 C。

### Task C-perf: 性能优化

**Files:**
- 新建：`docs/superpowers/reports/2026-04-25-perf-baseline.md`
- 修改候选：`next.config.ts`、`src/app/**` 动态 import 入口、`src/components/analysis/**` 关系图组件、`src/components/editor/**` Tiptap 配置、被识别出的热点组件

- [ ] **Step 1: Baseline — production build 大小**

```bash
pnpm build
```

记录：终端输出的 bundle 大小报告（每个 route + first load JS 大小）写入 `perf-baseline.md` "before"小节。

- [ ] **Step 2: Baseline — 首屏 LCP/TTI**

启动 `pnpm dev`，用 `/browse` 打开首页，多次刷新取中位数。Chrome DevTools Performance 数据通过 browser_evaluate 拿 `performance.getEntriesByType('navigation')[0]`。记录到 baseline。

- [ ] **Step 3: Baseline — Tiptap 输入延迟**

在浏览器中创建一个章节，注入 5k / 20k / 50k 字 lorem 中文（用 `browser_evaluate` 程序化注入），测量连续输入 100 字的总耗时。记录三档数据。

- [ ] **Step 4: Baseline — 关系图渲染**

进入分析页，用 30 / 100 节点测试集（程序化插入 IndexedDB 后刷新），测 mount 后到首帧稳定的时长。记录两档数据。

- [ ] **Step 5: 分析瓶颈**

依据上述数据，列出 ≥15% 改进空间的项作为优化目标。常见方向：
- 大组件 dynamic import
- React.memo / useMemo 关键热点
- Tiptap 扩展按需加载
- 关系图渲染节流 / RAF / 增量 layout
- bundle: 检查是否有不必要的 server runtime / polyfill

- [ ] **Step 6: 实施优化（每个子优化一个 mini commit）**

按瓶颈逐个改：
1. 修改 → 跑 `pnpm build` 确认 bundle 变化 → 浏览器 sanity → commit
2. 重复直到目标项都已改

每个 mini commit：

```bash
git add <files>
git commit -m "perf(<scope>): <具体优化点>"
```

- [ ] **Step 7: After 数据**

重复 Step 1-4，把数据记入 `perf-baseline.md` "after"小节，并在文档末尾算 delta。

- [ ] **Step 8: Commit baseline 报告**

```bash
git add docs/superpowers/reports/2026-04-25-perf-baseline.md
git commit -m "docs(perf): add 2026-04-25 perf baseline before/after"
```

### Task C-quality: 代码质量

**Files:** 视情况。

- [ ] **Step 1: 跑 lint --max-warnings=0 看清单**

```bash
pnpm lint
```

记录所有 warnings 和 errors。

- [ ] **Step 2: 清 lint errors → 0**

逐个修，每修一组（同类型）一个 commit：

```bash
git commit -m "refactor(<scope>): clear <规则名> lint errors"
```

- [ ] **Step 3: 业务代码 any 类型清零**

```bash
grep -rn ": any" src/
grep -rn "as any" src/
```

只处理 `src/components`、`src/app`、`src/lib`（业务）。把 any 替换为精确类型。`src/lib/types`、`src/lib/db/types` 等基础库类型若必须 any 要在注释里写明理由。

- [ ] **Step 4: 重复代码提取**

仅当一段逻辑在 ≥3 处重复且语义一致时提取成 util。其它情况留着不动。

- [ ] **Step 5: 过长文件拆分**

```bash
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

对 >400 行且职责显著多于一项的文件做拆分。仅修改与本次范围相关的文件，避免无关重构。每个文件拆分一个 commit。

- [ ] **Step 6: 跑全量测试确认未回归**

```bash
pnpm lint && pnpm test
```

期望：PASS。

### Task C-a11y: 可访问性 + DESIGN.md 合规

**Files:** UI 组件树。

- [ ] **Step 1: 读 DESIGN.md 红线一遍**

```bash
cat DESIGN.md | grep -E "(forbidden|禁止|red|红线|圆角|阴影|动画|font|字体)" -i
```

刷新内存中的合规清单：圆角 ≤8px、无 shadow、无 pulse/shimmer/glow、字体三件套、`lang="zh-CN"`。

- [ ] **Step 2: 全仓 grep 红线**

```bash
grep -rn "rounded-\(lg\|xl\|2xl\|3xl\|full\)" src/components/  # 圆角>8px
grep -rn "shadow-" src/components/                              # 阴影
grep -rn "animate-\(pulse\|ping\|bounce\)" src/components/      # 禁用动画
grep -rn "\bshimmer\b\|\bglow\b" src/components/
```

每个匹配评估：是否真的违规。违规的修。

- [ ] **Step 3: 键盘可达 spot-check**

用 `/browse` 测：
- Tab 遍历首页所有可交互元素，焦点环可见
- 弹窗 Esc 可关
- 列表 Enter 可触发
记录失败项 → 修复

- [ ] **Step 4: ARIA 角色 spot-check**

检查 dialog / menu / tooltip / select 的 role 与 aria-* 属性。Radix 默认会带，自定义组件需补全。

- [ ] **Step 5: 对比度抽检**

对主要文本与背景对在浏览器 DevTools 中检查对比度：正文 ≥4.5、UI 控件 ≥3。低于阈值的调色（仅在 token 层调，不一处一处 hack）。

- [ ] **Step 6: lang 属性检查**

```bash
grep -rn 'lang=' src/app/ src/components/
```

确认根 layout `lang="zh-CN"`，且无英文 hard-code 出现在 UI 文案。

- [ ] **Step 7: Commit**

```bash
git add <files>
git commit -m "a11y: improve keyboard nav, aria roles, design.md compliance"
```

### Task C-test: 单测覆盖

**Files:** 视覆盖空缺。

- [ ] **Step 1: 列出关键模块**

候选清单（与 spec §7 一致）：
- `src/lib/db/meta-db.ts`、`project-db.ts`、迁移函数
- `src/lib/ai/client.ts`、`prompts.ts`、`suggestion-parser.ts`、`tools/schemas.ts`
- 关系图算法（force-layout、布局快照 CRUD）
- 章节排序、软删除恢复

逐个检查同名 `*.test.ts(x)` 是否存在 → 不存在或覆盖薄弱的列入待补清单。

- [ ] **Step 2: 对每个待补模块写测试**

每个模块独立 commit，测试要覆盖：
- 主路径成功
- 边界（空、超长、异常输入）
- 错误路径（throw / 软失败）

示例骨架（实际内容因模块而异）：

```ts
import { describe, it, expect, beforeEach } from "vitest";
// import "fake-indexeddb/auto" 已在 setup.ts

import { createProjectDB } from "@/lib/db/project-db";

describe("project-db", () => {
  it("creates fresh schema with no chapters", async () => {
    const db = createProjectDB("test-1");
    await db.open();
    expect(await db.chapters.count()).toBe(0);
  });
  // ...更多用例
});
```

每个测试文件：先写失败用例 → 跑确认失败（如果是缺测覆盖则改为：跑确认 PASS 验证主路径） → 补足边界 / 错误路径 → 再跑。

- [ ] **Step 3: Commit per module**

```bash
git add tests/<file>.test.ts
git commit -m "test(<scope>): cover <模块> main + edge + error paths"
```

- [ ] **Step 4: 跑全量测试**

```bash
pnpm test
```

期望：全 PASS。

---

## Stage D: 最终报告

### Task D1: 写报告

**Files:**
- 新建：`docs/superpowers/reports/2026-04-25-e2e-qa-and-quality-report.md`

- [ ] **Step 1: 起草报告骨架**

按 spec §8 结构落字：

```markdown
# InkForge E2E QA 与代码质量提升 总报告

日期：2026-04-25
作者：Claude (brainstorm + execution)
关联 spec：docs/superpowers/specs/2026-04-25-e2e-testing-and-quality-improvement-design.md
关联 plan：docs/superpowers/plans/2026-04-25-e2e-testing-and-quality-improvement.md

## 1. 概述
- 总耗时：<x>
- 提交数：<x>
- bug 总数 / 已修 / 暂不修

## 2. Bug 清单（按模块）
（表格 + 每条状态）

## 3. 性能 before / after
（引用 perf-baseline.md 关键数据）

## 4. 代码质量数据
- lint errors：before <x> → after 0
- any 类型：before <x> → after <y>
- 文件长度 top 5：before vs after

## 5. a11y 检查结果
（清单 + 修复项）

## 6. 单测覆盖增量
（新增测试文件清单 + 模块覆盖）

## 7. 产品决策记录
- 决策 1：<事项> — 理由：<...>
- ...

## 8. 剩余 TODO
- P3 bug
- 范围外的 enhancement 建议

## 9. 安全提醒
DeepSeek API key 已在测试中临时使用（仅通过浏览器输入 IndexedDB）。
请用户立即到 DeepSeek 控制台 revoke 该 key 并生成新 key。
```

- [ ] **Step 2: 填充实际数据**

引用 bug 清单、perf-baseline、各阶段结果。所有数据有据可查，不杜撰。

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/reports/2026-04-25-e2e-qa-and-quality-report.md
git commit -m "docs(qa): add 2026-04-25 e2e qa and quality final report"
```

### Task D2: 收尾

- [ ] **Step 1: 任务列表全 completed**

确认所有 TaskList 任务 completed。

- [ ] **Step 2: 终止 dev server**

如有后台 dev server 进程，停掉。

- [ ] **Step 3: 向用户交付**

简短消息：报告位置、commit 数、关键发现 1-2 句、安全提醒（revoke DeepSeek key）。不 push，等用户决定。

---

## Self-Review

**1. Spec coverage**
- §3 执行模式 → Task A2 / B3 / C1 三个检查点 ✓
- §4 commit 策略 → Task B4 Step 8、Task C-* Step 6/8 ✓
- §5 产品决策 → Task B2 模板含"备注（产品决策？）" + Task D1 §7 ✓
- §6 工具：browse / DeepSeek / 不入仓 → Task B1 ✓
- §7 阶段 A/B/C-perf/quality/a11y/test → 一一对应 ✓
- §8 报告结构 → Task D1 模板完全对应 ✓
- §9 风险缓解：每模块 15min 上限 → Task B2 Step 2 ✓；key 不入仓 → Task B1 Step 3 ⚠️ 强调；Tiptap 三档 → C-perf Step 3 ✓；关系图 100 节点上限 → C-perf Step 4 ✓
- §10 完成标准 → Task D2 ✓

**2. Placeholder scan**
- bug 修复任务用 BUG-NNN 占位是必要的（实际 bug 列表运行时生成）— 不视为 TBD，是模板化的循环步骤
- 每个 Step 都有具体命令或代码或检查项
- 没有 "TODO" / "implement later" / "appropriate error handling" 这类红旗

**3. Type consistency**
- 命令名一致：`pnpm lint` / `pnpm test` / `pnpm test:e2e` / `pnpm build` / `pnpm dev`
- 文件路径一致：`docs/superpowers/reports/2026-04-25-*.md`
- bug 清单 ID 格式一致：`BUG-NNN`
- 阶段编号一致：A/B/C-perf/C-quality/C-a11y/C-test/D
