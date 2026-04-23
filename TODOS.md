# TODOS

## TODO: Auth page decorative imagery (FINDING-002/010)
- **What:** Replace the left panel decorative blur shapes on `/auth` with minimal ink-wash texture or no decoration per DESIGN.md.
- **Why:** AI slop pattern violates design system. Purple gradients removed but blur shapes remain. This is the last visual signal saying "generic AI SaaS".
- **Pros:** Cleared design identity. Removes AI slop visual pattern.
- **Cons:** Requires design input on replacement (ink-wash pattern, no decoration, or simple logo).
- **Context:** Three quick fixes already applied to auth page (cinnabar accent, warm ink white, tab indicators). This is the lowest-priority remaining visual issue. Found in `src/app/auth/page.tsx` left panel.
- **Depends on:** Design decision on what replaces the blur. DESIGN.md says "minimal decoration" — the typography carries the aesthetic.

## TODO: Auth H1 font (FINDING-009)
- **What:** Add `font-display` class to the "InkForge" h1 on the auth page to use LXGW WenKai per DESIGN.md.
- **Why:** LXGW fonts are loaded from CDN (~300KB) but `--font-sans` points to Inter. Brand identity requires 楷体 for display text.
- **Pros:** 5-min fix, direct design compliance.
- **Cons:** May require `font-display: swap` to prevent FOUC.
- **Context:** Part of the CSS token migration (Issue #4 from eng review). Font variable assignment will be done there; this is the 1-line component change to apply the class.
- **Depends on:** CSS token migration completing first (so `font-display` var exists).

## TODO: Extract sendChat() non-streaming facade (Issue #1)
- **What:** Create a `sendChat()` function mirroring `streamChat()` that returns a parsed response object instead of streaming events. Move URL/header construction for the scan path into the existing provider layer (`anthropic.ts`, `openai-compatible.ts`). Update `scanConsistency` to call `sendChat()` instead of direct `fetch()`.
- **Why:** Provider routing is duplicated between `client.ts` and `scan-consistency.ts:buildScanRequest()`. Every future config change must update two places.
- **Pros:** Single source of truth. Future providers automatically work for scan. `scan-consistency.ts` drops from 110 lines of API wiring to a simple function call.
- **Cons:** Requires adding non-streaming paths to both providers.
- **Context:** Issue #1 from eng review. `scan-consistency.ts:79-116` duplicates URL construction and header formatting from `anthropic.ts` and `openai-compatible.ts`.
- **Depends on / blocked by:** None. This can be done independently.