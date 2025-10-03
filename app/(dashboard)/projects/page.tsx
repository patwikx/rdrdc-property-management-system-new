import { Suspense } from "react"
import { Plus, FolderKanban, Users, Calendar, MoreHorizontal, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getProjects, ProjectListItem } from "@/lib/actions/project-actions"
import { format, differenceInDays } from "date-fns"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

function ProjectCard({ project }: { project: ProjectListItem }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
    }
  }

  const getDaysRemaining = () => {
    if (!project.endDate) return null
    const days = differenceInDays(new Date(project.endDate), new Date())
    return days
  }

  const daysRemaining = getDaysRemaining()

  return (
    <div className="group relative p-4 rounded-lg border border-border/50 bg-background hover:shadow-sm hover:border-border transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href={`/projects/${project.id}`}
              className="text-lg font-semibold hover:text-primary transition-colors truncate"
            >
              {project.name}
            </Link>
            <div className={cn(
              "px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0",
              getStatusColor(project.status)
            )}>
              {project.status.replace('_', ' ')}
            </div>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`}>View Project</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}/settings`}>Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
          <div className="p-1 rounded bg-blue-100 dark:bg-blue-950">
            <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tasks</p>
            <p className="text-sm font-medium">{project._count.tasks}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
          <div className="p-1 rounded bg-purple-100 dark:bg-purple-950">
            <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Team</p>
            <p className="text-sm font-medium">{project._count.members + 1}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Started {format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
        </div>
        
        {daysRemaining !== null && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={cn(
              daysRemaining < 0 && "text-red-600 dark:text-red-400",
              daysRemaining <= 7 && daysRemaining >= 0 && "text-orange-600 dark:text-orange-400"
            )}>
              {daysRemaining < 0 
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining === 0 
                ? "Due today"
                : `${daysRemaining} days left`
              }
            </span>
          </div>
        )}
      </div>

      {/* Owner */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Owner: <span className="font-medium text-foreground">{project.owner.firstName} {project.owner.lastName}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {format(new Date(project.updatedAt), 'MMM dd')}
          </div>
        </div>
      </div>
    </div>
  )
}

async function ProjectsList() {
  const projects = await getProjects()

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Create your first project to start organizing your tasks with kanban boards and collaborate with your team.
          </p>
          <CreateProjectDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </CreateProjectDialog>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

function ProjectsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-border/50 bg-background">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-md bg-muted/30">
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="p-2 rounded-md bg-muted/30">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your projects and track progress with kanban boards
          </p>
        </div>
        <CreateProjectDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </CreateProjectDialog>
      </div>

      {/* Projects Grid */}
      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsList />
      </Suspense>
    </div>
  )
}