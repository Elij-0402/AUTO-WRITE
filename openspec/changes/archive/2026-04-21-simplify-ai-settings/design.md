## Context

当前 `AIConfigDialog` 承载了 5 个 preset（Anthropic、DeepSeek、硅基流动、OpenRouter、Custom），每个 preset 有独立的 base URL、默认模型、热门模型列表、`consoleUrl`。切换 preset 时有复杂的 `detectPreset()` 逻辑来重新匹配 UI 状态。Custom preset 增加了额外的 Base URL 输入框和分支代码。引导模式（onboarding）和普通模式混在同一个组件中，通过 `isOnboarding` prop 区分行为。

`useAIConfig` hook 中仍有 v1→v2 迁移扫描的遗留代码（`migrationScanned` ref），虽然迁移已完成但逻辑仍在。

## Goals / Non-Goals

**Goals:**
- 将 AI 设置从"配置面板"降级为"三步表单"：选厂商 → 填 Key → 选模型
- 消除 custom preset 分支，移除 `detectPreset()` 和 `PRESETS.custom`
- 引导流程与普通设置流程完全分离为独立组件
- 移除迁移扫描遗留代码

**Non-Goals:**
- 不改变 `AIConfig` 数据结构（`provider`/`apiKey`/`baseUrl`/`model` 字段不变）
- 不改变存储位置（`inkforge-meta::aiConfig` 仍是全局单例）
- 不引入新的 AI Provider 支持

## Decisions

### 1. 厂商选择降为 3 个：Anthropic、DeepSeek、OpenRouter

**选择理由**：Anthropic 是主力模型（Claude 系列），DeepSeek 有低成本优势，OpenRouter 是最强的聚合网关可访问数百模型。硅基流动本质也是 OpenAI-compatible，通过 OpenRouter 已可覆盖。Custom preset 移除——自部署用户可通过 OpenRouter 或 DeepSeek 的自定义端点实现。

**替代方案**：保留 5 个 preset 但简化 UI → 违背简化目标。

### 2. Custom preset 移除，baseUrl 不再由用户编辑

自定义 base URL 的需求通过 DeepSeek 或 OpenRouter 的"自定义端点"模式满足，不再有独立的 `custom` preset。`baseUrl` 字段仍保留在 `AIConfig` 中，但只有程序自动填充，用户不可见/不可改。

**替代方案**：保留 custom preset 但折叠到"其他"选项 → 仍引入额外的 UX 分支。

### 3. 模型输入条件化显示

模型选择依赖用户已填写 API Key（厂商确定后需要 Key 才能知道有哪些可用模型）。因此：
- API Key 未填写时，模型输入框不显示
- API Key 填写后，自动用预设的 `defaultModel` 填充，用户可修改

### 4. 连接测试改为保存时自动探测

手动"测试连接"是额外认知负担。改为保存时自动探测：
- 调用 `/v1/messages`（Anthropic）或 `/v1/models`（OpenAI-compatible）探测连通性
- 失败时阻止保存，显示具体错误原因
- 成功时完成保存并关闭对话框

### 5. 引导流程独立为 `AIOnboardingDialog`

原有的 `isOnboarding` prop 让 `AIConfigDialog` 承担了两种职责。提取为 `AIOnboardingDialog`：
- 只包含核心三字段（厂商 / Key / 模型）
- 不可关闭（Escape 和外部点击均阻止），必须完成或跳过
- 成功保存后调用 `onSaveComplete` 回调

## Risks / Trade-offs

| 风险 |  Mitigation |
|------|-------------|
| 移除 custom preset 后，自部署用户无法配置任意 base URL | OpenRouter 提供大量第三方模型，DeepSeek 也有自定义端点模式，可满足大多数需求 |
| 移除手动测试连接后，用户不知道配置是否正确直到保存 | 保存失败时显示具体错误信息（401/404/429/网络错误），提供诊断线索 |
| 硅基流动用户升级后的 baseUrl 无法兼容 | 硅基流动 API 与 DeepSeek 兼容，引导用户改用 DeepSeek preset |

## Migration Plan

1. 代码层面：修改 `AIConfigDialog`、`useAIConfig`，新增 `AIOnboardingDialog`
2. 数据层面：`aiConfig.baseUrl` 字段语义不变，不涉及 DB schema 变更
3. 兼容旧 custom preset 用户：已有 custom 配置的用户打开对话框时，若 baseUrl 含 `siliconflow` 关键词，自动映射到 OpenRouter preset（`detectPreset` 简化版回退）
4. 回滚方案：若出现问题，恢复 `ai-config-dialog.tsx` 旧版文件即可
