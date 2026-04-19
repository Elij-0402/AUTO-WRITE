import type { ReactNode } from 'react'

interface ChapterMetaStripProps {
  chapterNumber: number
  wordCount: number
  status: 'draft' | 'completed'
  extras?: ReactNode
}

export function ChapterMetaStrip({
  chapterNumber,
  wordCount,
  status,
  extras,
}: ChapterMetaStripProps) {
  return (
    <div className="flex items-center gap-2 px-6 pt-5 pb-2">
      <span className="chip chip-amber tracking-wider uppercase">
        第 {chapterNumber} 章
      </span>
      <span className="chip tabular-nums">
        {wordCount.toLocaleString()} 字
      </span>
      {status === 'completed' ? (
        <span className="chip chip-jade">已完成</span>
      ) : (
        <span className="chip">草稿</span>
      )}
      {extras ? <div className="ml-auto flex items-center gap-2">{extras}</div> : null}
    </div>
  )
}
