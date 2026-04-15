# Testing Strategy (InkForge)

## Testing Stack
- **Runner**: Vitest (configured in `vitest.config.ts`)
- **Environment**: `jsdom` for React component behavior, `fake-indexeddb` for Dexie DB mocking.

## Strategy
- **Unit Tests**: DB queries (`.test.ts` in `src/lib/db/`) assert that CRUD actions process correctly against `fake-indexeddb` layouts without React overhead.
- **Hook Tests**: Custom hooks (`use-autosave.test.ts`, `use-projects.test.ts`) test lifecycle behaviors and state syncing independent of UI layers.
- **Execution**: Automated by `vitest` via `npm run test` and `test:watch`.
