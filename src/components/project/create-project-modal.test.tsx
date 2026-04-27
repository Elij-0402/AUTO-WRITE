import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CreateProjectModal } from './create-project-modal'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: { children: ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children, id }: { children: ReactNode; id?: string }) => <button id={id} type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}))

describe('CreateProjectModal', () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('routes new projects to the charter page after a successful create', async () => {
    const onSubmit = vi.fn().mockResolvedValue('p-42')
    const onOpenChange = vi.fn()

    render(
      <CreateProjectModal
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    )

    fireEvent.change(screen.getByLabelText('标题 *'), {
      target: { value: '新项目' },
    })
    fireEvent.click(screen.getByRole('button', { name: '创建' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: '新项目',
        genre: '',
        synopsis: '',
      })
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(pushMock).toHaveBeenCalledWith('/projects/p-42/charter')
    })
  })
})
