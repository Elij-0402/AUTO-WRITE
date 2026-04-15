import type { WorldEntryType } from '../types/world-entry'
import type { Relation } from '../types/relation'

/**
 * Entry type mapping for suggestion parsing.
 * Used to match entry names to their types.
 */
export interface EntriesByType {
  character: Array<{ id: string; name: string }>
  location: Array<{ id: string; name: string }>
  rule: Array<{ id: string; name: string }>
  timeline: Array<{ id: string; name: string }>
}

/**
 * Relationship suggestion extracted from AI response.
 * Per D-13, D-23: Includes bidirectional description.
 */
export interface RelationshipSuggestion {
  type: 'relationship'
  entry1Name: string
  entry2Name: string
  entry1Type: WorldEntryType
  entry2Type: WorldEntryType
  relationshipType: string
  bidirectionalDescription: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * New entry suggestion extracted from AI response.
 * Per D-18-21: Type-specific pre-fill fields.
 */
export interface NewEntrySuggestion {
  type: 'newEntry'
  entryType: WorldEntryType
  suggestedName: string
  description: string
  extractedFields: Record<string, string>
  confidence: 'high' | 'medium' | 'low'
}

/** Unified suggestion type */
export type Suggestion = RelationshipSuggestion | NewEntrySuggestion

/**
 * Parse relationship suggestions from AI response text.
 * Looks for patterns like:
 * - "建议关联: [角色A] 和 [角色B]"
 * - "[角色A] 与 [角色B] 存在 [关系类型] 关系"
 * - "建议建立关系: [条目1] ↔ [条目2]"
 */
function parseRelationshipSuggestions(
  text: string,
  entriesByType: EntriesByType
): RelationshipSuggestion[] {
  const suggestions: RelationshipSuggestion[] = []

  // Pattern 1: "建议关联: [角色A] 和 [角色B]"
  const pattern1 = /建议关联:\s*([^\s，,、]+)\s*(?:和|与)\s*([^\s，,、]+)/g
  let match
  while ((match = pattern1.exec(text)) !== null) {
    const entry1Name = match[1].trim()
    const entry2Name = match[2].trim()
    const { entry1Type, entry2Type } = inferEntryTypes(entry1Name, entry2Name, entriesByType)
    suggestions.push(createRelationshipSuggestion(
      entry1Name, entry2Name, entry1Type, entry2Type,
      '关联', text, match.index
    ))
  }

  // Pattern 2: "[角色A] 与 [角色B] 存在 [关系类型] 关系"
  const pattern2 = /([^\s，,、]+)\s*与\s*([^\s，,、]+)\s*(?:存在|是|属于)?\s*([^\s，,、]+)?\s*(?:关系|的)?/g
  while ((match = pattern2.exec(text)) !== null) {
    // Skip if this looks like a new entry suggestion
    if (match[3] && (match[3].includes('创建') || match[3].includes('建议'))) continue
    const entry1Name = match[1].trim()
    const entry2Name = match[2].trim()
    const relationshipType = match[3]?.trim() || '关联'
    const { entry1Type, entry2Type } = inferEntryTypes(entry1Name, entry2Name, entriesByType)
    suggestions.push(createRelationshipSuggestion(
      entry1Name, entry2Name, entry1Type, entry2Type,
      relationshipType, text, match.index
    ))
  }

  // Pattern 3: "建议建立关系: [条目1] ↔ [条目2]"
  const pattern3 = /建议(?:建立)?关系:\s*([^\s]+)\s*(?:↔|—|--|<->|→)\s*([^\s]+)/g
  while ((match = pattern3.exec(text)) !== null) {
    const entry1Name = match[1].trim()
    const entry2Name = match[2].trim()
    const { entry1Type, entry2Type } = inferEntryTypes(entry1Name, entry2Name, entriesByType)
    suggestions.push(createRelationshipSuggestion(
      entry1Name, entry2Name, entry1Type, entry2Type,
      '关联', text, match.index
    ))
  }

  return suggestions
}

/**
 * Parse new entry suggestions from AI response text.
 * Looks for patterns like:
 * - "建议新建角色: [名字] - [描述]"
 * - "可以创建新地点: [名称] ([描述])"
 * - "建议添加规则: [名称] - [内容]"
 * - "时间线上可以添加: [事件]"
 */
function parseNewEntrySuggestions(text: string): NewEntrySuggestion[] {
  const suggestions: NewEntrySuggestion[] = []

  // Pattern 1: "建议新建角色: [名字] - [描述]"
  const charPattern = /建议(?:新建|创建)?角色:\s*([^-]+)(?:\s*-\s*(.+))?/g
  let match
  while ((match = charPattern.exec(text)) !== null) {
    const name = match[1].trim()
    const description = match[2]?.trim() || ''
    suggestions.push(createNewEntrySuggestion('character', name, description, match.index))
  }

  // Pattern 2: "可以创建新地点: [名称] ([描述])"
  const locationPattern = /(?:可以创建新地点|建议新建地点|新建地点):\s*([^(]+)(?:\s*\(([^)]+)\))?/g
  while ((match = locationPattern.exec(text)) !== null) {
    const name = match[1].trim()
    const description = match[2]?.trim() || ''
    suggestions.push(createNewEntrySuggestion('location', name, description, match.index))
  }

  // Pattern 3: "建议添加规则: [名称] - [内容]"
  const rulePattern = /(?:建议添加规则|新建规则|添加规则):\s*([^-]+)(?:\s*-\s*(.+))?/g
  while ((match = rulePattern.exec(text)) !== null) {
    const name = match[1].trim()
    const content = match[2]?.trim() || ''
    suggestions.push(createNewEntrySuggestion('rule', name, content, match.index))
  }

  // Pattern 4: "时间线上可以添加: [事件]" or "可以添加时间线: [事件]"
  const timelinePattern = /(?:时间线上(?:可以)?添加|可以添加时间线|新建时间线):\s*([^(]+)(?:\s*\(([^)]+)\))?/g
  while ((match = timelinePattern.exec(text)) !== null) {
    const name = match[1].trim()
    const eventDescription = match[2]?.trim() || ''
    suggestions.push(createNewEntrySuggestion('timeline', name, eventDescription, match.index))
  }

  return suggestions
}

/**
 * Infer entry types by matching names against existing entries.
 */
function inferEntryTypes(
  name1: string,
  name2: string,
  entriesByType: EntriesByType
): { entry1Type: WorldEntryType; entry2Type: WorldEntryType } {
  let entry1Type: WorldEntryType = 'character'
  let entry2Type: WorldEntryType = 'character'

  // Try to find entry types by name matching
  for (const [type, entries] of Object.entries(entriesByType)) {
    for (const entry of entries) {
      if (entry.name.includes(name1) || name1.includes(entry.name)) {
        if (entry1Type === 'character') {
          entry1Type = type as WorldEntryType
        }
      }
      if (entry.name.includes(name2) || name2.includes(entry.name)) {
        if (entry2Type === 'character') {
          entry2Type = type as WorldEntryType
        }
      }
    }
  }

  return { entry1Type, entry2Type }
}

/**
 * Create a relationship suggestion with confidence scoring.
 */
function createRelationshipSuggestion(
  entry1Name: string,
  entry2Name: string,
  entry1Type: WorldEntryType,
  entry2Type: WorldEntryType,
  relationshipType: string,
  text: string,
  matchIndex: number
): RelationshipSuggestion {
  // Confidence scoring based on pattern clarity
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  
  // High confidence: explicit pattern with relationship type
  if (relationshipType && relationshipType.length > 1) {
    confidence = 'high'
  }
  
  // Low confidence: vague mentions
  if (text.slice(matchIndex, matchIndex + 50).includes('可能') || 
      text.slice(matchIndex, matchIndex + 50).includes('也许')) {
    confidence = 'low'
  }

  // Generate bidirectional description per D-13, D-23
  const bidirectionalDescription = `${entry1Name}是${entry2Name}的${relationshipType}，${entry2Name}是${entry1Name}的${relationshipType}`

  return {
    type: 'relationship',
    entry1Name,
    entry2Name,
    entry1Type,
    entry2Type,
    relationshipType,
    bidirectionalDescription,
    confidence
  }
}

/**
 * Create a new entry suggestion with confidence scoring.
 */
function createNewEntrySuggestion(
  entryType: WorldEntryType,
  name: string,
  description: string,
  matchIndex: number,
  text?: string
): NewEntrySuggestion {
  // Confidence scoring
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  
  // High confidence: explicit suggestion with description
  if (description && description.length > 10) {
    confidence = 'high'
  }
  
  // Low confidence: vague suggestions
  if (!description || description.length < 5) {
    confidence = 'low'
  }

  // Extract type-specific fields per D-18-21
  const extractedFields: Record<string, string> = {}
  switch (entryType) {
    case 'character':
      if (description) {
        extractedFields.background = description
      }
      break
    case 'location':
      if (description) {
        extractedFields.description = description
      }
      break
    case 'rule':
      if (description) {
        extractedFields.content = description
      }
      break
    case 'timeline':
      if (description) {
        extractedFields.eventDescription = description
      }
      break
  }

  return {
    type: 'newEntry',
    entryType,
    suggestedName: name,
    description,
    extractedFields,
    confidence
  }
}

/**
 * Filter suggestions by confidence threshold.
 * Per D-16: Medium confidence threshold (filter out low confidence).
 */
function filterByConfidence(suggestions: Suggestion[]): Suggestion[] {
  return suggestions.filter(s => s.confidence !== 'low')
}

/**
 * Deduplication function for suggestions.
 * Removes duplicate relationship suggestions (same entity pairs, regardless of order)
 * and duplicate new entry suggestions (same suggestedName).
 */
function deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const seen = new Set<string>()
  const deduplicated: Suggestion[] = []

