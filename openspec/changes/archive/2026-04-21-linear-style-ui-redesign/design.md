## Context

The application uses Tailwind CSS with Radix UI primitives. Current UI has inconsistent styling: mixed border styles, varied padding, no unified spacing system. The goal is to retrofit Linear's design aesthetic without replacing the underlying component architecture.

Key constraints:
- Radix UI components remain functional (dialog, dropdown, etc.)
- Tailwind 4 with CSS variables for theming
- Dark/light mode must be supported
- No structural rewrites of existing components

## Goals / Non-Goals

**Goals:**
- Implement Linear's color system: neutral grays, single purple accent
- Consistent 4px base spacing grid
- 6px border-radius on all components
- Border-based separation instead of shadows
- Clean typography with Inter font, 14px base, medium weight hierarchy

**Non-Goals:**
- Restructuring component logic or behavior
- Adding new functionality
- Changing data models or APIs

## Decisions

1. **Use CSS custom properties for theme tokens**
   - Define `--color-*`, `--spacing-*`, `--radius-*` variables in globals.css
   - Map to Tailwind via arbitrary values or CSS variable references
   - Enables consistent theming without duplicating values everywhere

2. **Linear's exact border system**
   - 1px solid borders with `rgba(0,0,0,0.07)` for light, `rgba(255,255,255,0.07)` for dark
   - No box-shadows except for floating elements (dropdowns, dialogs)
   - Subtle `rgba(0,0,0,0.04)` shadow for elevated elements

3. **Color palette**
   - Background: `#FFFFFF` light / `#0D0D0F` dark
   - Surface: `#F5F5F5` light / `#161618` dark
   - Border: `rgba(0,0,0,0.07)` light / `rgba(255,255,255,0.07)` dark
   - Text: `#18181B` light / `#FAFAFA` dark
   - Accent: `#8B5CF6` (purple-500) for interactive elements

4. **Typography**
   - Inter font family
   - Base 14px, line-height 1.5
   - Font weights: 400 (regular), 500 (medium), 600 (semibold)

5. **Spacing system**
   - 4px base unit
   - Standard spacings: 4, 8, 12, 16, 20, 24, 32px

6. **Border-radius**
   - Small (buttons, inputs): 6px
   - Medium (cards, dialogs): 8px
   - Large (modals): 12px

## Risks / Trade-offs

- [Risk] Inheriting Radix styles fights the new design → Mitigation: Override Radix parts via CSS (parts attribute)
- [Risk] Touching many files causes regressions → Mitigation: Implement via globals.css additions + selective component overrides
- [Risk] Dark mode gaps in current implementation → Mitigation: Audit dark mode coverage before rollout

## Open Questions

- Should we preserve the gradient backgrounds on hero areas or replace with solid colors?
- Any existing animations to keep or remove? (Linear favors instant transitions with subtle hover states)