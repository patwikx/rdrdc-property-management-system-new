"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  MessageCircle, 
  Paperclip, 
  Clock, 
  User, 
  Flag, 
  CheckSquare, 
  Calendar,
  Edit3,
} from "lucide-react"
import { format, isToday, isTomorrow, isPast } from "date-fns"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
  
  // Safety check for task object
  if (!task || !task.id) {
    console.error("TaskCard received invalid task:", task)
    return null
  }

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
    
    let label = format(date, 'MMM dd')
    let urgency = 'normal'
    
    if (isOverdue) {
      label = `${label} (Overdue)`
      urgency = 'overdue'
    } else if (isToday(date)) {
      label = 'Today'
      urgency = 'today'
    } else if (isTomorrow(date)) {
      label = 'Tomorrow'
      urgency = 'tomorrow'
    }
    
    return { label, urgency, isOverdue }
  }

  const dueDateInfo = getDueDateInfo(task.dueDate)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative p-3 rounded-lg border border-border/50 bg-background",
          "cursor-grab active:cursor-grabbing transition-all duration-200",
          "hover:shadow-sm hover:border-border",
          (isDragging || isSortableDragging) && "opacity-50 rotate-2 shadow-lg scale-105",
          dueDateInfo?.isOverdue && "border-red-200 dark:border-red-800/50"
        )}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          // Only open detail if not dragging
          if (!isDragging && !isSortableDragging) {
            e.stopPropagation()
            setIsDetailOpen(true)
          }
        }}
      >
        <div className="space-y-3">
          {/* Priority indicator */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
                {task.title}
              </h4>
            </div>
            <div className={cn(
              "flex-shrink-0 w-2 h-2 rounded-full",
              task.priority === 'URGENT' && "bg-red-500",
              task.priority === 'HIGH' && "bg-orange-500",
              task.priority === 'MEDIUM' && "bg-yellow-500",
              task.priority === 'LOW' && "bg-green-500"
            )} />
          </div>

          {/* Description if available */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Due date */}
          {dueDateInfo && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md w-fit",
              dueDateInfo.urgency === 'overdue' && "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
              dueDateInfo.urgency === 'today' && "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
              dueDateInfo.urgency === 'tomorrow' && "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400",
              dueDateInfo.urgency === 'normal' && "bg-muted/50 text-muted-foreground"
            )}>
              <Clock className="h-3 w-3" />
              <span className="font-medium">{dueDateInfo.label}</span>
            </div>
          )}

          {/* Bottom row with assignee, actions, and counters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Assignee */}
              {task.assignedTo ? (
                <Avatar className="h-6 w-6 ring-1 ring-border">
                  <AvatarFallback className="text-xs bg-muted">
                    {getInitials(task.assignedTo.firstName, task.assignedTo.lastName)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center ring-1 ring-border">
                  <span className="text-xs text-muted-foreground">?</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center gap-0.5 ml-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-muted/80 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDetailOpen(true)
                  }}
                >
                  <User className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-muted/80 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDetailOpen(true)
                  }}
                >
                  <Flag className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-muted/80 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDetailOpen(true)
                  }}
                >
                  <Calendar className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-muted/80 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDetailOpen(true)
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>

              {/* Priority label for screen readers */}
              <span className="sr-only">Priority: {task.priority}</span>
            </div>

            {/* Counters and Status Indicators */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {/* Task has checklist items (placeholder) */}
              <div className="flex items-center gap-1 opacity-60">
                <CheckSquare className="h-3 w-3" />
                <span>0/0</span>
              </div>
              
              {task._count.comments > 0 && (
                <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <MessageCircle className="h-3 w-3" />
                  <span>{task._count.comments}</span>
                </div>
              )}
              {task._count.attachments > 0 && (
                <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Paperclip className="h-3 w-3" />
                  <span>{task._count.attachments}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover overlay for better interaction feedback */}
        <div className="absolute inset-0 rounded-lg bg-foreground/0 group-hover:bg-foreground/[0.02] transition-colors pointer-events-none" />
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