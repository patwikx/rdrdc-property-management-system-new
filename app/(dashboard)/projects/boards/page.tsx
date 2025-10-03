import { Suspense } from "react"
import { FolderKanban, MoreHorizontal, ArrowRight, Columns, CheckSquare, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getProjectsWithBoards } from "@/lib/actions/project-actions"
import { format } from "date-fns"
import Link from "next/link"


async function BoardsList() {
  const projects = await getProjectsWithBoards()
  
  // Flatten all boards from all projects
  const allBoards = projects.flatMap(project => 
    (project.boards || []).map(board => ({
      ...board,
      projectName: project.name,
      projectId: project.id,
      taskCount: (board.columns || []).reduce((total, column) => total + (column.tasks?.length || 0), 0),
      columnCount: (board.columns || []).length,
      completedTasks: (board.columns || []).reduce((total, column) => 
        total + (column.name.toLowerCase().includes('done') || column.name.toLowerCase().includes('complete') 
          ? column.tasks?.length || 0 
          : 0), 0)
    }))
  )

  // Group boards by project
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const boardsByProject = allBoards.reduce((acc, board) => {
    if (!acc[board.projectId]) {
      acc[board.projectId] = {
        projectName: board.projectName,
        boards: []
      }
    }
    acc[board.projectId].boards.push(board)
    return acc
  }, {} as Record<string, { projectName: string; boards: typeof allBoards }>)

  if (allBoards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No boards found</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Create a project to automatically generate kanban boards for organizing your tasks.
          </p>
          <Button asChild>
            <Link href="/projects">
              Go to Projects
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {allBoards.map((board) => {
        const progressPercentage = board.taskCount > 0 
          ? Math.round((board.completedTasks / board.taskCount) * 100) 
          : 0

        return (
          <div 
            key={board.id} 
            className="group relative p-4 rounded-lg border border-border/50 bg-background hover:shadow-sm hover:border-border transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/projects/boards/${board.id}`}
                  className="text-base font-semibold hover:text-primary transition-colors line-clamp-1"
                >
                  {board.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {board.projectName}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/boards/${board.id}`}>View & Edit Board</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${board.projectId}`}>View Project</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                <div className="p-1 rounded bg-blue-100 dark:bg-blue-950">
                  <Columns className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Columns</p>
                  <p className="text-sm font-medium">{board.columnCount}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                <div className="p-1 rounded bg-green-100 dark:bg-green-950">
                  <CheckSquare className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                  <p className="text-sm font-medium">{board.taskCount}</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            {board.taskCount > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Updated {format(new Date(board.updatedAt), 'MMM dd')}</span>
                </div>
                {board.completedTasks > 0 && (
                  <span>{board.completedTasks}/{board.taskCount} done</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BoardsLoading() {
  return (
    <div className="space-y-6">
      {[...Array(2)].map((_, projectIndex) => (
        <div key={projectIndex} className="space-y-3">
          {/* Project Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          
          {/* Boards Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(3)].map((_, boardIndex) => (
              <div key={boardIndex} className="p-4 rounded-lg border border-border/50 bg-background">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-md bg-muted/30">
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="p-2 rounded-md bg-muted/30">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                  
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BoardsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Boards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all kanban boards across your projects
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/projects">
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Boards List */}
      <Suspense fallback={<BoardsLoading />}>
        <BoardsList />
      </Suspense>
    </div>
  )
}