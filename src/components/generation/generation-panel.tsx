'use client'

import { useState, useEffect, useRef } from 'react'
import { useChapterGeneration } from '@/lib/hooks/use-chapter-generation'

interface GenerationPanelProps {
  projectId: string
  chapterId: string
  /** Callback when panel is closed/hidden */
  onClose?: () => void
}

/**
 * Generation panel per D-02, D-03.
 * 
 * Displays states:
 * - Idle: Empty, generation button triggers
 * - Generating: Header shows progress indicator, content streams in
 * - Complete: Full content displayed, "采纳到编辑器" enabled
 * - Error: Error message with retry button
 * 
 * Per D-02: Streaming output with typewriter effect (fade-in for new characters)
 */
export function GenerationPanel({ projectId, chapterId, onClose }: GenerationPanelProps) {
  const {
    status,
    streamingContent,
    error,
    startGeneration,
    cancelGeneration,
    acceptContent,
    resetGeneration,
  } = useChapterGeneration(projectId, chapterId)
  
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [streamingContent])
  
  // Handle accept - close panel after success
  const handleAccept = async () => {
    const result = await acceptContent()
    if (result.success && onClose) {
      onClose()
    }
  }
  
  // Handle retry - reset and start again
  const handleRetry = () => {
    resetGeneration()
    startGeneration()
  }
  
  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 overflow-hidden">
      {/* Header per D-02 */}
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50">
        <div className="flex items-center gap-2">
          {status === 'generating' && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">章节生成中...</span>
            </div>
          )}
          {status === 'complete' && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ 生成完成
            </span>
          )}
          {status === 'idle' && (
            <span className="text-sm text-stone-500 dark:text-stone-400">
              章节生成
            </span>
          )}
          {status === 'error' && (
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
              生成失败
            </span>
          )}
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <button
              onClick={startGeneration}
              className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              开始生成
            </button>
          )}
          {status === 'generating' && (
            <button
              onClick={cancelGeneration}
              className="px-3 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              取消
            </button>
          )}
          {(status === 'complete' || status === 'error') && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
      
      {/* Content area */}
      <div
        ref={contentRef}
        className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto"
      >
        {/* Idle state */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-[200px] text-stone-400 dark:text-stone-500">
            <svg className="h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm">点击"开始生成"基于大纲创作章节</p>
          </div>
        )}
        
        {/* Generating state - typewriter effect per D-02 */}
        {status === 'generating' && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-stone-800 dark:text-stone-200 leading-relaxed">
              {streamingContent}
              <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
            </p>
          </div>
        )}
        
        {/* Complete state */}
        {status === 'complete' && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-stone-800 dark:text-stone-200 leading-relaxed">
              {streamingContent}
            </p>
          </div>
        )}
        
        {/* Error state */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-[200px] text-red-500 dark:text-red-400">
            <svg className="h-12 w-12 mb-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm mb-2">{error}</p>
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 text-sm rounded-lg bg-danger text-danger-foreground hover:bg-danger/90 transition-colors"
            >
              重试
            </button>
          </div>
        )}
      </div>
      
      {/* Footer with action buttons per D-03 */}
      {status === 'complete' && (
        <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-end gap-2 bg-stone-50 dark:bg-stone-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
          >
            采纳到编辑器
          </button>
        </div>
      )}
    </div>
  )
}
