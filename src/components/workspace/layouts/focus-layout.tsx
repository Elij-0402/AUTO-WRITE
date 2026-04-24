'use client'

import type { Chapter } from '@/lib/types'

interface FocusLayoutProps {
  activeChapterId: string | null
  sortedChapters: Chapter[]
  mainContent: React.ReactNode
}

export function FocusLayout({ activeChapterId, sortedChapters, mainContent }: FocusLayoutProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
      {activeChapterId && (
        <div className="px-4 py-1.5 divider-hair text-[11px] text-muted-foreground text-center uppercase tracking-[0.2em]">
          {sortedChapters.find(c => c.id === activeChapterId)?.title || ''}
        </div>
      )}
      <div className="flex-1 overflow-hidden surface-0 px-6 py-6">
        <div className="paper h-full flex flex-col">
          {mainContent}
        </div>
      </div>
    </div>
  )
}
