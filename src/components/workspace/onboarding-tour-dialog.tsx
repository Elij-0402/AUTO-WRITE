'use client'

import { useState } from 'react'
import { ArrowRight, Check, Feather, SkipForward } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useWorldEntries } from '@/lib/hooks/use-world-entries'
import { useSidebarNav } from '@/lib/hooks/use-sidebar-nav'

interface OnboardingTourDialogProps {
  projectId: string
  open: boolean
  onComplete: () => void
}

type TourStep = 2 | 3 | 4
type Genre = '武侠' | '仙侠' | '都市' | '悬疑' | '科幻' | '其他'

const GENRE_TEMPLATES: Record<Genre, Array<{ name: string }>> = {
  武侠: [
    { name: '主角（江湖侠客）' },
    { name: '反派（魔教高手）' },
    { name: '师父（武林前辈）' },
  ],
  仙侠: [
    { name: '主角（修士）' },
    { name: '反派（魔道修士）' },
    { name: '师父（老仙人）' },
  ],
  都市: [
    { name: '主角（普通人）' },
    { name: '反派（商业对手）' },
  ],
  悬疑: [
    { name: '主角（侦探/记者）' },
    { name: '反派（真凶）' },
  ],
  科幻: [
    { name: '主角（船长/研究员）' },
    { name: '反派（外星势力）' },
  ],
  其他: [],
}

const GENRES: Genre[] = ['武侠', '仙侠', '都市', '悬疑', '科幻', '其他']

/**
 * T11 onboarding tour — steps 2 through 4. Step 1 (API key) is handled
 * separately by AIConfigDialog in isOnboarding mode; after that saves,
 * the parent opens this tour. All steps are skippable; the user always
 * lands in the editor regardless of how many steps they complete.
 *
 * Step 2: create 3 character WorldEntry templates (主角 / 反派 / 师父)
 * Step 3: tell the user to ask the AI about the characters (and what
 *         a good first prompt looks like)
 * Step 4: explain the citation chip — the AI's receipt that it read
 *         your world bible
 *
 * Emotional arc (DSN-3A): these four titles map to Don Norman's
 * three-level design (visceral → behavioral → reflective) and the
 * product's Sharpen-the-Spine promise.
 */
export function OnboardingTourDialog({ projectId, open, onComplete }: OnboardingTourDialogProps) {
  const [step, setStep] = useState<TourStep>(2)
  const [createdTemplates, setCreatedTemplates] = useState<Set<string>>(new Set())
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const { addEntry } = useWorldEntries(projectId)
  const nav = useSidebarNav()

  const handleCreateTemplate = async (name: string) => {
    if (createdTemplates.has(name)) return
    await addEntry('character', name)
    setCreatedTemplates(prev => new Set(prev).add(name))
  }

  const handleSkip = () => {
    onComplete()
    setStep(2)
    setCreatedTemplates(new Set())
  }

  const handleNext = () => {
    if (step === 4) {
      onComplete()
      setStep(2)
      setCreatedTemplates(new Set())
    } else {
      setStep((step + 1) as TourStep)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) handleSkip() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-center gap-3">
          <DialogTitle className="font-display text-xl tracking-wide flex-1">
            {stepTitle(step)}
          </DialogTitle>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums italic">
            · {step} / 4 ·
          </span>
        </DialogHeader>

        {step === 2 && (
          <div className="space-y-4">
            {!selectedGenre ? (
              <>
                <p className="text-[13px] text-muted-foreground">
                  选择您的创作题材，我们帮您建立初始角色
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {GENRES.map(genre => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className="rounded-lg border border-[hsl(var(--line))] py-3 text-[13px] font-medium hover:border-[hsl(var(--accent))]/60 hover:bg-[hsl(var(--accent))]/5 transition-colors"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                  选「其他」或直接下一步可跳过角色模板
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] text-muted-foreground">
                  点击添加 <span className="text-foreground/80">{selectedGenre}</span> 初始角色
                  <button
                    onClick={() => { setSelectedGenre(null); setCreatedTemplates(new Set()) }}
                    className="ml-2 text-[11px] text-muted-foreground/60 underline"
                  >
                    重新选择
                  </button>
                </p>
                <div className="space-y-2">
                  {GENRE_TEMPLATES[selectedGenre].map(template => {
                    const created = createdTemplates.has(template.name)
                    return (
                      <button
                        key={template.name}
                        onClick={async () => {
                          if (created) return
                          await handleCreateTemplate(template.name)
                        }}
                        disabled={created}
                        className={
                          'w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-[13px] transition-colors ' +
                          (created
                            ? 'border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/5 text-[hsl(var(--accent))]/70'
                            : 'border-[hsl(var(--line))] hover:border-[hsl(var(--accent))]/50')
                        }
                      >
                        <span>{template.name}</span>
                        {created && <Check className="h-3.5 w-3.5" />}
                      </button>
                    )
                  })}
                  {GENRE_TEMPLATES[selectedGenre].length === 0 && (
                    <p className="text-[13px] text-muted-foreground/60 py-2">
                      无预设模板，可直接进入下一步
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                  创建后可在左侧世界观 tab 补充细节
                </p>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-[13px] leading-[1.8] text-muted-foreground">
              世界观里有了角色，AI 就能「读到」他们。右侧 AI 聊天里试一句：
            </p>
            <div className="rounded-md surface-2 border border-[hsl(var(--line))] px-3 py-2.5 text-[13px] leading-[1.8]">
              介绍一下这 3 个角色，他们各有什么性格特点？
            </div>
            <p className="text-[11px] text-muted-foreground/80">
              AI 回复里会带上引用（朱砂色小圆角），点一下就能跳回条目。
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border border-[hsl(var(--accent))]/45 text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">
                <span className="tabular-nums text-muted-foreground">[1]</span>
                <span>主角</span>
              </div>
              <Feather className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
            </div>
            <p className="text-[13px] leading-[1.8] text-muted-foreground">
              这颗朱砂点，就是世界观在说话 —— 每条 AI 引用都回指到一个具体条目。
              点开看上下文，点「跳到条目」回到原文。
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              做到这一步，InkForge 的核心承诺你已经摸到了：
              <span className="text-[hsl(var(--accent))]/90"> 深夜写 1 万字时，人物不跑偏。</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <SkipForward className="h-3 w-3" />
            跳过引导
          </Button>
          <div className="flex items-center gap-2">
            {step > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((step - 1) as TourStep)}
              >
                上一步
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                if (step === 3) {
                  nav.setActiveTab('world')
                }
                handleNext()
              }}
            >
              {step === 4 ? '开始写作' : '下一步'}
              {step < 4 && <ArrowRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function stepTitle(step: TourStep): string {
  switch (step) {
    case 2:
      return '搭起三个主要角色'
    case 3:
      return '问 AI 它看到了什么'
    case 4:
      return '这颗朱砂点，就是世界观在说话'
  }
}
