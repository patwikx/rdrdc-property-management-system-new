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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProjectHeader project={project} />
      <KanbanBoard project={project} />
    </div>
  )
}