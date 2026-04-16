'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProjectMeta } from '@/lib/types'

const GENRE_OPTIONS = [
  '玄幻', '奇幻', '武侠', '仙侠', '都市', '现实',
  '科幻', '历史', '军事', '游戏', '体育', '灵异', '其他',
]

const projectSettingsSchema = z.object({
  title: z.string().min(1, '请输入标题').max(100, '标题不能超过100字'),
  genre: z.string().optional(),
  synopsis: z.string().max(500, '简介不能超过500字').optional(),
})

type ProjectSettingsFormData = z.infer<typeof projectSettingsSchema>

interface ProjectSettingsFormProps {
  project: ProjectMeta
  onSave: (data: Partial<ProjectMeta>) => Promise<void>
}

export function ProjectSettingsForm({
  project,
  onSave,
}: ProjectSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProjectSettingsFormData>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: {
      title: project.title,
      genre: project.genre,
      synopsis: project.synopsis,
    },
  })

  const handleFormSubmit = async (data: ProjectSettingsFormData) => {
    setIsSaving(true)
    try {
      await onSave(data)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">
          标题 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="输入小说标题"
          maxLength={100}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">类型</Label>
        <Select
          defaultValue={project.genre}
          onValueChange={(value) => setValue('genre', value, { shouldDirty: true })}
        >
          <SelectTrigger id="genre">
            <SelectValue placeholder="选择类型" />
          </SelectTrigger>
          <SelectContent>
            {GENRE_OPTIONS.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="synopsis">简介</Label>
        <Textarea
          id="synopsis"
          {...register('synopsis')}
          placeholder="简单描述你的故事"
          maxLength={500}
          rows={4}
        />
        {errors.synopsis && (
          <p className="text-xs text-destructive">{errors.synopsis.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>封面图片</Label>
        <div className="flex h-32 items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
          封面功能即将推出
        </div>
      </div>

      <Button type="submit" disabled={isSaving || !isDirty}>
        {isSaving ? '保存中...' : '保存'}
      </Button>
    </form>
  )
}
