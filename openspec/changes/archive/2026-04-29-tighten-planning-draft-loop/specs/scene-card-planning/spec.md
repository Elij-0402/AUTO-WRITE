## ADDED Requirements

### Requirement: Applied scene-card previews SHALL reveal newly created scene beats
When the user accepts AI-generated scene-card previews, the planning workbench SHALL make the new scene breakdown immediately reachable inside the selected chapter plan.

#### Scenario: Apply generated scene cards to a chapter that already has scenes
- **WHEN** the user accepts a generated scene-card preview for a chapter plan that already contains scene cards
- **THEN** the system creates the new scene cards using the preview order
- **AND** expands, focuses, or otherwise reveals the first newly created scene card in the chapter-plan scene list

#### Scenario: Apply generated scene cards to an empty chapter
- **WHEN** the user accepts a generated scene-card preview for a chapter plan with no existing scene cards
- **THEN** the system creates the generated scene cards
- **AND** opens the first created scene card so the user can review the result immediately
