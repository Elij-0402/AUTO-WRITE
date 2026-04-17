'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, PenLine } from 'lucide-react'
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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return '早安，今天想写点什么'
  if (hour >= 12 && hour < 18) return '午后时光，适合写作'
  if (hour >= 18 && hour < 22) return '夜幕降临，故事开始'
  return '夜深了，灵感正浓'
}

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

  return (
    <div className="min-h-screen flex flex-col surface-0">
      <div className="flex-1 px-6 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto w-full max-w-5xl">
          {/* Masthead */}
          <header className="animate-fade-up">
            <div className="flex items-end justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-primary">
                  <PenLine className="h-4 w-4 text-primary-foreground" strokeWidth={2.2} />
                </div>
                <span className="text-[16px] font-semibold text-foreground">
                  InkForge
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                {greeting}
              </p>
            </div>
          </header>

          {/* Section header */}
          <div
            className="mt-10 mb-6 flex items-baseline justify-between animate-fade-up"
            style={{ animationDelay: '60ms' }}
          >
            <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
              我的书斋
            </h1>
            <span className="text-[13px] text-muted-foreground">
              共 {projects.length} 个项目
            </span>
          </div>

          {/* Grid */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="animate-fade-up"
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                <ProjectCard
                  project={project}
                  onEdit={() => router.push(`/projects/${project.id}`)}
                  onDelete={() => handleDeleteClick(project.id)}
                />
              </div>
            ))}

            <div
              className="animate-fade-up"
              style={{ animationDelay: `${120 + projects.length * 60}ms` }}
            >
              <button
                onClick={() => setCreateModalOpen(true)}
                className="group flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[hsl(var(--border-strong))] bg-transparent text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/[0.04] hover:text-primary cursor-pointer"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current/50">
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="text-[15px] font-medium">
                  新建项目
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateProject}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">删除项目</DialogTitle>
            <DialogDescription>
              确定要删除「{projectToDeleteData?.title}」吗？删除后可在回收站中恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
