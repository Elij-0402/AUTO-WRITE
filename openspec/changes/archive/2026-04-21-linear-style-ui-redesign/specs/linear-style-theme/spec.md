## ADDED Requirements

### Requirement: Design tokens as CSS custom properties
The system SHALL define all Linear-style design tokens as CSS custom properties in globals.css, enabling consistent theming across all components.

#### Scenario: Theme variables defined
- **WHEN** the application loads
- **THEN** CSS custom properties for colors, spacing, typography, and radius are available

#### Scenario: Dark mode variables
- **WHEN** the user toggles dark mode
- **THEN** all CSS variables update to their dark counterparts

### Requirement: Color palette implementation
The system SHALL implement Linear's neutral color palette with a single purple accent color.

#### Scenario: Light mode colors
- **WHEN** user is in light mode
- **THEN** background is `#FFFFFF`, surface is `#F5F5F5`, text is `#18181B`

#### Scenario: Dark mode colors
- **WHEN** user is in dark mode
- **THEN** background is `#0D0D0F`, surface is `#161618`, text is `#FAFAFA`

#### Scenario: Accent color
- **WHEN** user interacts with interactive elements
- **THEN** the accent color `#8B5CF6` (purple-500) is applied

### Requirement: Spacing system
The system SHALL implement a 4px-based spacing system for all components.

#### Scenario: Standard spacing values
- **WHEN** components need spacing
- **THEN** they SHALL use multiples of 4px: 4, 8, 12, 16, 20, 24, 32px

### Requirement: Border-radius tokens
The system SHALL define consistent border-radius values.

#### Scenario: Small radius
- **WHEN** rendering buttons, inputs, or small elements
- **THEN** border-radius SHALL be 6px

#### Scenario: Medium radius
- **WHEN** rendering cards, dialogs, or medium elements
- **THEN** border-radius SHALL be 8px

#### Scenario: Large radius
- **WHEN** rendering modals or large containers
- **THEN** border-radius SHALL be 12px

### Requirement: Typography system
The system SHALL implement Linear's typography hierarchy.

#### Scenario: Font configuration
- **WHEN** text is rendered
- **THEN** Inter font family is used at 14px base with 1.5 line-height

#### Scenario: Font weights
- **WHEN** text needs emphasis
- **THEN** font weights 400 (regular), 500 (medium), 600 (semibold) are available

### Requirement: Border-based separation
The system SHALL use borders instead of shadows for component separation.

#### Scenario: Light mode borders
- **WHEN** a component needs a border in light mode
- **THEN** border color is `1px solid rgba(0,0,0,0.07)`

#### Scenario: Dark mode borders
- **WHEN** a component needs a border in dark mode
- **THEN** border color is `1px solid rgba(255,255,255,0.07)`

#### Scenario: Floating element shadows
- **WHEN** a dropdown or dialog is rendered
- **THEN** a subtle shadow `rgba(0,0,0,0.04)` is applied