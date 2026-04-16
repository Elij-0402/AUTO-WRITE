import { describe, it, expect } from 'vitest'
import {
  ALL_TOOL_SCHEMAS,
  SUGGEST_ENTRY_SCHEMA,
  SUGGEST_RELATION_SCHEMA,
  REPORT_CONTRADICTION_SCHEMA,
} from './schemas'

describe('tool schemas', () => {
  it('exports three tools with unique names', () => {
    const names = ALL_TOOL_SCHEMAS.map(s => s.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual(expect.arrayContaining([
      'suggest_entry',
      'suggest_relation',
      'report_contradiction',
    ]))
  })

  it('suggest_entry requires entryType and name', () => {
    expect(SUGGEST_ENTRY_SCHEMA.input_schema.required).toEqual(['entryType', 'name'])
    expect(SUGGEST_ENTRY_SCHEMA.input_schema.properties.entryType.enum).toEqual(
      ['character', 'location', 'rule', 'timeline']
    )
  })

  it('suggest_relation requires both names, type and bidirectional description', () => {
    expect(SUGGEST_RELATION_SCHEMA.input_schema.required).toEqual([
      'entry1Name',
      'entry2Name',
      'relationshipType',
      'bidirectionalDescription',
    ])
  })

  it('report_contradiction requires entryName, entryType, description', () => {
    expect(REPORT_CONTRADICTION_SCHEMA.input_schema.required).toEqual([
      'entryName',
      'entryType',
      'description',
    ])
    expect(REPORT_CONTRADICTION_SCHEMA.input_schema.properties.severity.enum).toEqual([
      'high',
      'medium',
      'low',
    ])
  })

  it('every tool has a non-empty description', () => {
    for (const schema of ALL_TOOL_SCHEMAS) {
      expect(schema.description.length).toBeGreaterThan(10)
    }
  })
})
