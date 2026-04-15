'use client'

import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

interface EmptyDashboardProps {
  onCreateProject: () => void
}

/**
 * Empty dashboard state per D-08.
 * Shows friendly illustration and "创建你的第一本小说" CTA.
 */
export function EmptyDashboard({ onCreateProject }: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-up">
      <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-surface-2">
        <BookOpen className="h-16 w-16 text-text-tertiary" />
      </div>

      <h2 className="mb-2 text-2xl font-semibold text-foreground">
        创建你的第一本小说
      </h2>

      <p className="mb-8 text-text-secondary">
        开始你的写作之旅
      </p>

      <Button size="lg" onClick={onCreateProject}>
        新建项目
      </Button>
    </div>
  )
}
