'use client'

import { useState, useCallback } from 'react'
import { Download, FileText, FileDown, BookOpen } from 'lucide-react'
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

/**
 * Project settings dialog with Export tab per D-11.
 * Contains project metadata editing and export utilities.
 */
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
      // Small delay to show generating step
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

        {/* Tab navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            基本设置
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            导出
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'settings' && (
            <ProjectSettingsForm
              project={project}
              onSave={onSaveProject}
            />
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                选择导出格式，将你的小说导出为可阅读的格式。
              </p>

              {/* Export buttons */}
              <div className="space-y-3">
                {/* Markdown export */}
                <button
                  onClick={handleExportMarkdown}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">导出Markdown</div>
                    <div className="text-xs text-zinc-500">.md 格式，适合大多数编辑器</div>
                  </div>
                  <Download className="w-5 h-5 text-zinc-400" />
                </button>

                {/* DOCX export */}
                <button
                  onClick={handleExportDocx}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">导出DOCX</div>
                    <div className="text-xs text-zinc-500">.docx 格式，适合Microsoft Word</div>
                  </div>
                  <Download className="w-5 h-5 text-zinc-400" />
                </button>

                {/* EPUB export */}
                <button
                  onClick={handleExportEpub}
                  disabled={isExporting}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">导出EPUB</div>
                    <div className="text-xs text-zinc-500">.epub 格式，适合电子书阅读器</div>
                  </div>
                  <Download className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Progress indicator */}
              {exportStatus !== 'idle' && exportStatus !== 'error' && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  {getStepText()}
                </div>
              )}

              {/* Error display */}
              {exportStatus === 'error' && exportError && (
                <div className="text-sm text-red-600 dark:text-red-400">
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