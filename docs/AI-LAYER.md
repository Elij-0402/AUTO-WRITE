# AI Layer

## Overview

Provider-agnostic AI client that normalizes Anthropic and OpenAI-compatible endpoints into a single `streamChat()` interface.

```
streamChat(config, params) → AsyncIterable<AIEvent>
```

## AIEvent Types

All providers normalize their output into these event types:

```typescript
// src/lib/ai/events.ts
type AIEvent =
  | AITextDeltaEvent      // streaming text chunk
  | AIToolCallEvent       // structured tool call from AI
  | AIToolCallPartialEvent // partial tool call (stream aborted mid-JSON)
  | AIUsageEvent          // token usage report
  | AIDoneEvent           // stream finished
  | AIErrorEvent          // error occurred
```

## Providers

### Anthropic (`anthropic`)

Uses `@anthropic-ai/sdk` natively. Supports:
- Prompt caching (automatic for world-bible context blocks)
- Tool use (three structured tools)
- Streaming via `messages` endpoint

### OpenAI-Compatible (`openai-compatible`)

Generic OpenAI-compatible endpoint (DeepSeek, SiliconFlow, LiteLLM, etc.). Falls back to `/models` endpoint for probe/auth check.

## Usage

```typescript
import { streamChat } from '@/lib/ai/client'

const events = streamChat(
  { provider: 'anthropic', apiKey, baseUrl, model },
  {
    segmentedSystem: {
      baseInstruction: 'You are a helpful assistant.',
      worldBibleContext: '...',     // injected automatically
      runtimeContext: '...',         // current selected text, etc.
    },
    messages: [{ role: 'user', content: 'Hello' }],
    signal: abortController.signal, // optional cancellation
  }
)

for await (const event of events) {
  if (event.type === 'text_delta') {
    output += event.delta
  }
}
```

## SegmentedSystemPrompt

System prompt is built from three segments, concatenated in order:

```typescript
interface SegmentedSystemPrompt {
  baseInstruction: string     // role + task definition
  worldBibleContext: string   // retrieved entries injected here
  runtimeContext: string      // current selected text, chapter title, etc.
}
```

This segmentation enables prompt caching: the world-bible context block is cached independently, so repeated conversations only re-send the runtime context.

## Prompt Caching

When using Anthropic provider with `extendedCacheTtl` (1 hour), the prompt structure is:

1. `baseInstruction` — not cached (changes per conversation)
2. `worldBibleContext` — cached (stable across sessions for same project)
3. `runtimeContext` — not cached (changes per message)

Cache hit on world-bible context = ~80% token savings on long sessions.

## Tool Use (Anthropic only)

Three structured tools enable world-building consistency:

```typescript
// suggest_entry — propose a new world entry
// suggest_relation — propose a relationship between entries
// report_contradiction — flag potential consistency violations
```

Parsed by `suggestion-parser.ts` into typed `Suggestion` objects. Tool schemas defined in `tools/schemas.ts`.

## Wizard Mode

`useWizardMode` hook (`src/lib/hooks/use-wizard-mode.ts`) implements the AI构思搭档 flow:

```
idle → [triggerWizardMode] → thinking
  → [AI responds] → options (user picks one)
  → [selectOption] → expanding
  → [result] → done
```

State machine: `idle | thinking | options | expanding | done | error`

The wizard prompt (`WIZARD_OPTIONS_PROMPT`) instructs the AI to output a JSON options array with `type`, `title`, and `description` fields. JSON is parsed by `parseWizardResponse()`.

## Error Handling

On API error, `AIErrorEvent` is emitted with a message. Error type detection (401/404/429/network) is handled by callers via `errorHint()` utilities in `AIOnboardingDialog` and `AIConfigDialog`. Wizard mode errors use a generic error display — `errorHint()` should be applied consistently.
