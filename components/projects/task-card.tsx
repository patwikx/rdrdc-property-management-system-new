"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  MessageCircle, 
  Paperclip, 
  User, 
  Calendar,
} from "lucide-react"
import { format, isToday, isTomorrow, isPast } from "date-fns"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { TaskDetailDialog } from "./task-detail-dialog"

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

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  projectMembers?: { id: string; name: string }[]
}

const priorityConfig: Record<string, { label: string; borderColor: string; textColor: string }> = {
  URGENT: { 
    label: "URGENT", 
    borderColor: "border-l-rose-600",
    textColor: "text-rose-600"
  },
  HIGH: { 
    label: "HIGH", 
    borderColor: "border-l-orange-500",
    textColor: "text-orange-600"
  },
  MEDIUM: { 
    label: "MEDIUM", 
    borderColor: "border-l-amber-500",
    textColor: "text-amber-600"
  },
  LOW: { 
    label: "LOW", 
    borderColor: "border-l-emerald-500",
    textColor: "text-emerald-600"
  }
}

export function TaskCard({ task, isDragging = false, projectMembers = [] }: TaskCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task?.id || 'invalid-task',
  })
  
  if (!task || !task.id) return null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getDueDateInfo = (dueDate: Date | null) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const isOverdue = isPast(date) && !isToday(date)
    let label = format(date, 'MM/dd')
    let colorClass = "text-muted-foreground"
    
    if (isOverdue) {
      colorClass = "text-rose-600 font-bold"
    } else if (isToday(date)) {
      label = "TODAY"
      colorClass = "text-orange-600 font-bold"
    } else if (isTomorrow(date)) {
      label = "TMRW"
      colorClass = "text-amber-600"
    }
    
    return { label, colorClass }
  }

  const dueDateInfo = getDueDateInfo(task.dueDate)
  const priorityInfo = priorityConfig[task.priority] || priorityConfig.LOW

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative border border-border bg-background p-3 transition-all hover:shadow-md hover:border-primary/20 rounded-none",
          "cursor-grab active:cursor-grabbing",
          "border-l-[3px]", 
          priorityInfo.borderColor,
          (isDragging || isSortableDragging) && "opacity-50 rotate-1 scale-105 shadow-xl z-50 bg-muted/10",
        )}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (!isDragging && !isSortableDragging) {
            e.stopPropagation()
            setIsDetailOpen(true)
          }
        }}
      >
        <div className="space-y-2">
          {/* Header: ID & Priority */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] text-muted-foreground">TSK-{task.order}</span>
            <span className={cn("text-[9px] font-bold uppercase tracking-widest", priorityInfo.textColor)}>
              {priorityInfo.label}
            </span>
          </div>

          {/* Title */}
          <div>
            <h4 className="text-sm font-medium leading-tight line-clamp-2 text-foreground/90 mb-1">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-2 font-mono leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Footer Metrics */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50">
             <div className="flex items-center gap-2">
                {task.assignedTo ? (
                  <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignedTo.firstName}`}>
                    <Avatar className="h-4 w-4 rounded-none border border-border">
                      <AvatarFallback className="text-[8px] rounded-none bg-primary/10 text-primary">
                        {getInitials(task.assignedTo.firstName, task.assignedTo.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] uppercase font-medium text-muted-foreground truncate max-w-[80px]">
                      {task.assignedTo.firstName}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] uppercase text-muted-foreground/50 font-bold tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> Unassigned
                  </span>
                )}
             </div>

             <div className="flex items-center gap-3">
                {/* Due Date */}
                {dueDateInfo && (
                  <div className={cn("flex items-center gap-1 text-[10px] font-mono", dueDateInfo.colorClass)}>
                     <Calendar className="h-3 w-3" />
                     <span>{dueDateInfo.label}</span>
                  </div>
                )}
                
                {/* Comments/Attachments */}
                {(task._count.comments > 0 || task._count.attachments > 0) && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                    {task._count.comments > 0 && (
                      <div className="flex items-center gap-0.5">
                        <MessageCircle className="h-3 w-3" />
                        <span>{task._count.comments}</span>
                      </div>
                    )}
                    {task._count.attachments > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Paperclip className="h-3 w-3" />
                        <span>{task._count.attachments}</span>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
      
      <TaskDetailDialog
        task={task}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        projectMembers={projectMembers}
      />
    </>
  )
}