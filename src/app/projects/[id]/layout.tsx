'use client'

import { useParams, useRouter } from 'next/navigation'
import { useProjects } from '@/lib/hooks/use-projects'
import { Button } from '@/components/ui/button'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { projects, loading } = useProjects()

  const project = projects.find((p) => p.id === params.id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="font-display text-3xl tracking-wide text-foreground mb-2">
          项目未找到
        </div>
        <p className="text-muted-foreground mb-6">该作品不存在或已被删除</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          返回作品列表
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background bg-grain">
      <div className="flex flex-col flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
