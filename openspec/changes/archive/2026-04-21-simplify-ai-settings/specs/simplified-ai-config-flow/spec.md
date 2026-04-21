## ADDED Requirements

### Requirement: Simplified AI Config Flow
AI 设置交互被简化为单一对话框，包含厂商选择、API Key 输入和模型选择三个字段。模型输入框仅在 API Key 填写完成后显示。

#### Scenario: First-time configuration
- **WHEN** user opens AI settings for the first time (no config exists)
- **THEN** dialog shows provider dropdown (Anthropic selected by default), empty API Key field, and model field is hidden

#### Scenario: Provider selection shows model field
- **WHEN** user selects a provider and enters a non-empty API Key
- **THEN** model input appears pre-filled with the provider's default model

#### Scenario: Save triggers automatic connectivity probe
- **WHEN** user clicks "保存" (Save) with valid provider and API Key
- **THEN** system automatically probes the API endpoint
- **AND** on success, config is saved and dialog closes
- **AND** on failure, error message is displayed and dialog stays open

#### Scenario: Onboarding mode is non-closeable
- **WHEN** user is in onboarding mode
- **THEN** pressing Escape does not close the dialog
- **AND** clicking outside the dialog does not close it
- **AND** user must complete (save) or explicitly skip to proceed

### Requirement: Provider Dropdown
Provider selection offers exactly three options: Anthropic, DeepSeek, OpenRouter.

#### Scenario: Switching provider pre-fills model
- **WHEN** user switches provider
- **THEN** model field is pre-filled with the new provider's default model
- **AND** existing API Key is cleared

### Requirement: Error Display
Connectivity errors display specific diagnostic information in Chinese.

#### Scenario: API Key invalid
- **WHEN** probe returns HTTP 401
- **THEN** display "401 · API Key 可能填写错误或已过期"

#### Scenario: Model not found
- **WHEN** probe returns HTTP 404
- **THEN** display "404 · 模型名可能拼错或服务不可用"

#### Scenario: Rate limited
- **WHEN** probe returns HTTP 429
- **THEN** display "429 · 触发速率限制，稍后再试"

#### Scenario: Network error
- **WHEN** probe returns network/fetch error
- **THEN** display "网络错误 · 检查代理或接口地址"

### Requirement: Onboarding Dialog
Onboarding flow uses a dedicated dialog component separate from the main AI settings dialog.

#### Scenario: Onboarding auto-probes on provider change
- **WHEN** onboarding dialog loads
- **THEN** provider defaults to Anthropic, model defaults to claude-sonnet-4-20250514

#### Scenario: Onboarding save completes
- **WHEN** user completes onboarding config and saves successfully
- **THEN** onSaveComplete callback is invoked