  for (const suggestion of suggestions) {
    let key: string
    if (suggestion.type === 'relationship') {
      // Create a consistent key for relationship suggestions (sort names to handle both directions)
      const names = [suggestion.entry1Name, suggestion.entry2Name].sort()
      key = `rel:${names[0]}|${names[1]}`
    } else {
      // For new entries, key is the suggested name
      key = `entry:${suggestion.suggestedName}`
    }

    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(suggestion)
    }
  }

  return deduplicated
}

/**
 * Limit suggestions to maximum count.
 * Per D-12: Maximum 3 suggestions per AI response.
 */
function limitSuggestions(suggestions: Suggestion[], max: number = 3): Suggestion[] {
  return suggestions.slice(0, max)
}

/**
 * Parse AI response text to extract relationship and new entry suggestions.
 * Per D-06: Auto-analyze after AI response completes.
 * Per D-12: Maximum 3 suggestions per AI response.
 * Per D-16: Medium confidence threshold.
 * 
 * @param aiResponse - The AI's response text to analyze
 * @param entriesByType - Existing entries grouped by type for matching
 * @returns Array of suggestions (max 3, filtered by confidence)
 */
export function parseAISuggestions(
  aiResponse: string,
  entriesByType: EntriesByType
): Suggestion[] {
  const all: Suggestion[] = [
    ...parseRelationshipSuggestions(aiResponse, entriesByType),
    ...parseNewEntrySuggestions(aiResponse)
  ]
  
  // Filter by confidence, deduplicate, then limit to 3
  const filtered = filterByConfidence(all)
  const deduped = deduplicateSuggestions(filtered)
  return limitSuggestions(deduped, 3)
}
