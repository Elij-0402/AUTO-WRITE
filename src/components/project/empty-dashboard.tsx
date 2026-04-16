'use client'

import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
  greeting: string
}

export function EmptyDashboard({ onCreateProject, greeting }: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 animate-fade-up">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-foreground">
          <PenLine className="h-3.5 w-3.5 text-background" strokeWidth={2.5} />
        </div>
        <span className="font-display text-base tracking-[0.08em]">InkForge</span>
      </div>

      <p className="mb-10 text-[13px] italic tracking-wide text-muted-foreground">
        {greeting}
      </p>

      <h2 className="mb-2 font-display text-4xl leading-tight tracking-wide text-foreground text-center">
        落笔之前，先有世界
      </h2>

      <p className="mb-8 text-sm text-muted-foreground max-w-sm text-center leading-relaxed">
        从一个标题开始，构建你的故事宇宙
      </p>

      <span aria-hidden className="mb-8 h-px w-16 bg-foreground/25" />

      <Button
        size="lg"
        variant="outline"
        onClick={onCreateProject}
        className="font-display tracking-wide border-foreground/20 hover:border-foreground/60 hover:bg-transparent"
      >
        开始第一个故事
      </Button>
    </div>
  )
}
