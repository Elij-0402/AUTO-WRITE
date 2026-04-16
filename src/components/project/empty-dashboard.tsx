'use client'

import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDashboardProps {
  onCreateProject: () => void
  greeting: string
}

export function EmptyDashboard({ onCreateProject, greeting }: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 animate-fade-up">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <PenLine className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight">InkForge</span>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {greeting}
      </p>

      <h2 className="mb-3 text-2xl font-display tracking-wide">
        落笔之前，先有世界
      </h2>

      <p className="mb-10 text-sm text-muted-foreground max-w-xs text-center leading-relaxed">
        从一个标题开始，构建你的故事宇宙
      </p>

      <Button size="lg" onClick={onCreateProject}>
        开始第一个故事
      </Button>
    </div>
  )
}
