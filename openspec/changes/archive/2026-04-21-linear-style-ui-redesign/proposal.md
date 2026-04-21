## Why

The current UI lacks visual cohesion and feels dated compared to modern productivity tools. Linear's design language—clean typography, subtle borders, muted colors with purposeful accents—provides a fresh, professional aesthetic that reduces visual noise and helps users focus on content.

## What Changes

- Adopt Linear's minimalist design language with clean lines, subtle shadows, and ample whitespace
- Implement a refined color palette with dark/light modes using neutral backgrounds and single accent colors
- Redesign component styles for buttons, inputs, cards, and dialogs with consistent border-radius and spacing
- Replace bulky panels with lightweight, borderless layouts using dividers for separation
- Add subtle hover states and micro-interactions for polish
- Clean up navigation with minimal icons and clear typography hierarchy

## Capabilities

### New Capabilities

- `linear-style-theme`: Core visual theme implementing Linear's design tokens (colors, typography, spacing, shadows)
- `ui-component-redesign`: Unified component library replacing current UI components with Linear-inspired variants

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- Affects all UI components in `src/components/ui/` and `src/components/workspace/`
- Theme configuration in Tailwind and CSS variables
- No API or data model changes