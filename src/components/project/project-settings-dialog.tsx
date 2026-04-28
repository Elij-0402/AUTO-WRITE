'use client'

import { useState, useCallback } from 'react'
import { Download, FileText, FileDown, BookOpen, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ProjectSettingsForm } from './project-settings-form'
import { exportToMarkdown, downloadBlob } from '@/lib/export/markdown-export'
import { exportToDocx } from '@/lib/export/docx-export'
import { exportToEpub } from '@/lib/export/epub-export'
import { cn } from '@/lib/utils'
import type { ProjectMeta } from '@/lib/types'

interface ProjectSettingsDialogProps {
  project: ProjectMeta
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveProject: (data: Partial<ProjectMeta>) => Promise<void>
}

type ExportStatus = 'idle' | 'preparing' | 'gathering' | 'generating' | 'downloading' | 'error'

const EXPORT_STEPS = {
  preparing: '准备导出...',
  gathering: '汇总章节内容...',
  generating: '生成文件...',
  downloading: '触发下载...',
} as const

export function ProjectSettingsDialog({
  project,
  open,
  onOpenChange,
  onSaveProject,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'export'>('settings')
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportMarkdown = useCallback(async () => {
    try {
      setExportStatus('preparing')
      setExportError(null)

      setExportStatus('gathering')
      const blob = await exportToMarkdown(project.id)

      setExportStatus('generating')
      await new Promise(resolve => setTimeout(resolve, 100))

      setExportStatus('downloading')
      const filename = `${project.title || 'novel'}.md`
      downloadBlob(blob, filename)

      setExportStatus('idle')
    } catch (err) {
      setExportStatus('error')
      setExportError(err instanceof Error ? err.message : '导出失败')
    }
  }, [project.id, project.title])

  const handleExportDocx = useCallback(async () => {
    try {
      setExportStatus('preparing')
      setExportError(null)

      setExportStatus('gathering')
      const blob = await exportToDocx(project.id, project.title || '未知标题')

      setExportStatus('generating')
      await new Promise(resolve => setTimeout(resolve, 100))

      setExportStatus('downloading')
      const filename = `${project.title || 'novel'}.docx`
      downloadBlob(blob, filename)

      setExportStatus('idle')
    } catch (err) {
      setExportStatus('error')
      setExportError(err instanceof Error ? err.message : '导出失败')
    }
  }, [project.id, project.title])

  const handleExportEpub = useCallback(async () => {
    try {
      setExportStatus('preparing')
      setExportError(null)

      setExportStatus('gathering')
      const blob = await exportToEpub(project.id, { title: project.title || '未知标题' })

      setExportStatus('generating')
      await new Promise(resolve => setTimeout(resolve, 100))

      setExportStatus('downloading')
      const filename = `${project.title || 'novel'}.epub`
      downloadBlob(blob, filename)

      setExportStatus('idle')
    } catch (err) {
      setExportStatus('error')
      setExportError(err instanceof Error ? err.message : '导出失败')
    }
  }, [project.id, project.title])

  const getStepText = () => {
    switch (exportStatus) {
      case 'preparing': return EXPORT_STEPS.preparing
      case 'gathering': return EXPORT_STEPS.gathering
      case 'generating': return EXPORT_STEPS.generating
      case 'downloading': return EXPORT_STEPS.downloading
      default: return ''
    }
  }

  const isExporting = exportStatus !== 'idle' && exportStatus !== 'error'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>项目设置</DialogTitle>
          <DialogDescription>
            管理项目信息和导出选项
          </DialogDescription>
        </DialogHeader>

        <div className="flex divider-hair">
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            基本设置
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={cn(
              'px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'export'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            导出
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'settings' && (
            <ProjectSettingsForm
              project={project}
              onSave={onSaveProject}
            />
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                选择导出格式，将你的小说导出为可阅读的格式。
              </p>

              <div className="space-y-2">
                <button
                  onClick={handleExportMarkdown}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 p-4 rounded-[var(--radius-card)] surface-2 film-edge hover:film-edge-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-control)] surface-3 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">导出 Markdown</div>
                    <div className="text-xs text-muted-foreground">.md 格式，适合大多数编辑器</div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>

                <button
                  onClick={handleExportDocx}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 p-4 rounded-[var(--radius-card)] surface-2 film-edge hover:film-edge-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-control)] surface-3 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">导出 DOCX</div>
                    <div className="text-xs text-muted-foreground">.docx 格式，适合 Microsoft Word</div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>

                <button
                  onClick={handleExportEpub}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 p-4 rounded-[var(--radius-card)] surface-2 film-edge hover:film-edge-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-control)] surface-3 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">导出 EPUB</div>
                    <div className="text-xs text-muted-foreground">.epub 格式，适合电子书阅读器</div>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {exportStatus !== 'idle' && exportStatus !== 'error' && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {getStepText()}
                </div>
              )}

              {exportStatus === 'error' && exportError && (
                <div className="text-[13px] text-destructive">
                  {exportError}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
