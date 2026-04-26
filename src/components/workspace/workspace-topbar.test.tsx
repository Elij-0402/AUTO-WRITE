import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceTopbar } from './workspace-topbar'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/lib/hooks/use-word-count', () => ({
  useTotalWordCount: () => 0,
  useTodayWordCount: () => 0,
}))

vi.mock('@/lib/hooks/use-project-meta', () => ({
  useProjectMeta: () => ({
    project: {
      title: '测试项目',
    },
  }),
}))

vi.mock('@/components/editor/theme-provider', () => ({
  useTheme: () => ({
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/sync/SyncStatusIcon', () => ({
  SyncStatusIcon: () => <div aria-hidden="true" />,
}))

describe('WorkspaceTopbar', () => {
  it('exposes a charter link in the workspace chrome', () => {
    render(
      <WorkspaceTopbar
        projectId="p-1"
        focusMode={false}
        onToggleFocusMode={() => {}}
        onOpenAIConfig={() => {}}
        onOpenDraftDialog={() => {}}
      />
    )

    expect(screen.getByRole('link', { name: '作品宪章' })).toHaveAttribute(
      'href',
      '/projects/p-1/charter'
    )
  })
})
