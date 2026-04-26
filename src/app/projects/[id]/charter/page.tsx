'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ThemeProvider } from '@/components/editor/theme-provider'
import { ProjectCharterForm } from '@/components/project-charter/project-charter-form'
import { Button } from '@/components/ui/button'
import { useProjectCharter } from '@/lib/hooks/use-project-charter'

export default function ProjectCharterPage() {
  const params = useParams<{ id: string }>()
  const { charter, loading, save } = useProjectCharter(params.id)

  const handleSave = async (updates: Parameters<typeof save>[0]): Promise<void> => {
    await save(updates)
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="border-b border-border">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href={`/projects/${params.id}`} aria-label="返回项目">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-1">
              <h1 className="font-medium">作品宪章</h1>
              <p className="text-sm text-muted-foreground">
                固定这部作品的承诺、边界与写法。
              </p>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-4xl px-6 py-8">
          {loading || !charter ? (
            <div className="text-sm text-muted-foreground">加载作品宪章中...</div>
          ) : (
            <ProjectCharterForm
              initialValue={{
                oneLinePremise: charter.oneLinePremise,
                storyPromise: charter.storyPromise,
                themes: charter.themes,
                tone: charter.tone,
                targetReader: charter.targetReader,
                styleDos: charter.styleDos,
                tabooList: charter.tabooList,
                positiveReferences: charter.positiveReferences,
                negativeReferences: charter.negativeReferences,
                aiUnderstanding: charter.aiUnderstanding,
              }}
              onSave={handleSave}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}
