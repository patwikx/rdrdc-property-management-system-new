"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { CreateTaskDialog } from "./create-task-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  dueDate: Date | null
  order: number
  createdBy: {
    firstName: string
    lastName: string
  }
  assignedTo: {
    firstName: string
    lastName: string
  } | null
  _count: {
    comments: number
    attachments: number
  }
}

interface Column {
  id: string
  name: string
  order: number
  tasks: Task[]
}

interface ProjectMember {
  id: string
  name: string
}

interface KanbanColumnProps {
  column: Column
  projectId: string
  projectMembers: ProjectMember[]
  isReceiving?: boolean
}

export function KanbanColumn({ column, projectId, projectMembers, isReceiving }: KanbanColumnProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
 
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div className="w-80 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {column.name}
          </h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-1">
            {column.tasks?.length || 0}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsCreateTaskOpen(true)}>
              Add Task
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Column</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-3 min-h-[400px] pb-2 rounded-lg transition-all duration-200",
          isReceiving && "ring-2 ring-primary ring-offset-2 bg-primary/5 ring-offset-background"
        )}
      >
        <SortableContext items={(column.tasks || []).filter(task => task && task.id).map(task => task.id)} strategy={verticalListSortingStrategy}>
          {(column.tasks || []).filter(task => task && task.id).map((task) => (
            <TaskCard key={task.id} task={task} projectMembers={projectMembers} />
          ))}
        </SortableContext>
       
        {/* Add New Card Button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 h-auto py-3"
          onClick={() => setIsCreateTaskOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add new card
        </Button>
      </div>
     
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projectId={projectId}
        columnId={column.id}
        projectMembers={projectMembers}
      />
    </div>
  )
}