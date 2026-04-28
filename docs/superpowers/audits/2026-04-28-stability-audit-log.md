# InkForge Stability Audit Log

Date: 2026-04-28
Plan: `docs/superpowers/plans/2026-04-28-stability-audit-and-performance-hardening.md`

## Baseline Commands

| Command | Status | Notes |
| --- | --- | --- |
| `pnpm lint` | fail -> pass | Initial failure came from `.agents/skills/huashu-design` assets being linted as app source; final run clean after ignore boundary update |
| `pnpm test` | pass | `73` test files passed, `376` tests passed, `1` skipped |
| `pnpm build` | fail -> pass | Initial failures: `src/lib/hooks/use-layout.ts` persisted-layout typing mismatch; later `src/lib/hooks/useAuth.ts` imported missing `@supabase/supabase-js` type |
| `npx vitest run src/lib/hooks/use-layout.test.ts` | pass | Verified persisted workspace context still writes complete layout state |
| `npx vitest run src/components/planning/planning-workbench.test.tsx src/lib/hooks/use-chapter-editor.test.ts src/lib/hooks/use-layout.test.ts src/lib/hooks/use-consistency-scan.test.ts` | pass | Verified hook-dependency cleanup did not regress form persistence or scan/editor behavior |

## Issue Ledger

| ID | Severity | Area | Evidence | Owner Files | Fix Decision | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| AUD-001 | P1 | build/layout-persistence | `pnpm build` failed in `src/lib/hooks/use-layout.ts` because `typeof DEFAULT_LAYOUT` narrowed persisted nullable ids to `null` only | `src/lib/hooks/use-layout.ts` | fixed | `pnpm build`, `src/lib/hooks/use-layout.test.ts` |
| AUD-002 | P1 | lint/tooling-boundary | `pnpm lint` failed because repository-local `.agents/**` design skill assets were treated as product source | `eslint.config.mjs` | fixed | `pnpm lint` |
| AUD-003 | P1 | build/auth | `pnpm build` failed in `src/lib/hooks/useAuth.ts` due to missing `@supabase/supabase-js` type import | `src/lib/hooks/useAuth.ts` | fixed | `pnpm build` |
| AUD-004 | P2 | auth-subscription-performance | `useAuth()` recreated the Supabase browser client on every render, forcing redundant auth subscriptions | `src/lib/hooks/useAuth.ts` | fixed | code inspection + `pnpm build` |
| AUD-005 | P2 | hook-stability | `react-hooks/exhaustive-deps` warnings indicated stale closure / resubscription risks in planning, editor hydration, and consistency scan flows | `src/components/planning/planning-workbench.tsx`, `src/lib/hooks/use-chapter-editor.ts`, `src/lib/hooks/use-consistency-scan.ts` | fixed | `pnpm lint`, targeted vitest run |

## Deferred

| ID | Reason | Follow-up |
| --- | --- | --- |
| DEF-001 | This pass did not rerun Playwright workflow coverage; current evidence came from lint/build/unit scope | Run `pnpm test:e2e -- tests/e2e/project-workflow.spec.ts` in the next audit slice |

## Final Verification

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | pass | no warnings or errors |
| `pnpm test` | pass | `73` files passed |
| `pnpm build` | pass | Next.js production build completed successfully |
