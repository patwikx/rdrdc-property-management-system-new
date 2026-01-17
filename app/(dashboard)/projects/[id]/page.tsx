import { notFound } from "next/navigation"
import { getProjectById } from "@/lib/actions/project-actions"
import { KanbanBoard } from "@/components/projects/kanban-board"
import { ProjectHeader } from "@/components/projects/project-header"

interface ProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const project = await getProjectById(id)

  if (!project) {
    notFound()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-full overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border bg-background px-6 py-4">
        <ProjectHeader project={project} />
      </div>
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-muted/5 p-6">
        <KanbanBoard project={project} />
      </div>
    </div>
  )
}