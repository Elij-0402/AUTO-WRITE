'use client'

interface AIChatPanelProps {
  projectId: string
}

export function AIChatPanel({ projectId }: AIChatPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
        <div className="text-center">
          <p className="text-lg mb-1">AI 聊天</p>
          <p className="text-sm text-zinc-300 dark:text-zinc-600">配置 AI 设置后开始对话</p>
        </div>
      </div>
    </div>
  )
}
