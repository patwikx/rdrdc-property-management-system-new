import { Suspense } from "react"
import { FolderKanban, MoreHorizontal, ArrowRight, Columns, CheckSquare, Clock, BarChart3, Activity } from "lucide-react"
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

  // Calculate global stats
  const totalBoards = allBoards.length
  const totalTasks = allBoards.reduce((acc, board) => acc + board.taskCount, 0)
  const totalCompleted = allBoards.reduce((acc, board) => acc + board.completedTasks, 0)
  const avgProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

  if (allBoards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border border-dashed border-border bg-muted/5">
        <div className="text-center max-w-md">
          <div className="p-4 bg-muted/10 w-fit mx-auto mb-4 border border-border">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold uppercase tracking-tight mb-2">No boards found</h3>
          <p className="text-xs font-mono text-muted-foreground mb-6 leading-relaxed">
            Create a project to automatically generate kanban boards for organizing your tasks.
          </p>
          <Button asChild className="rounded-none h-9 text-xs uppercase tracking-wider">
            <Link href="/projects">
              Go to Projects
              <ArrowRight className="h-3 w-3 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border border-b md:border-b-0 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Boards</span>
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-foreground">{totalBoards}</span>
        </div>
        
        <div className="p-4 border-r md:border-r border-b md:border-b-0 border-border hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active Tasks</span>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">{totalTasks}</span>
        </div>

        <div className="p-4 border-r border-border border-b md:border-b-0 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Completed</span>
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{totalCompleted}</span>
        </div>

        <div className="p-4 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Avg Completion</span>
            <Activity className="h-4 w-4 text-orange-600" />
          </div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-orange-600">{avgProgress}%</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allBoards.map((board) => {
          const progressPercentage = board.taskCount > 0 
            ? Math.round((board.completedTasks / board.taskCount) * 100) 
            : 0

          return (
            <div 
              key={board.id} 
              className="group relative flex flex-col justify-between p-4 border border-border bg-background hover:border-primary/50 transition-all duration-200"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1 line-clamp-1">
                      {board.projectName}
                    </div>
                    <Link 
                      href={`/projects/boards/${board.id}`}
                      className="text-lg font-bold uppercase tracking-tight hover:text-primary transition-colors line-clamp-1 block"
                    >
                      {board.name}
                    </Link>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-border">
                      <DropdownMenuItem asChild className="rounded-none font-mono text-xs uppercase">
                        <Link href={`/projects/boards/${board.id}`}>View Board</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-none font-mono text-xs uppercase">
                        <Link href={`/projects/${board.projectId}`}>View Project</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-px bg-border border border-border mb-4">
                  <div className="bg-muted/5 p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Columns className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Cols</span>
                    </div>
                    <span className="text-sm font-mono font-medium">{board.columnCount}</span>
                  </div>
                  <div className="bg-muted/5 p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Tasks</span>
                    </div>
                    <span className="text-sm font-mono font-medium">{board.taskCount}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-mono">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted h-1">
                    <div 
                      className="bg-primary h-1 transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-border mt-auto">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>UPDATED {format(new Date(board.updatedAt), 'MM/dd')}</span>
                  </div>
                  {board.completedTasks > 0 && (
                    <span className="text-foreground">{board.completedTasks}/{board.taskCount} DONE</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BoardsLoading() {
  return (
    <div className="space-y-6">
       {/* Stats Strip Skeleton */}
       <div className="grid grid-cols-2 md:grid-cols-4 border border-border">
          {[...Array(4)].map((_, i) => (
             <div key={i} className="p-4 border-r border-border h-24 bg-background">
                <Skeleton className="h-3 w-20 mb-3 rounded-none" />
                <Skeleton className="h-8 w-12 rounded-none" />
             </div>
          ))}
       </div>

       {/* Grid Skeleton */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
             <div key={i} className="p-4 border border-border bg-background h-[280px]">
                <Skeleton className="h-3 w-24 mb-2 rounded-none" />
                <Skeleton className="h-6 w-3/4 mb-6 rounded-none" />
                <div className="grid grid-cols-2 gap-px bg-border border border-border mb-6">
                   <div className="bg-background p-2 h-16" />
                   <div className="bg-background p-2 h-16" />
                </div>
                <Skeleton className="h-1 w-full mt-auto rounded-none" />
             </div>
          ))}
       </div>
    </div>
  )
}

export default function BoardsPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1920px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">All Boards</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wide">
            System-wide Kanban Overview
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-none h-9 text-xs uppercase tracking-wider border-border hover:bg-muted/10">
          <Link href="/projects">
            <ArrowRight className="h-3 w-3 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      <Suspense fallback={<BoardsLoading />}>
        <BoardsList />
      </Suspense>
    </div>
  )
}