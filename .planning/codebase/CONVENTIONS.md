# Coding Conventions (InkForge)

## TypeScript & Naming
- **Components**: PascalCase (e.g., `SyncManager.tsx`).
- **Files/Hooks**: kebab-case or camelCase matching Next.js standard conventions (e.g., `use-autosave.ts`, `editor-toolbar.tsx`).
- **Interfaces**: Implicit domain naming, mapped in `src/lib/types/` (e.g., `Chapter`, `Project`).

## State & Reactivity
- Extensive use of hooks (`src/lib/hooks/`) for data access inside components rather than global store waterfalls.
- `zustand` is reserved for true app-level ephemeral state (like active panel states) that does not belong in the IndexedDB source-of-truth.

## Styling
- Heavily biased towards Tailwind CSS utility classes.
- Standard Shadcn approach for primitives: utility classes combined via `class-variance-authority` and `tailwind-merge` in `src/components/ui/` and `src/utils/index.ts`.

## Editor
- Modifications to TiPtap logic should be packaged as distinct extensions rather than bloated React wrapper logic.
