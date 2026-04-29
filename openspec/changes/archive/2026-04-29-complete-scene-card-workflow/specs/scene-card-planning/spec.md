## ADDED Requirements

### Requirement: Chapter plans SHALL support scene-card authoring
When a user selects a chapter plan in the planning workbench, the system SHALL show the scene cards attached to that chapter plan and allow the user to manage them as ordered drafting beats.

#### Scenario: View scene cards for a selected chapter plan
- **WHEN** the user opens a chapter plan that already has scene cards
- **THEN** the system shows the scene cards in chapter-plan order
- **AND** each scene card shows its title, viewpoint, location, objective, obstacle, outcome, continuity notes, and status

#### Scenario: Add a new scene card under a chapter plan
- **WHEN** the user creates a scene card from a selected chapter plan
- **THEN** the system persists the scene card under that chapter plan
- **AND** assigns it the next available order value for that chapter plan
- **AND** refreshes the planning view to include the new card

#### Scenario: Update an existing scene card
- **WHEN** the user edits any scene-card field in the planning workbench
- **THEN** the system persists the updated value
- **AND** preserves the scene card's parent chapter plan and identity

#### Scenario: Reorder scene cards inside a chapter plan
- **WHEN** the user changes the order of scene cards within a selected chapter plan
- **THEN** the system persists the new order
- **AND** subsequent planning and drafting views use the updated ordering

### Requirement: Planning AI SHALL generate previewable scene-card drafts
The planning AI panel SHALL support expanding a selected chapter plan into a structured set of scene-card drafts that the user can review before saving.

#### Scenario: Generate scene-card preview from a chapter plan
- **WHEN** the user triggers scene-card generation while a chapter plan is selected
- **THEN** the system sends the selected chapter-plan context and planning snapshot to the planning AI prompt builder
- **AND** receives a structured scene-card result set
- **AND** renders the generated scene cards as a preview instead of writing them immediately

#### Scenario: Apply generated scene-card preview
- **WHEN** the user accepts a generated scene-card preview
- **THEN** the system creates scene cards in the selected chapter plan using the preview order
- **AND** returns focus to the first created scene card or the updated chapter-plan scene list

#### Scenario: Hide scene-card generation when chapter context is missing
- **WHEN** no chapter plan is selected
- **THEN** the planning AI panel does not offer the scene-card generation action

### Requirement: Planning SHALL surface scene coverage for drafting readiness
The planning workflow SHALL expose whether a chapter plan has enough scene detail to drive chapter drafting with less ambiguity.

#### Scenario: Show scene coverage in chapter-plan context
- **WHEN** the user views a chapter plan
- **THEN** the system shows how many scene cards are attached to that chapter plan
- **AND** distinguishes between chapters with no scene breakdown and chapters with at least one scene card

#### Scenario: Reflect scene coverage in drafting prefill
- **WHEN** a chapter plan linked to a chapter has scene cards
- **THEN** the drafting prefill summary references the number of scene cards used as source material
- **AND** uses scene-card order when assembling the draft outline context
