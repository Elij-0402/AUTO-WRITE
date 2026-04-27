import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RelationshipSection } from './relationship-section'
import type { WorldEntry, Relation } from '@/lib/types'

const mockUseRelations = vi.fn()

vi.mock('@/lib/hooks/use-relations', () => ({
  useRelations: (...args: unknown[]) => mockUseRelations(...args),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
  }) => (
    <select value={value} onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <option value="">{placeholder ?? ''}</option>,
}))

function makeEntry(overrides: Partial<WorldEntry>): WorldEntry {
  const now = new Date('2026-04-27T00:00:00.000Z')
  return {
    id: overrides.id ?? 'entry-1',
    projectId: overrides.projectId ?? 'project-1',
    type: overrides.type ?? 'character',
    name: overrides.name ?? '默认条目',
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
    ...overrides,
  }
}

describe('RelationshipSection', () => {
  const addRelation = vi.fn()

  beforeEach(() => {
    addRelation.mockReset()
    mockUseRelations.mockReturnValue({
      relations: [] as Relation[],
      loading: false,
      addRelation,
      deleteRelation: vi.fn(),
    })
  })

  it('uses the current entry as the relation source when adding from the form', async () => {
    const sourceEntry = makeEntry({ id: 'source-1', name: '沈夜', type: 'character' })
    const targetEntry = makeEntry({ id: 'target-1', name: '朱雀司', type: 'character' })
    const user = userEvent.setup()

    render(
      <RelationshipSection
        projectId="project-1"
        sourceEntry={sourceEntry}
        allEntries={[sourceEntry, targetEntry]}
        onSelectEntry={vi.fn()}
      />
    )

    const selects = screen.getAllByRole('combobox')
    await user.selectOptions(selects[0], 'target-1')
    await user.type(screen.getByPlaceholderText('例如：师徒、朋友、居住'), '师徒')
    await user.type(screen.getByPlaceholderText('例如：是师父、居住于'), '是师父')
    await user.click(screen.getByRole('button', { name: '添加' }))

    await waitFor(() => {
      expect(addRelation).toHaveBeenCalledWith(
        'source-1',
        'target-1',
        'character_relation',
        '师徒',
        '是师父'
      )
    })
  })
})
