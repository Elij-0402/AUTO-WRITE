## 1. Simplify AIConfigDialog — Remove Custom Preset

- [x] 1.1 Remove `PRESETS.custom`, `PRESETS.siliconflow` entries from `PRESETS` record; keep only `anthropic`, `deepseek`, `openrouter`
- [x] 1.2 Delete `detectPreset()` function
- [x] 1.3 Remove `customBaseUrl` state and all `{presetKey === 'custom'}` conditional rendering
- [x] 1.4 Remove `handlePresetChange` custom branch logic; simplify to direct preset switch
- [x] 1.5 Remove `testResult`/`testErrorMsg` state and "测试连接" button — replace with save-time probe
- [x] 1.6 Add model field visibility conditional — model input only renders when `apiKey` is non-empty
- [x] 1.7 Change provider selector from 5 chips to 1 Radix Select dropdown (Anthropic / DeepSeek / OpenRouter)
- [x] 1.8 Pre-fill model with `defaultModel` when provider changes and API Key is already filled

## 2. Create AIOnboardingDialog — Extract Onboarding Flow

- [x] 2.1 Create new `AIOnboardingDialog` component with same structure as simplified `AIConfigDialog`
- [x] 2.2 Make dialog non-closeable (block Escape and outside-click via `onEscapeKeyDown`/`onInteractOutside`)
- [x] 2.3 Add `onSkip` callback to allow bypassing AI config during onboarding
- [x] 2.4 On save success call `onSaveComplete` instead of `onClose`
- [x] 2.5 Remove `isOnboarding` prop from `AIConfigDialog`

## 3. Simplify useAIConfig Hook

- [x] 3.1 Remove v1→v2 migration scan logic (`migrationScanned` ref, all-projects scan, `localStorage` guard)
- [x] 3.2 Remove `localStorage` key `inkforge-aiconfig-migrated-v2`
- [x] 3.3 Keep only global `metaDb.aiConfig.get('config')` read/write; remove project-scoped fallback

## 4. Update Workspace Topbar — Use New Components

- [x] 4.1 In `WorkspaceTopbar` (or wherever `AIConfigDialog` is opened), replace with new simplified dialog
- [x] 4.2 Wire `AIOnboardingDialog` into the onboarding tour flow in `page.tsx`

## 5. Auto-Probe on Save — Implement Connectivity Check

- [x] 5.1 In `handleSave`, before persisting, call probe endpoint (`/v1/messages` for Anthropic, `/v1/models` for OpenAI-compatible)
- [x] 5.2 On probe failure, block save, display error message (401/404/429/network per spec), keep dialog open
- [x] 5.3 On probe success, persist config, close dialog
- [x] 5.4 Reuse `errorHint()` function for Chinese error translation

## 6. Tests

- [x] 6.1 Add/update tests for `AIConfigDialog` (provider select, model visibility, auto-probe)
- [x] 6.2 Add/update tests for `AIOnboardingDialog` (non-closeable behavior, skip callback)
- [x] 6.3 Add/update tests for simplified `useAIConfig` (no migration paths)
