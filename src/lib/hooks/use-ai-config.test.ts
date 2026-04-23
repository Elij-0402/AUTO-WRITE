import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAIConfig } from './use-ai-config'
import { metaDb } from '../db/meta-db'
import path from 'node:path'
import fs from 'node:fs'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

import { useLiveQuery } from 'dexie-react-hooks'

describe('useAIConfig', () => {
  beforeEach(() => {
    vi.mocked(useLiveQuery).mockReset()
  })

  it('returns default config when no saved config exists', () => {
    vi.mocked(useLiveQuery).mockReturnValue(undefined)

    const { result } = renderHook(() => useAIConfig())

    expect(result.current.config.provider).toBe('anthropic')
    expect(result.current.config.apiKey).toBe('')
    expect(result.current.config.model).toBe('claude-sonnet-4-5')
  })

  it('useLiveQuery called with empty deps array — no projectId', () => {
    vi.mocked(useLiveQuery).mockReturnValue(undefined)
    renderHook(() => useAIConfig())
    expect(vi.mocked(useLiveQuery)).toHaveBeenCalledWith(
      expect.any(Function),
      []
    )
  })

  it('saveConfig writes to metaDb.aiConfig', async () => {
    const putSpy = vi.spyOn(metaDb.aiConfig, 'put').mockResolvedValue('config' as const)
    vi.mocked(useLiveQuery).mockReturnValue(undefined)

    const { result } = renderHook(() => useAIConfig())
    await act(async () => {
      await result.current.saveConfig({ apiKey: 'sk-new-key' })
    })

    expect(putSpy).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-new-key', id: 'config' })
    )
    putSpy.mockRestore()
  })

  it('clearConfig deletes from metaDb.aiConfig', async () => {
    const deleteSpy = vi.spyOn(metaDb.aiConfig, 'delete').mockResolvedValue(undefined)
    vi.mocked(useLiveQuery).mockReturnValue(undefined)

    const { result } = renderHook(() => useAIConfig())
    await act(async () => {
      await result.current.clearConfig()
    })

    expect(deleteSpy).toHaveBeenCalledWith('config' as const)
    deleteSpy.mockRestore()
  })

  it('hook source does not contain migration scan logic', () => {
    const hookPath = path.resolve(__dirname, 'use-ai-config.ts')
    const source = fs.readFileSync(hookPath, 'utf8')
    expect(source).not.toMatch(/MIGRATION_FLAG|migrationScanned|localStorage.*migrated/)
  })

  it('config defaults to anthropic provider when liveConfig has nullish provider', () => {
    vi.mocked(useLiveQuery).mockReturnValue({
      id: 'config',
      provider: null as unknown as 'anthropic',
      apiKey: 'sk-ant-123',
      baseUrl: 'https://api.anthropic.com',
    } as never)

    const { result } = renderHook(() => useAIConfig())
    expect(result.current.config.provider).toBe('anthropic')
  })
})
