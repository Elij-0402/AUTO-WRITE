'use client'

import type { GenerationState } from '@/components/workspace/generation-drawer'

interface GenerationButtonProps {
  onOpenDrawer: () => void
  generation: GenerationState & {
    startGeneration: () => Promise<void>
  }
}

export function GenerationButton({ onOpenDrawer, generation }: GenerationButtonProps) {
  const handleGenerate = async () => {
    onOpenDrawer()
    await generation.startGeneration()
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={generation.status === 'generating'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title="AI 生成章节内容"
    >
      {generation.status === 'generating' ? (
        <>
          <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          生成中...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI 生成
        </>
      )}
    </button>
  )
}
