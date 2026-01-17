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
    <div className="w-80 flex-shrink-0 flex flex-col h-full border border-border bg-background/50">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-widest text-foreground">
            {column.name}
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/20 px-1.5 py-0.5 border border-border">
            {column.tasks?.length || 0}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none hover:bg-muted/20">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none border-border">
            <DropdownMenuItem onClick={() => setIsCreateTaskOpen(true)} className="rounded-none text-xs font-mono uppercase">
              Add Task
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-none text-xs font-mono uppercase">Edit Column</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive rounded-none text-xs font-mono uppercase">
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto p-2 space-y-2 transition-colors duration-200 scrollbar-thin scrollbar-thumb-border",
          isReceiving && "bg-primary/5"
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
          className="w-full justify-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/10 border border-dashed border-border hover:border-foreground/50 h-9 rounded-none"
          onClick={() => setIsCreateTaskOpen(true)}
        >
          <Plus className="h-3 w-3 mr-2" />
          Add Task
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