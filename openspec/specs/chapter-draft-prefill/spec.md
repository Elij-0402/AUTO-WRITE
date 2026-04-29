# chapter-draft-prefill Specification

## Purpose
TBD - created by archiving change tighten-planning-draft-loop. Update Purpose after archive.

## Requirements
### Requirement: Linked chapters SHALL prefill drafting from the latest planning breakdown
When a chapter is linked to a chapter plan, the drafting panel SHALL build its prefilled outline from the latest linked chapter-plan data and ordered scene cards.

#### Scenario: Open draft panel for a linked chapter with scene cards
- **WHEN** the user opens the draft panel for a chapter linked to a chapter plan that has scene cards
- **THEN** the system pre-fills the outline from the linked chapter plan
- **AND** includes scene cards in persisted scene order
- **AND** shows a source summary that references the number of linked scene cards

#### Scenario: Refresh prefill when planning changed before local draft edits
- **WHEN** the linked chapter plan or any linked scene card changes before the user edits the prefilled outline
- **THEN** the system refreshes the draft prefill from the latest planning state
- **AND** uses the updated scene-card content and ordering

### Requirement: Drafting SHALL protect local outline edits during planning refresh
Once the user starts editing the prefilled draft outline, the system SHALL not silently replace that text when linked planning data changes.

#### Scenario: Linked planning changes after the outline becomes dirty
- **WHEN** the linked chapter plan or any linked scene card changes after the user has manually edited the draft outline
- **THEN** the system preserves the local outline text
- **AND** indicates that newer planning context is available
- **AND** provides a user action to refresh from planning explicitly

#### Scenario: Apply explicit planning refresh
- **WHEN** the user chooses to refresh the draft outline from newer linked planning data
- **THEN** the system rebuilds the outline from the latest linked chapter plan and ordered scene cards
- **AND** updates the displayed planning source summary to match the refreshed context
