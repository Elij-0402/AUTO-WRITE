'use client'

import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DirectionConfirmationCardProps {
  oneLinePremise: string
  storyPromise: string
  themes: string[]
  onAccept: () => void
  onContinueTalking: () => void
}

export function DirectionConfirmationCard({
  oneLinePremise,
  storyPromise,
  themes,
  onAccept,
  onContinueTalking,
}: DirectionConfirmationCardProps) {
  return (
    <div className="mx-3 mb-3 rounded-md border border-border bg-[hsl(var(--surface-1))] px-4 py-3 animate-fade-up">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="space-y-1">
            <p className="text-[12px] text-muted-foreground">我先帮你抓一下方向</p>
            <p className="text-[14px] leading-[1.8] text-foreground">{oneLinePremise}</p>
            <p className="text-[13px] leading-[1.7] text-muted-foreground">{storyPromise}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {themes.map(theme => (
              <span
                key={theme}
                className="inline-flex items-center rounded-sm border border-border px-2 py-1 text-[12px] text-foreground/88"
              >
                {theme}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={onAccept}>
              就按这个走
            </Button>
            <Button variant="ghost" size="sm" onClick={onContinueTalking}>
              我再补一句
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
