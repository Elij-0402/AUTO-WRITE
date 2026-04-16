'use client'

import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
  greeting: string
}

export function EmptyDashboard({ onCreateProject, greeting }: EmptyDashboardProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-24 px-6 animate-fade-up bg-amber-vignette">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary">
          <PenLine className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="font-display text-base tracking-[0.08em]">InkForge</span>
      </div>

      <p className="mb-10 text-[13px] italic tracking-wide text-muted-foreground">
        {greeting}
      </p>

      <h2 className="mb-2 font-display text-5xl leading-tight tracking-wide text-foreground text-center">
        落笔之前，先有世界
      </h2>

      <p className="mb-8 text-sm text-muted-foreground max-w-sm text-center leading-relaxed">
        从一个标题开始，构建你的故事宇宙
      </p>

      <span aria-hidden className="mb-8 h-px w-16 bg-primary/40" />

      <Button
        size="lg"
        variant="outline"
        onClick={onCreateProject}
        className="font-display tracking-wide border-primary/30 text-foreground hover:border-primary/70 hover:bg-primary/5 hover:text-primary"
      >
        开始第一个故事
      </Button>
    </div>
  )
}
