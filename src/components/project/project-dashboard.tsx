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
  if (hour >= 6 && hour < 12) return '早安，今天想写点什么？'
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-6 py-16 sm:px-8 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <PenLine className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                InkForge
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {greeting}
            </p>
          </div>

          <div
            className="grid gap-4 mb-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ animationDelay: '80ms' }}
          >
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="animate-fade-up"
                style={{ animationDelay: `${(i + 1) * 50}ms` }}
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
              style={{ animationDelay: `${(projects.length + 1) * 50}ms` }}
            >
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex w-full h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">新建项目</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: '300ms' }}>
            <button className="hover:text-foreground transition-colors">
              回收站
            </button>
            <button className="hover:text-foreground transition-colors">
              账户设定
            </button>
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
            <DialogTitle>删除项目</DialogTitle>
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
