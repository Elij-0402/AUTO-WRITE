'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const GENRE_OPTIONS = [
  '玄幻', '奇幻', '武侠', '仙侠', '都市', '现实',
  '科幻', '历史', '军事', '游戏', '体育', '灵异', '其他',
]

const createProjectSchema = z.object({
  title: z.string().min(1, '请输入标题').max(100, '标题不能超过100字'),
  genre: z.string().optional(),
  synopsis: z.string().max(500, '简介不能超过500字').optional(),
})

type CreateProjectFormData = z.infer<typeof createProjectSchema>

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProjectFormData) => Promise<string>
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      genre: '',
      synopsis: '',
    },
  })

  const handleFormSubmit = async (data: CreateProjectFormData) => {
    setIsSubmitting(true)
    try {
      const id = await onSubmit(data)
      reset()
      router.push(`/projects/${id}`)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-[20px] font-semibold">新建项目</DialogTitle>
          <DialogDescription>
            创建一个新的小说项目，开始你的写作之旅
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 pt-2">
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
            <Select onValueChange={(value) => setValue('genre', value)}>
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
              rows={3}
            />
            {errors.synopsis && (
              <p className="text-xs text-destructive">{errors.synopsis.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
