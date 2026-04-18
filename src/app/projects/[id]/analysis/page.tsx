'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { ArrowLeft, Network, Clock, Feather } from 'lucide-react'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useAllRelations } from '@/lib/hooks/use-all-relations'
import { useAIConfig } from '@/lib/hooks/use-ai-config'
import { RelationGraph } from '@/components/analysis/relation-graph'
import { TimelineView } from '@/components/analysis/timeline-view'
import { StyleProfile } from '@/components/analysis/style-profile'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/components/editor/theme-provider'

type Tab = 'relations' | 'timeline' | 'style'

const ALL_TABS: Array<{ id: Tab; label: string; icon: typeof Network }> = [
  { id: 'relations', label: '关系图', icon: Network },
  { id: 'timeline', label: '时间线', icon: Clock },
  { id: 'style', label: '文风', icon: Feather },
]

export default function AnalysisPage() {
  const params = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('relations')
  const { entries } = useWorldEntries(params.id)
  const relations = useAllRelations(params.id)
  const { uiFlags } = useAIConfig(params.id)

  const tabs = useMemo(() => {
    return ALL_TABS.filter(t => {
      if (t.id === 'relations') return true
      if (t.id === 'timeline') return uiFlags.showTimelineView
      if (t.id === 'style') return uiFlags.showStyleProfile
      return false
    })
  }, [uiFlags.showTimelineView, uiFlags.showStyleProfile])

  const activeTab: Tab = tabs.some(t => t.id === tab) ? tab : 'relations'

  return (
    <ThemeProvider>
      <div className="h-screen flex flex-col">
        <div className="h-12 shrink-0 border-b bg-background flex items-center gap-2 px-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link href={`/projects/${params.id}`} aria-label="返回编辑器">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm font-medium">创作者分析</span>
        </div>

        <div className="border-b bg-background">
          <div className="mx-auto max-w-5xl px-4 flex gap-1">
            {tabs.map(t => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6">
            {activeTab === 'relations' && (
              <RelationGraph entries={entries ?? []} relations={relations} />
            )}
            {activeTab === 'timeline' && uiFlags.showTimelineView && <TimelineView entries={entries ?? []} />}
            {activeTab === 'style' && uiFlags.showStyleProfile && <StyleProfile projectId={params.id} />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
