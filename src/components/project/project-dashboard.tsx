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
                <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-control)] bg-[hsl(var(--accent-amber))]">
                  <PenLine className="h-3.5 w-3.5 text-[hsl(var(--primary-foreground))]" strokeWidth={2.5} />
                </div>
                <span className="font-display text-[17px] tracking-[0.1em] text-foreground">
                  InkForge
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground tracking-wide">
                {greeting}
              </p>
            </div>
            <div
              aria-hidden
              className="mt-6 h-px w-full bg-[hsl(var(--border-strong))]"
              style={{
                maskImage:
                  'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              }}
            />
          </header>

          {/* Section header */}
          <div
            className="mt-10 mb-6 flex items-baseline justify-between animate-fade-up"
            style={{ animationDelay: '60ms' }}
          >
            <h1 className="font-display text-[32px] tracking-[0.05em] text-foreground">
              我的书斋
            </h1>
            <span className="text-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/80">
              {String(projects.length).padStart(2, '0')} · {projects.length === 1 ? 'Volume' : 'Volumes'}
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
                className="group relative flex h-full min-h-[172px] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[hsl(var(--border-strong))] bg-transparent text-muted-foreground transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[hsl(var(--accent-amber))]/50 hover:bg-[hsl(var(--accent-amber))]/[0.04] hover:text-[hsl(var(--accent-amber))] cursor-pointer"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-5 top-0 h-px origin-left scale-x-0 bg-[hsl(var(--accent-amber))] transition-transform duration-500 ease-out group-hover:scale-x-100"
                />
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-current/40">
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <span className="font-display text-[18px] tracking-[0.05em]">
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
            <DialogTitle className="font-display text-xl tracking-wide">删除项目</DialogTitle>
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
