'use client'

import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
  greeting: string
}

/**
 * Empty dashboard state — literary, contemplative.
 * No icon-in-circle pattern. The emptiness is the design.
 */
export function EmptyDashboard({ onCreateProject, greeting }: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 animate-fade-up">
      <p className="mb-6 text-sm text-[var(--text-tertiary)] tracking-wide">
        {greeting}
      </p>

      <h2 className="mb-3 text-2xl font-display text-[var(--foreground)] tracking-wide">
        落笔之前，先有世界
      </h2>

      <p className="mb-10 text-sm text-[var(--text-secondary)] max-w-xs text-center leading-relaxed">
        从一个标题开始，构建你的故事宇宙
      </p>

      <Button size="lg" onClick={onCreateProject}>
        开始第一个故事
      </Button>
    </div>
  )
}
