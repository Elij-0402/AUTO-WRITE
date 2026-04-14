/**
 * Context injection hook for AI chat — per D-01, D-07, D-11, D-15, D-25, D-26, D-27
 * 
 * Provides keyword matching, token budgeting (4000 tokens), priority trimming,
 * and context assembly for world bible entries to be injected into AI system prompts.
 */

import type { WorldEntry, WorldEntryType } from '../types/world-entry'

/** Entry type groupings for context injection — per D-09 */
export interface EntriesByType {
  character: WorldEntry[]
  location: WorldEntry[]
  rule: WorldEntry[]
  timeline: WorldEntry[]
}

/** Token budget per D-01: 4000 tokens max for context */
export const DEFAULT_TOKEN_BUDGET = 4000

/** Priority order for trimming per D-07: character > location > rule > timeline */
const TYPE_PRIORITY: WorldEntryType[] = ['character', 'location', 'rule', 'timeline']

/**
 * Extract keywords from user input for matching against entry names/fields.
 * Per D-15: uses simple Chinese word segmentation via delimiter splitting.
 * Extracts 2-4 character sequences that match entry names.
 */
export function extractKeywords(text: string): string[] {
  if (!text) return []
  
  // Remove common punctuation and split by whitespace/punctuation
  const cleaned = text
    .replace(/[，。！？、；：""''【】《》（）()（）]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  const segments = cleaned.split(' ')
  const keywords: string[] = []
  
  for (const segment of segments) {
    // Skip single characters and very long strings
    if (segment.length >= 2 && segment.length <= 10) {
      keywords.push(segment)
    }
    
    // Also extract 2-4 character substrings for Chinese text matching
    if (segment.length >= 2) {
      for (let i = 0; i <= segment.length - 2; i++) {
        for (let len = 2; len <= 4 && i + len <= segment.length; len++) {
          const sub = segment.substring(i, i + len)
          if (!keywords.includes(sub)) {
            keywords.push(sub)
          }
        }
      }
    }
  }
  
  // Return unique keywords, prefer shorter matches (more specific)
  return [...new Set(keywords)]
}

/**
 * Match keywords against entry names and core fields.
 * Per D-11: searches name + type-specific core fields.
 * Returns matched entries sorted by relevance score.
 */
export function findRelevantEntries(
  keywords: string[],
  entriesByType: EntriesByType
): WorldEntry[] {
  if (keywords.length === 0) return []
  
  const allEntries = [
    ...entriesByType.character,
    ...entriesByType.location,
    ...entriesByType.rule,
    ...entriesByType.timeline,
  ]
  
  const keywordLower = keywords.map(k => k.toLowerCase())
  const scored: Array<{ entry: WorldEntry; score: number }> = []
  
  for (const entry of allEntries) {
    let score = 0
    
    // Name match is highest weight
    if (matchKeyword(entry.name, keywordLower)) {
      score += 10
    }
    
    // Core fields based on type
    if (entry.type === 'character') {
      if (matchKeyword(entry.personality, keywordLower)) score += 5
      if (matchKeyword(entry.appearance, keywordLower)) score += 3
      if (matchKeyword(entry.background, keywordLower)) score += 3
      if (matchKeyword(entry.alias, keywordLower)) score += 4
    } else if (entry.type === 'location') {
      if (matchKeyword(entry.description, keywordLower)) score += 5
      if (matchKeyword(entry.features, keywordLower)) score += 3
    } else if (entry.type === 'rule') {
      if (matchKeyword(entry.content, keywordLower)) score += 5
      if (matchKeyword(entry.scope, keywordLower)) score += 3
    } else if (entry.type === 'timeline') {
      if (matchKeyword(entry.eventDescription, keywordLower)) score += 5
      if (matchKeyword(entry.timePoint, keywordLower)) score += 3
    }
    
    // Tags match
    if (entry.tags?.some(tag => matchKeyword(tag, keywordLower))) {
      score += 2
    }
    
    if (score > 0) {
      scored.push({ entry, score })
    }
  }
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)
  return scored.map(s => s.entry)
}

/**
 * Check if a field value matches any keyword (case-insensitive).
 */
