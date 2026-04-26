'use client'

import { useEffect, useState } from 'react'
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

export function ProjectCharterForm({
  initialValue,
  onSave,
}: ProjectCharterFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm<CharterFormFields>({
    defaultValues: {
      oneLinePremise: initialValue.oneLinePremise,
      storyPromise: initialValue.storyPromise,
      themes: stringifyList(initialValue.themes),
      tone: initialValue.tone,
      targetReader: initialValue.targetReader,
      styleDos: stringifyList(initialValue.styleDos),
      tabooList: stringifyList(initialValue.tabooList),
      positiveReferences: stringifyList(initialValue.positiveReferences),
      negativeReferences: stringifyList(initialValue.negativeReferences),
    },
  })

  useEffect(() => {
    reset({
      oneLinePremise: initialValue.oneLinePremise,
      storyPromise: initialValue.storyPromise,
      themes: stringifyList(initialValue.themes),
      tone: initialValue.tone,
      targetReader: initialValue.targetReader,
      styleDos: stringifyList(initialValue.styleDos),
      tabooList: stringifyList(initialValue.tabooList),
      positiveReferences: stringifyList(initialValue.positiveReferences),
      negativeReferences: stringifyList(initialValue.negativeReferences),
    })
  }, [initialValue, reset])

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

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="oneLinePremise">一句话设定</Label>
        <Input
          id="oneLinePremise"
          {...register('oneLinePremise')}
          placeholder="用一句话钉住故事核心"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storyPromise">作品承诺</Label>
        <Textarea
          id="storyPromise"
          {...register('storyPromise')}
          placeholder="这部作品持续会给读者什么体验"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="themes">主题</Label>
        <Textarea
          id="themes"
          {...register('themes')}
          placeholder="用逗号或换行分隔"
          rows={3}
        />
      </div>

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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="styleDos">风格要做</Label>
          <Textarea
            id="styleDos"
            {...register('styleDos')}
            placeholder="用逗号或换行分隔"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tabooList">明确禁区</Label>
          <Textarea
            id="tabooList"
            {...register('tabooList')}
            placeholder="用逗号或换行分隔"
            rows={4}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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

      <div className="space-y-2">
        <Label htmlFor="aiUnderstanding">AI 理解</Label>
        <Textarea
          id="aiUnderstanding"
          value={initialValue.aiUnderstanding}
          readOnly
          rows={6}
          className="resize-none"
        />
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? '保存中...' : '保存宪章'}
      </Button>
    </form>
  )
}
