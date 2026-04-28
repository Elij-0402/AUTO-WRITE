import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceTopbar } from './workspace-topbar'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>{children}</a>
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
  TooltipContent: () => null,
}))

vi.mock('@/components/sync/SyncStatusIcon', () => ({
  SyncStatusIcon: () => <div aria-hidden="true" />,
}))

describe('WorkspaceTopbar', () => {
  it('keeps core workspace actions and removes analysis/focus controls', () => {
    render(
      <WorkspaceTopbar
        projectId="p-1"
        onOpenAIConfig={() => {}}
      />
    )

    expect(screen.getByRole('link', { name: '返回项目列表' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'AI 设置' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '生成章节草稿' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '创作者分析' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '专注写作' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '退出专注写作' })).not.toBeInTheDocument()
  })
})
