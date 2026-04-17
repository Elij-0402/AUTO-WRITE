'use client'

import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
  greeting: string
}

export function EmptyDashboard({ onCreateProject, greeting }: EmptyDashboardProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-24 px-6 animate-fade-up">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-primary">
          <PenLine className="h-4 w-4 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <span className="text-[16px] font-semibold">InkForge</span>
      </div>

      <p className="mb-10 text-[13px] text-muted-foreground">
        {greeting}
      </p>

      <h2 className="mb-4 text-[32px] font-semibold leading-tight tracking-tight text-foreground text-center">
        落笔之前，先有世界
      </h2>

      <p className="mb-10 text-[15px] text-muted-foreground max-w-md text-center leading-relaxed">
        从一个标题开始，构建你的故事宇宙
      </p>

      <Button size="lg" onClick={onCreateProject}>
        开始第一个故事
      </Button>
    </div>
  )
}
