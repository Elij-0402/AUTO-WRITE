'use client'

import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
  greeting: string
}

export function EmptyDashboard({ onCreateProject, greeting }: EmptyDashboardProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-24 px-6 animate-fade-up bg-amber-vignette bg-spotlight">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] bg-[hsl(var(--accent-amber))]">
          <PenLine className="h-3.5 w-3.5 text-[hsl(var(--primary-foreground))]" strokeWidth={2.5} />
        </div>
        <span className="font-display text-[17px] tracking-[0.1em]">InkForge</span>
      </div>

      <p className="mb-12 text-[12px] tracking-wider uppercase text-muted-foreground/80">
        {greeting}
      </p>

      <h2 className="mb-3 font-display text-[56px] leading-[1.1] tracking-[0.04em] text-foreground text-center">
        落笔之前，先有世界
      </h2>

      <p className="mb-10 text-[14px] text-muted-foreground max-w-md text-center leading-relaxed">
        从一个标题开始，构建你的故事宇宙
      </p>

      <span aria-hidden className="mb-10 h-px w-20 bg-gradient-to-r from-transparent via-[hsl(var(--accent-amber))]/70 to-transparent" />

      <Button
        size="lg"
        onClick={onCreateProject}
        className="font-display tracking-[0.08em]"
      >
        开始第一个故事
      </Button>
    </div>
  )
}
