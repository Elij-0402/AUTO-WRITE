'use client'

import { useState } from 'react'
import { ArrowRight, Check, User, Feather, SkipForward } from 'lucide-react'
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

const CHARACTER_TEMPLATES: Array<{ name: string; hint: string }> = [
  { name: '主角', hint: '故事的推动者。先想清楚他/她要什么。' },
  { name: '反派', hint: '制造阻力。不一定坏，但一定挡路。' },
  { name: '师父', hint: '或朋友、导师、情人。给主角第二视角。' },
]

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
            <p className="text-[13px] leading-[1.8] text-muted-foreground">
              三个主要角色就够让 AI 开始"认识你的故事"了。点击模板快速建立，或
              跳过后自己写。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CHARACTER_TEMPLATES.map(t => {
                const created = createdTemplates.has(t.name)
                return (
                  <button
                    key={t.name}
                    onClick={() => handleCreateTemplate(t.name)}
                    disabled={created}
                    className={
                      'text-left rounded-md border px-3 py-2.5 transition-colors ' +
                      (created
                        ? 'border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/10 cursor-default'
                        : 'border-[hsl(var(--line))] hover:border-[hsl(var(--accent))]/60 cursor-pointer')
                    }
                  >
                    <div className="flex items-center gap-1.5 text-[13px] font-medium">
                      {created ? (
                        <Check className="h-3 w-3 text-[hsl(var(--accent))]" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span>{t.name}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-[1.6]">
                      {t.hint}
                    </p>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground/70">
              创建后可在左侧世界观 tab 补充细节。
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-[13px] leading-[1.8] text-muted-foreground">
              世界观里有了角色，AI 就能"读到"他们。右侧 AI 聊天里试一句：
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
              点开看上下文，点"跳到条目"回到原文。
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