function matchKeyword(value: string | undefined, keywords: string[]): boolean {
  if (!value) return false
  const lower = value.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

/**
 * Estimate token count using ~1.5 chars per token for Chinese text.
 * Per D-01: uses this estimation for token budgeting.
 */
export function calculateTokenCount(entries: WorldEntry[]): number {
  return entries.reduce((total, entry) => {
    // Format the entry and count characters
    const formatted = formatEntryForContext(entry)
    // ~1.5 Chinese characters per token is a reasonable estimate
    return total + Math.ceil(formatted.length / 1.5)
  }, 0)
}

/**
 * Format a single entry for injection into system prompt.
 * Per D-26: 【角色】Name: 姓名 X, 外貌 X, 性格 X, 背景 X
 * Per D-11: Name + core description fields only (no tags, no relations)
 */
export function formatEntryForContext(entry: WorldEntry): string {
  switch (entry.type) {
    case 'character':
      return `【角色】${entry.name}: 姓名 ${entry.name || ''}, 外貌 ${entry.appearance || ''}, 性格 ${entry.personality || ''}, 背景 ${entry.background || ''}`
    
    case 'location':
      return `【地点】${entry.name}: 名称 ${entry.name || ''}, 描述 ${entry.description || ''}, 特征 ${entry.features || ''}`
    
    case 'rule':
      return `【规则】${entry.name}: 名称 ${entry.name || ''}, 内容 ${entry.content || ''}, 适用范围 ${entry.scope || ''}`
    
    case 'timeline':
      return `【时间线】${entry.name}: 名称 ${entry.name || ''}, 时间点 ${entry.timePoint || ''}, 事件 ${entry.eventDescription || ''}`
    
    default:
      return `【${entry.type}】${entry.name}`
  }
}

/**
 * Trim entries to fit within token budget.
 * Per D-07: Priority-based trimming (character > location > rule > timeline).
 * Keeps trimming until under budget.
 */
export function trimToTokenBudget(
  entries: WorldEntry[],
  maxTokens: number = DEFAULT_TOKEN_BUDGET
): WorldEntry[] {
  if (entries.length === 0) return []
  
  // Group by priority
  const byPriority = new Map<WorldEntryType, WorldEntry[]>()
  for (const type of TYPE_PRIORITY) {
    byPriority.set(type, [])
  }
  
  for (const entry of entries) {
    const list = byPriority.get(entry.type)
    if (list) list.push(entry)
  }
  
  // Build result in priority order
  const result: WorldEntry[] = []
  let currentTokens = 0
  
  for (const type of TYPE_PRIORITY) {
    const entriesOfType = byPriority.get(type) || []
    
    for (const entry of entriesOfType) {
      const entryTokens = Math.ceil(formatEntryForContext(entry).length / 1.5)
      
      if (currentTokens + entryTokens <= maxTokens) {
        result.push(entry)
        currentTokens += entryTokens
      } else {
        // Stop adding - over budget
        break
      }
    }
    
    // If we just hit budget, stop adding
    if (currentTokens >= maxTokens) break
  }
  
  return result
}

/**
 * Build the 【世界观百科】 section by joining formatted entries with newlines.
 * Per D-27: The context prompt structure is built here.
 */
export function buildContextPrompt(entries: WorldEntry[]): string {
  if (entries.length === 0) return ''
  
  const formatted = entries.map(formatEntryForContext)
  return formatted.join('\n')
}

/**
 * Inject context into system prompt at the 【世界观百科】 placeholder position.
 * Per D-25: Context injection location is in system prompt (persistent across conversation).
 * Per D-27: System prompt template structure: 【世界观百科】...【当前讨论】...【你的任务】...
 * 
 * If no entries, omits the 【世界观百科】 section entirely.
 */
export function injectContext(
  entries: WorldEntry[],
  baseSystemPrompt: string
): string {
  const worldBibleContext = buildContextPrompt(entries)
  
  if (!worldBibleContext) {
    // No entries - remove the section entirely
    return baseSystemPrompt
      .replace(/【世界观百科】[\s\S]*?(\n\n【当前讨论】)/, '$1')
      .replace(/【世界观百科】[\s\S]*$/, '')
      .trim()
  }
  
  // Inject context at the 【世界观百科】 placeholder
  if (baseSystemPrompt.includes('{worldBibleContext}')) {
    return baseSystemPrompt.replace('{worldBibleContext}', worldBibleContext)
  }
  
  // Fallback: replace the placeholder marker with actual context
  if (baseSystemPrompt.includes('【世界观百科】\n{worldBibleContext}\n')) {
    return baseSystemPrompt.replace(
      '【世界观百科】\n{worldBibleContext}\n',
      `【世界观百科】\n${worldBibleContext}\n`
    )
  }
  
  // If placeholder not found, inject after 【世界观百科】 line if it exists
  if (baseSystemPrompt.includes('【世界观百科】')) {
    return baseSystemPrompt.replace(
      '【世界观百科】',
      `【世界观百科】\n${worldBibleContext}`
    )
  }
  
  // No marker at all - prepend the context section
  return `【世界观百科】\n${worldBibleContext}\n\n${baseSystemPrompt}`
}
