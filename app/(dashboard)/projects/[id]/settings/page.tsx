import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getProjectById } from "@/lib/actions/project-actions"
import { ProjectSettings } from "@/components/projects/project-settings"

interface ProjectSettingsPageProps {
  params: {
    id: string
  }
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return notFound()
  }

  const project = await getProjectById(params.id)
  
  if (!project) {
    return notFound()
  }

  return (
    <div className="p-6">
      <ProjectSettings project={project} />
    </div>
  )
}