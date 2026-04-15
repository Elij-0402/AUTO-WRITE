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

/**
 * Sidebar navigation for the dashboard.
 */
function DashboardSidebar() {
  return (
    <aside className="w-60 bg-[var(--surface-0)] border-none shrink-0 flex flex-col shadow-[1px_0_15px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_15px_rgba(0,0,0,0.2)] z-10">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <span className="font-bold text-[var(--foreground)] tracking-tight">InkForge</span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] transition-all duration-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          我的作品
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-[var(--foreground)]/70 hover:bg-[var(--surface-1)] hover:text-[var(--foreground)] transition-all duration-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          最近编辑
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-[var(--foreground)]/70 hover:bg-[var(--surface-1)] hover:text-[var(--foreground)] transition-all duration-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          回收站
        </button>
      </nav>

      {/* Bottom: user area */}
      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl cursor-pointer hover:bg-[var(--surface-1)] transition-colors duration-300 text-[var(--foreground)]/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)]/20 to-[var(--primary)]/40 flex items-center justify-center border border-[var(--primary)]/10">
            <span className="text-[10px] font-bold text-[var(--primary)]">AC</span>
          </div>
          <span className="font-medium">账户设定</span>
        </div>
      </div>
    </aside>
  )
}

/**
 * Project dashboard component per D-01, D-05.
 * Card grid layout with empty state and project creation.
 */
export function ProjectDashboard() {
  const router = useRouter()
  const { projects, createProject, softDeleteProject } = useProjects()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

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

  // Show empty state when no projects
  if (!projects || projects.length === 0) {
    return (
      <div className="flex min-h-screen bg-[var(--background)]">
        <DashboardSidebar />
        <div className="flex-1 relative">

          <EmptyDashboard onCreateProject={() => setCreateModalOpen(true)} />
          <CreateProjectModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSubmit={handleCreateProject}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <DashboardSidebar />

      {/* Main content area */}
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              我的作品
            </h1>
            <Button onClick={() => setCreateModalOpen(true)} className="rounded-xl px-5 py-2.5 shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 transition-all duration-300 active:scale-95">
              <Plus className="h-4 w-4" />
              新建项目
            </Button>
          </div>

          {/* Project card grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => router.push(`/projects/${project.id}`)}
                onDelete={() => handleDeleteClick(project.id)}
              />
            ))}
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
    </div>
  )
}
