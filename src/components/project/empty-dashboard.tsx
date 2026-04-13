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
    <div className="flex flex-col items-center justify-center py-24 px-4">
      {/* Illustration placeholder — open book SVG */}
      <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <BookOpen className="h-16 w-16 text-zinc-400 dark:text-zinc-500" />
      </div>

      <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        创建你的第一本小说
      </h2>

      <p className="mb-8 text-zinc-500 dark:text-zinc-400">
        开始你的写作之旅
      </p>

      <Button size="lg" onClick={onCreateProject}>
        新建项目
      </Button>
    </div>
  )
}
