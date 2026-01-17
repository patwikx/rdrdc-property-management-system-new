import { Suspense } from "react"
import { Plus, FolderKanban, Users, Calendar, MoreHorizontal, Clock, Target, ArrowRight, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getProjects, ProjectListItem } from "@/lib/actions/project-actions"
import { format, differenceInDays } from "date-fns"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function ProjectCard({ project }: { project: ProjectListItem }) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
      case 'COMPLETED': return 'border-blue-500 text-blue-600 bg-blue-500/10'
      case 'ON_HOLD': return 'border-amber-500 text-amber-600 bg-amber-500/10'
      case 'ARCHIVED': return 'border-muted text-muted-foreground bg-muted/10'
      default: return 'border-muted text-muted-foreground bg-muted/10'
    }
  }

  const getDaysRemaining = () => {
    if (!project.endDate) return null
    const days = differenceInDays(new Date(project.endDate), new Date())
    return days
  }

  const daysRemaining = getDaysRemaining()

  return (
    <div className="group relative border border-border bg-background hover:shadow-none hover:border-primary/50 transition-all flex flex-col h-full rounded-none">
      {/* Header */}
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <Link 
              href={`/projects/${project.id}`}
              className="text-base font-bold uppercase tracking-tight hover:text-primary transition-colors block truncate mb-1"
            >
              {project.name}
            </Link>
            <Badge variant="outline" className={cn(
              "rounded-none text-[10px] uppercase tracking-widest font-mono",
              getStatusStyle(project.status)
            )}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none border-border">
              <DropdownMenuItem asChild className="rounded-none cursor-pointer text-xs font-mono uppercase">
                <Link href={`/projects/${project.id}`}>View Project</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-none cursor-pointer text-xs font-mono uppercase">
                <Link href={`/projects/${project.id}/settings`}>Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 font-mono leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          <div className="bg-background p-2 flex items-center justify-between">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Tasks</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold">{project._count.tasks}</span>
              <Target className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-background p-2 flex items-center justify-between">
            <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Team</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold">{project._count.members + 1}</span>
              <Users className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/5 border-t border-border mt-auto">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wide mb-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Start: {format(new Date(project.startDate), 'MM/dd/yy')}</span>
          </div>
          
          {daysRemaining !== null && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className={cn(
                "font-bold",
                daysRemaining < 0 ? "text-red-600" :
                daysRemaining <= 7 ? "text-orange-600" : "text-foreground"
              )}>
                {daysRemaining < 0 
                  ? `${Math.abs(daysRemaining)}D OVER`
                  : daysRemaining === 0 
                  ? "DUE TODAY"
                  : `${daysRemaining}D LEFT`
                }
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 border-dashed">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
            <span className="font-bold">OWNER:</span> {project.owner.firstName} {project.owner.lastName}
          </div>
          <Link href={`/projects/${project.id}`} className="group/link flex items-center gap-1 text-[10px] font-bold uppercase hover:text-primary transition-colors">
            Access <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

async function ProjectsList() {
  const projects = await getProjects()

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border bg-muted/5">
        <div className="p-4 bg-background border border-border mb-4">
          <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">No Projects Found</h3>
        <p className="text-xs text-muted-foreground font-mono mb-6 uppercase tracking-wide">
          Initialize a new project board
        </p>
        <CreateProjectDialog>
          <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold">
            <Plus className="h-3 w-3 mr-2" />
            Initialize Project
          </Button>
        </CreateProjectDialog>
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
        <div key={i} className="border border-border bg-background p-4 h-[280px] flex flex-col rounded-none">
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-3/4 rounded-none" />
              <Skeleton className="h-5 w-16 rounded-none" />
            </div>
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-2/3 rounded-none" />
            
            <div className="grid grid-cols-2 gap-px bg-border border border-border mt-4">
              <div className="bg-background p-2">
                <Skeleton className="h-8 w-full rounded-none" />
              </div>
              <div className="bg-background p-2">
                <Skeleton className="h-8 w-full rounded-none" />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/3 rounded-none" />
              <Skeleton className="h-3 w-1/4 rounded-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Projects</h1>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide mt-1">
            Project Kanban workflow & task management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/projects/boards">
            <Button variant="outline" className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold">
              <Settings className="h-3 w-3 mr-2" />
              Board Settings
            </Button>
          </Link>
          <CreateProjectDialog>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold">
              <Plus className="h-3 w-3 mr-2" />
              New Project
            </Button>
          </CreateProjectDialog>
        </div>
      </div>

      {/* Projects Grid */}
      <Suspense fallback={<ProjectsLoading />}>
        <ProjectsList />
      </Suspense>
    </div>
  )
}