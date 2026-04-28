'use client'

import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
  greeting: string
}

export function EmptyDashboard({ onCreateProject, greeting }: EmptyDashboardProps) {
  return (
    <div className="relative flex max-w-[760px] flex-col items-center justify-center px-6 py-24 text-center animate-fade-up">
      <div className="mb-10 flex items-center gap-3 text-[13px] text-[hsl(var(--muted-foreground))]">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-[hsl(var(--accent))]/40 bg-[hsl(var(--surface-2))]">
          <PenLine className="h-4 w-4 text-primary" strokeWidth={1.9} />
        </div>
        <span className="font-display text-[20px] leading-none text-foreground">InkForge</span>
      </div>

      <p className="mb-6 text-[13px] text-muted-foreground">
        {greeting}
      </p>

      <h2 className="font-display mb-5 text-[42px] leading-[1.2] text-foreground sm:text-[52px]">
        落笔之前，先有世界
      </h2>

      <p className="font-body mb-12 max-w-[30rem] text-[17px] leading-[1.9] text-muted-foreground">
        从一个标题开始，安静地搭起人物、因果与命运将要经过的地方。
      </p>

      <Button size="lg" onClick={onCreateProject} className="min-w-40">
        开始第一个故事
      </Button>
    </div>
  )
}
