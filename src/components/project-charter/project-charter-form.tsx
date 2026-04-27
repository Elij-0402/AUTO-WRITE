'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectCharter, ProjectCharterUpdate } from '@/lib/types'

type CharterFormValue = Pick<
  ProjectCharter,
  | 'oneLinePremise'
  | 'storyPromise'
  | 'themes'
  | 'tone'
  | 'targetReader'
  | 'styleDos'
  | 'tabooList'
  | 'positiveReferences'
  | 'negativeReferences'
  | 'aiUnderstanding'
>

interface ProjectCharterFormProps {
  initialValue: CharterFormValue
  onSave: (data: ProjectCharterUpdate) => Promise<void>
}

interface CharterFormFields {
  oneLinePremise: string
  storyPromise: string
  themes: string
  tone: string
  targetReader: string
  styleDos: string
  tabooList: string
  positiveReferences: string
  negativeReferences: string
}

function stringifyList(items: string[]): string {
  return items.join('\n')
}

function normalizeList(value: string): string[] {
  return value
    .split(/[\n,，]+/)
    .map(item => item.trim())
    .filter(Boolean)
}

function toFormValues(initialValue: CharterFormValue): CharterFormFields {
  return {
    oneLinePremise: initialValue.oneLinePremise,
    storyPromise: initialValue.storyPromise,
    themes: stringifyList(initialValue.themes),
    tone: initialValue.tone,
    targetReader: initialValue.targetReader,
    styleDos: stringifyList(initialValue.styleDos),
    tabooList: stringifyList(initialValue.tabooList),
    positiveReferences: stringifyList(initialValue.positiveReferences),
    negativeReferences: stringifyList(initialValue.negativeReferences),
  }
}

function buildPersistedKey(initialValue: CharterFormValue): string {
  return JSON.stringify({
    oneLinePremise: initialValue.oneLinePremise,
    storyPromise: initialValue.storyPromise,
    themes: initialValue.themes,
    tone: initialValue.tone,
    targetReader: initialValue.targetReader,
    styleDos: initialValue.styleDos,
    tabooList: initialValue.tabooList,
    positiveReferences: initialValue.positiveReferences,
    negativeReferences: initialValue.negativeReferences,
  })
}

export function ProjectCharterForm({
  initialValue,
  onSave,
}: ProjectCharterFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const formValues = useMemo(() => toFormValues(initialValue), [initialValue])
  const persistedKey = useMemo(() => buildPersistedKey(initialValue), [initialValue])
  const lastResetKeyRef = useRef(persistedKey)
  const { register, handleSubmit, reset } = useForm<CharterFormFields>({
    defaultValues: formValues,
  })

  useEffect(() => {
    if (persistedKey === lastResetKeyRef.current) {
      return
    }

    lastResetKeyRef.current = persistedKey
    reset(formValues)
  }, [formValues, persistedKey, reset])

  const submit = async (data: CharterFormFields) => {
    setIsSaving(true)
    try {
      await onSave({
        oneLinePremise: data.oneLinePremise.trim(),
        storyPromise: data.storyPromise.trim(),
        themes: normalizeList(data.themes),
        tone: data.tone.trim(),
        targetReader: data.targetReader.trim(),
        styleDos: normalizeList(data.styleDos),
        tabooList: normalizeList(data.tabooList),
        positiveReferences: normalizeList(data.positiveReferences),
        negativeReferences: normalizeList(data.negativeReferences),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const aiUnderstandingSummary = initialValue.aiUnderstanding.trim()
    ? initialValue.aiUnderstanding.trim().split('\n')[0]
    : '保存后，AI 会根据你的宪章生成理解摘要。'

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">先定这部作品</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            只要先写清核心方向，AI 和后续规划就能开始工作。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="oneLinePremise">一句话设定</Label>
          <Input
            id="oneLinePremise"
            {...register('oneLinePremise')}
            placeholder="例如：流亡太子重返帝京，借旧部与仇敌之间的裂缝复国"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storyPromise">作品承诺</Label>
          <Textarea
            id="storyPromise"
            {...register('storyPromise')}
            placeholder="这部作品会持续给读者什么体验？比如权谋压迫感、复仇推进感、关系反转感。"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="themes">主题</Label>
          <Textarea
            id="themes"
            {...register('themes')}
            placeholder="复国、忠诚、代价"
            rows={3}
          />
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存这版方向'}
        </Button>
      </section>

      <Accordion type="multiple" className="rounded-lg border border-border">
        <AccordionItem value="boundaries" className="border-b border-border last:border-b-0">
          <AccordionTrigger className="px-4 py-4 hover:bg-[hsl(var(--surface-2))]">
            <div className="space-y-1 text-left">
              <div className="text-sm font-medium text-foreground">再补写法边界</div>
              <p className="text-xs leading-5 text-muted-foreground">
                告诉 AI 该怎么写，以及尽量不要怎么写。
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6 pt-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tone">语气</Label>
                  <Input
                    id="tone"
                    {...register('tone')}
                    placeholder="例如：冷峻、克制、带锋刃"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetReader">目标读者</Label>
                  <Input
                    id="targetReader"
                    {...register('targetReader')}
                    placeholder="你最想写给谁看"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="styleDos">希望保持的写法</Label>
                <Textarea
                  id="styleDos"
                  {...register('styleDos')}
                  placeholder="用逗号或换行分隔"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tabooList">尽量不要出现</Label>
                <Textarea
                  id="tabooList"
                  {...register('tabooList')}
                  placeholder="用逗号或换行分隔"
                  rows={4}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="references" className="border-b border-border last:border-b-0">
          <AccordionTrigger className="px-4 py-4 hover:bg-[hsl(var(--surface-2))]">
            <div className="space-y-1 text-left">
              <div className="text-sm font-medium text-foreground">最后校准参考</div>
              <p className="text-xs leading-5 text-muted-foreground">
                只有当你已经有明确参考时再填，没有也可以先空着。
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="positiveReferences">正向参考</Label>
                <Textarea
                  id="positiveReferences"
                  {...register('positiveReferences')}
                  placeholder="用逗号或换行分隔"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="negativeReferences">反向参考</Label>
                <Textarea
                  id="negativeReferences"
                  {...register('negativeReferences')}
                  placeholder="用逗号或换行分隔"
                  rows={4}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ai-understanding" className="border-b-0">
          <AccordionTrigger className="px-4 py-4 hover:bg-[hsl(var(--surface-2))]">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span>AI 当前理解</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {initialValue.aiUnderstanding.trim() ? '已同步' : '暂无内容'}
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                {aiUnderstandingSummary}
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="pt-2">
              {initialValue.aiUnderstanding.trim() ? (
                <div className="rounded-md border border-border bg-[hsl(var(--surface-2))] px-4 py-3 text-sm leading-7 text-foreground whitespace-pre-wrap">
                  {initialValue.aiUnderstanding}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  保存后，AI 会根据你的宪章生成理解摘要。
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>
  )
}
