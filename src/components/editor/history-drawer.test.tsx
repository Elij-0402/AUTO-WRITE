import { render, screen } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { HistoryDrawer } from './history-drawer'
import type { Revision } from '@/lib/hooks/use-revisions'

const mockRevisions: Revision[] = [
  { id: 'r1', chapterId: 'c1', label: '', createdAt: new Date(), source: 'manual', wordCount: 100, snapshot: {}, projectId: 'p1' },
  { id: 'r2', chapterId: 'c1', label: 'My draft', createdAt: new Date(Date.now() - 1000), source: 'ai-draft', wordCount: 80, snapshot: {}, projectId: 'p1' },
  { id: 'r3', chapterId: 'c1', label: '', createdAt: new Date(Date.now() - 2000), source: 'autosnapshot', wordCount: 90, snapshot: {}, projectId: 'p1' },
]

vi.mock('@/lib/hooks/use-revisions', () => ({
  useRevisions: () => ({
    revisions: mockRevisions,
    snapshot: vi.fn(),
    remove: vi.fn(),
    rename: vi.fn(),
  }),
}))

it('does not show snapshot type badges', () => {
  render(
    <HistoryDrawer
      projectId="p1"
      chapterId="c1"
      currentContent={{}}
      open={true}
      onOpenChange={() => {}}
      onRestore={() => {}}
    />
  )
  expect(screen.queryByText('手动')).not.toBeInTheDocument()
  expect(screen.queryByText('AI')).not.toBeInTheDocument()
  expect(screen.queryByText('自动')).not.toBeInTheDocument()
})
