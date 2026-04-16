'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useProjects } from '@/lib/hooks/use-projects'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { ProjectCard } from './project-card'
import { EmptyDashboard } from './empty-dashboard'
import { CreateProjectModal } from './create-project-modal'

/** Time-aware greeting in Chinese */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return '早安，今天想写点什么？'
  if (hour >= 12 && hour < 18) return '午后时光，适合写作'
  if (hour >= 18 && hour < 22) return '夜幕降临，故事开始'
  return '夜深了，灵感正浓'
}

/**
 * Project dashboard — the writer's private study.
 * No sidebar. Centered, atmospheric, contemplative.
 */
export function ProjectDashboard() {
  const router = useRouter()
  const { projects, createProject, softDeleteProject } = useProjects()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  const greeting = getGreeting()

  const handleCreateProject = async (data: {
    title: string
    genre?: string
    synopsis?: string
  }): Promise<string> => {
    const id = await createProject(data)
    router.push(`/projects/${id}`)
    return id
  }

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      await softDeleteProject(projectToDelete)
      setProjectToDelete(null)
      setDeleteConfirmOpen(false)
    }
  }

  const projectToDeleteData = projects?.find((p) => p.id === projectToDelete)

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <EmptyDashboard
            greeting={greeting}
            onCreateProject={() => setCreateModalOpen(true)}
          />
        </div>
        <CreateProjectModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSubmit={handleCreateProject}
        />
      </div>
    )
  }

  const isSingle = projects.length === 1

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content — centered, generous breathing room */}
      <div className="flex-1 px-6 py-16 sm:px-8 lg:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header — brand mark + greeting */}
          <div className="mb-12 animate-fade-up">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-[var(--primary)] rounded flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                InkForge
              </span>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] tracking-wide">
              {greeting}
            </p>
          </div>

          {/* Project grid */}
          <div
            className={`grid gap-4 mb-16 ${
              isSingle
                ? 'grid-cols-1 max-w-md'
                : 'grid-cols-1 sm:grid-cols-2'
            }`}
            style={{ animationDelay: '80ms' }}
          >
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="animate-fade-up"
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
              >
                <ProjectCard
                  project={project}
                  onEdit={() => router.push(`/projects/${project.id}`)}
                  onDelete={() => handleDeleteClick(project.id)}
                />
              </div>
            ))}

            {/* New project invitation — sits among the cards */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: `${(projects.length + 1) * 60}ms` }}
            >
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--text-muted)] py-10 text-[var(--text-tertiary)] transition-all duration-300 ease-[var(--ease-out-quint)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-muted)] cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">新建项目</span>
              </button>
            </div>
          </div>

          {/* Bottom subtle links */}
          <div className="flex items-center gap-6 text-xs text-[var(--text-muted)] animate-fade-up" style={{ animationDelay: '300ms' }}>
            <button className="hover:text-[var(--text-secondary)] transition-colors duration-200">
              回收站
            </button>
            <button className="hover:text-[var(--text-secondary)] transition-colors duration-200">
              账户设定
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateProject}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>删除项目</DialogTitle>
            <DialogDescription>
              确定要删除「{projectToDeleteData?.title}」吗？
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-text-secondary">
            删除后可在回收站中恢复
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
