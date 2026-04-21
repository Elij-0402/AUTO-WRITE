## ADDED Requirements

### Requirement: Button styling
All button components SHALL use Linear-inspired styling with consistent padding, border-radius, and hover states.

#### Scenario: Primary button
- **WHEN** a primary button is rendered
- **THEN** it has 6px border-radius, medium weight text, and accent color on hover

#### Scenario: Secondary button
- **WHEN** a secondary button is rendered
- **THEN** it has subtle border, transparent background, and border highlight on hover

#### Scenario: Ghost button
- **WHEN** a ghost button is rendered
- **THEN** it has no border, transparent background, and subtle background on hover

### Requirement: Input styling
Input components SHALL use Linear's clean aesthetic with consistent borders and focus states.

#### Scenario: Text input default
- **WHEN** a text input is rendered
- **THEN** it has 6px border-radius, 1px border, and no shadow

#### Scenario: Text input focus
- **WHEN** a text input receives focus
- **THEN** border color changes to accent color with subtle outline

### Requirement: Card styling
Card components SHALL use minimal borders and consistent spacing.

#### Scenario: Card default
- **WHEN** a card is rendered
- **THEN** it has 8px border-radius, subtle border, and 16px internal padding

#### Scenario: Card hover
- **WHEN** a card has hover interaction
- **THEN** subtle border color change indicates interactivity

### Requirement: Dialog styling
Dialog components SHALL use clean borders and consistent elevation.

#### Scenario: Dialog appearance
- **WHEN** a dialog is rendered
- **THEN** it has 12px border-radius, subtle shadow, and centered positioning

#### Scenario: Dialog overlay
- **WHEN** a dialog is open
- **THEN** the overlay uses semi-transparent dark background with blur

### Requirement: Dropdown styling
Dropdown menus SHALL use consistent borders and subtle shadows.

#### Scenario: Dropdown default
- **WHEN** a dropdown menu is rendered
- **THEN** it has 6px border-radius, 1px border, and subtle shadow

#### Scenario: Dropdown item hover
- **WHEN** a dropdown item is hovered
- **THEN** background changes to surface color

### Requirement: Hover state consistency
Interactive elements SHALL have subtle, consistent hover state transitions.

#### Scenario: Transition timing
- **WHEN** hover state changes on any interactive element
- **THEN** transition duration is 100-150ms with ease-out timing

### Requirement: Focus state consistency
All interactive elements SHALL have clear focus indicators for accessibility.

#### Scenario: Focus ring
- **WHEN** a keyboard user tabs to an interactive element
- **THEN** a 2px accent-colored ring appears around the element

### Requirement: Micro-interactions
Interactive elements SHALL have subtle micro-interactions that provide feedback.

#### Scenario: Button press
- **WHEN** a button is pressed
- **THEN** slight scale reduction (0.98) provides tactile feedback