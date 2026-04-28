'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectCharter } from '@/lib/types'

interface AIUnderstandingPanelProps {
  charter: Pick<ProjectCharter, 'oneLinePremise' | 'storyPromise' | 'themes' | 'aiUnderstanding'>
  onSave?: (updates: {
    oneLinePremise: string
    storyPromise: string
    themes: string[]
  }) => Promise<void> | void
}

export function AIUnderstandingPanel({ charter, onSave }: AIUnderstandingPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftPremise, setDraftPremise] = useState(charter.oneLinePremise)
  const [draftPromise, setDraftPromise] = useState(charter.storyPromise)
  const [draftThemes, setDraftThemes] = useState(charter.themes.join('、'))

  const hasContent = Boolean(
    charter.oneLinePremise.trim() ||
    charter.storyPromise.trim() ||
    charter.themes.length > 0 ||
    charter.aiUnderstanding.trim()
  )

  const summary = useMemo(() => {
    if (charter.oneLinePremise.trim()) {
      return charter.oneLinePremise.trim()
    }
    if (charter.storyPromise.trim()) {
      return charter.storyPromise.trim()
    }
    if (charter.themes.length > 0) {
      return `我先记下：${charter.themes.join('、')}`
    }
    return ''
  }, [charter.oneLinePremise, charter.storyPromise, charter.themes])

  useEffect(() => {
    setDraftPremise(charter.oneLinePremise)
    setDraftPromise(charter.storyPromise)
    setDraftThemes(charter.themes.join('、'))
  }, [charter.oneLinePremise, charter.storyPromise, charter.themes])

  if (!hasContent) {
    return null
  }

  const handleSave = async () => {
    if (!onSave) {
      setEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        oneLinePremise: draftPremise.trim(),
        storyPromise: draftPromise.trim(),
        themes: draftThemes
          .split(/[、,，\n]+/)
          .map(theme => theme.trim())
          .filter(Boolean)
          .slice(0, 4),
      })
      setEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="border-b border-border bg-[hsl(var(--surface-1))] px-3 py-2">
      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        className="flex w-full items-start gap-3 rounded-sm px-1 py-1 text-left transition-colors hover:bg-[hsl(var(--surface-2))]"
        aria-expanded={expanded}
        aria-label={expanded ? '收起当前理解' : '展开当前理解'}
      >
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Brain className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-foreground/92">我先这样理解</span>
            {charter.themes.length > 0 ? (
              <span className="text-[11px] text-muted-foreground">{charter.themes.slice(0, 2).join('、')}</span>
            ) : null}
          </div>
          {summary ? (
            <p className="mt-1 line-clamp-1 text-[12px] leading-[1.6] text-muted-foreground">
              {summary}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded ? (
        <div className="space-y-3 px-10 pb-1 pt-2">
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">改一下方向</p>
                <Textarea
                  value={draftPremise}
                  onChange={event => setDraftPremise(event.target.value)}
                  rows={3}
                  className="min-h-[88px] text-[13px] leading-[1.7]"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">改一下感觉</p>
                <Textarea
                  value={draftPromise}
                  onChange={event => setDraftPromise(event.target.value)}
                  rows={3}
                  className="min-h-[88px] text-[13px] leading-[1.7]"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">改一下关键词</p>
                <Input
                  value={draftThemes}
                  onChange={event => setDraftThemes(event.target.value)}
                  className="h-9 text-[13px]"
                  placeholder="用顿号、逗号或换行分开"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? '保存中...' : '存一下'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false)
                    setDraftPremise(charter.oneLinePremise)
                    setDraftPromise(charter.storyPromise)
                    setDraftThemes(charter.themes.join('、'))
                  }}
                >
                  算了
                </Button>
              </div>
            </div>
          ) : (
            <>
              {charter.oneLinePremise.trim() ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">我抓到的方向</p>
                  <p className="text-[13px] leading-[1.7] text-foreground">{charter.oneLinePremise.trim()}</p>
                </div>
              ) : null}

              {charter.storyPromise.trim() ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">我会优先守住的感觉</p>
                  <p className="text-[13px] leading-[1.7] text-foreground/88">{charter.storyPromise.trim()}</p>
                </div>
              ) : null}

              {charter.themes.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">我先记下的词</p>
                  <div className="flex flex-wrap gap-2">
                    {charter.themes.map(theme => (
                      <span
                        key={theme}
                        className="inline-flex items-center rounded-sm border border-border px-2 py-1 text-[12px] text-foreground/88"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {charter.aiUnderstanding.trim() ? (
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">顺手备忘</p>
              <p className="whitespace-pre-wrap text-[12px] leading-[1.7] text-muted-foreground">
                {charter.aiUnderstanding.trim()}
              </p>
            </div>
          ) : null}

          <div className="pt-1">
            <div className="flex items-center gap-3">
              {!editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-0 text-[12px] text-muted-foreground hover:text-foreground"
                  onClick={() => setEditing(true)}
                >
                  改一下
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-0 text-[12px] text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(false)}
              >
                收起
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
