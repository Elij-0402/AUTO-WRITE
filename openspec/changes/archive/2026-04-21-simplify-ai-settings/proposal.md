## Why

AI 设置是用户接触 InkForge 的第一个门槛。当前界面塞入了 5 个预设厂商、个性化模型列表、连接测试、引导/普通双模式——对于一个"填入 API Key 就能跑"的工具来说，信息密度过高。实际只需要三件事：选厂商、填 Key、选模型。preset 检测逻辑、OpenAI-compatible 双重行为、custom Base URL 分支都加剧了代码维护负担。

## What Changes

- **精简厂商选择**：从 5 个 chips 降为 1 个 Select 下拉，只保留实际用到的 3 个：Anthropic、DeepSeek、OpenRouter。custom 选项移除（用户若有自部署需求，可以通过 DeepSeek 或 OpenRouter 的自定义端点实现）。
- **移除 Custom Provider 分支**：`ai-config-dialog.tsx` 中的 `custom` preset 和相关状态、`detectPreset()`、`PRESETS.custom` 全部删除。`AIProvider` 类型简化为 `'anthropic' | 'openai-compatible'`，custom 不再作为独立存储类型。
- **模型输入条件化**：模型输入框只在 API Key 填写完成后才显示或自动填充，避免空白干扰。
- **测试连接改为自动**：不再需要手动点"测试连接"，保存时自动探测，失败时展示具体错误。
- **引导模式独立组件**：将 onboarding 引导逻辑从 `AIConfigDialog` 中提取为单独的 `AIOnboardingDialog`，两套逻辑分离。
- **简化 `useAIConfig`**：移除迁移扫描逻辑（v1 → v2 已完成），只保留读/写 global `aiConfig` 的能力。

**BREAKING**：
- 删除 `custom` preset，删除 `detectPreset()` 函数。
- `AIProvider` 中 `'openai-compatible'` 保留，但 custom base URL 不再作为独立 preset。

## Capabilities

### New Capabilities
- **simplified-ai-config-flow**：简化后的 AI 配置交互流程。单一对话框、三字段（厂商 / API Key / 模型）、自动探测、引导流程独立。

### Modified Capabilities
- `ai-config-dialog`：现有 AI 配置对话框的交互流程大幅简化，组件职责收窄。
- `use-ai-config`：`useAIConfig` hook 移除遗留迁移逻辑，简化后的配置读写。

## Impact

- **组件**：`AIConfigDialog` 简化，`AIOnboardingDialog` 新增。
- **Hooks**：`useAIConfig` 删除迁移分支，接口不变。
- **数据库**：`AIConfig.provider` 语义不变，`baseUrl` 字段意义简化（不再用于 preset 检测）。
- **Supabase Sync**：不受影响，`aiConfig` 原本就不参与同步。
