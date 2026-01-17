"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, 
  User, 
  MessageCircle, 
  Flag,
  Edit3,
  UserX,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { addTaskComment, getTaskComments, updateTaskDetails, deleteTask } from "@/lib/actions/project-actions"
import { TaskPriority } from "@prisma/client"

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

interface Comment {
  id: string
  content: string
  createdAt: Date
  user: {
    firstName: string
    lastName: string
  }
}

interface TaskDetailDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  projectMembers?: { id: string; name: string }[]
}

const priorityOptions = [
  {
    value: TaskPriority.LOW,
    label: "LOW",
    color: "bg-gray-500"
  },
  {
    value: TaskPriority.MEDIUM,
    label: "MEDIUM",
    color: "bg-blue-500"
  },
  {
    value: TaskPriority.HIGH,
    label: "HIGH",
    color: "bg-orange-500"
  },
  {
    value: TaskPriority.URGENT,
    label: "URGENT",
    color: "bg-red-500"
  }
]

export function TaskDetailDialog({ task, open, onOpenChange, projectMembers = [] }: TaskDetailDialogProps) {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Editable fields
  const [assignedToId, setAssignedToId] = useState<string | null>(task.assignedTo ? "assigned" : null)
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined)
  const [priority, setPriority] = useState<TaskPriority>(task.priority as TaskPriority)
  const [description, setDescription] = useState(task.description || "")
  const [isEditingDescription, setIsEditingDescription] = useState(false)



  const getPriorityOption = (value: TaskPriority) => {
    return priorityOptions.find(option => option.value === value)
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  // Load comments when dialog opens
  useEffect(() => {
    if (open && task.id) {
      setIsLoadingComments(true)
      getTaskComments(task.id)
        .then((fetchedComments) => {
          setComments(fetchedComments)
        })
        .catch((error) => {
          console.error("Error loading comments:", error)
          toast.error("Failed to load comments")
        })
        .finally(() => {
          setIsLoadingComments(false)
        })
    }
  }, [open, task.id])

  const handleSaveComment = async () => {
    if (!newComment.trim()) return

    setIsSavingComment(true)
    try {
      const result = await addTaskComment(task.id, newComment.trim())
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Comment added successfully")
        setNewComment("")
        // Reload comments
        const updatedComments = await getTaskComments(task.id)
        setComments(updatedComments)
      }
    } catch (error) {
      console.error("Error saving comment:", error)
      toast.error("Failed to save comment")
    } finally {
      setIsSavingComment(false)
    }
  }

  const handleUpdateTask = async (updates: {
    assignedToId?: string | null
    dueDate?: Date | null
    priority?: TaskPriority
    description?: string
  }) => {
    setIsUpdating(true)
    try {
      const result = await updateTaskDetails(task.id, updates)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Task updated successfully")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error("Failed to update task")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    try {
      const result = await deleteTask(task.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Task deleted successfully")
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  const handleSaveDescription = async () => {
    if (description !== task.description) {
      await handleUpdateTask({ description })
    }
    setIsEditingDescription(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden rounded-none border-border p-0 gap-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-border bg-muted/5">
          <DialogTitle className="text-lg font-bold uppercase tracking-tight line-clamp-1 pr-4">{task.title}</DialogTitle>
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <span>STATUS:</span>
              <Badge variant="outline" className="rounded-none text-[9px] px-1 py-0 h-4 border-border font-mono">TODO</Badge>
            </div>
            <div className="flex items-center gap-1">
              <span>CREATOR:</span>
              <span>{task.createdBy.firstName} {task.createdBy.lastName}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-0 flex-1 overflow-y-auto p-4">
          {/* Task Details - Editable Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Assignee - Editable */}
            <div className="border border-border bg-background p-3 hover:bg-muted/5 transition-colors group">
              <div className="flex items-center gap-1.5 mb-2.5">
                <User className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Assigned To</span>
              </div>
              <Select
                value={assignedToId || "unassigned"}
                onValueChange={(value) => {
                  const newAssignedId = value === "unassigned" ? null : value
                  setAssignedToId(newAssignedId)
                  handleUpdateTask({ assignedToId: newAssignedId })
                }}
                disabled={isUpdating}
              >
                <SelectTrigger 
                  className="w-full h-8 text-xs border-b border-border border-t-0 border-x-0 bg-transparent pl-0 pr-2 font-mono rounded-none focus:ring-0 focus:border-primary data-[state=open]:border-primary transition-colors"
                  data-testid="assignee-select"
                >
                  <SelectValue>
                    {assignedToId && assignedToId !== "unassigned" ? (
                      (() => {
                        const member = projectMembers.find(m => m.id === assignedToId)
                        if (!member) return <span className="text-muted-foreground">UNKNOWN</span>
                        return (
                          <div className="flex items-center gap-2 ml-2">
                            <div className="h-5 w-5 bg-primary/10 flex items-center justify-center text-[10px] font-bold border border-primary/20 text-primary rounded-none">
                              {member.name.charAt(0)}
                            </div>
                            <span className="uppercase font-bold truncate">{member.name}</span>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground/50 ml-2">
                        <UserX className="h-4 w-4" />
                        <span>UNASSIGNED</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full min-w-[200px] rounded-none border-border" align="start">
                  <SelectItem value="unassigned" className="rounded-none px-3 py-2 text-xs font-mono uppercase cursor-pointer">
                    <div className="flex items-center gap-2">
                      <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">UNASSIGNED</span>
                    </div>
                  </SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="rounded-none px-3 py-2 text-xs font-mono uppercase cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-primary/10 flex items-center justify-center text-[9px] font-bold border border-primary/20 text-primary rounded-none">
                          {member.name.charAt(0)}
                        </div>
                        <span className="truncate">{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date - Editable */}
            <div className="border border-border bg-background p-3 hover:bg-muted/5 transition-colors group">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Deadline</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-8 text-xs p-0 font-mono uppercase justify-start rounded-none border-b border-border bg-transparent hover:bg-transparent hover:border-primary focus:border-primary transition-colors",
                      !dueDate && "text-muted-foreground/50"
                    )}
                    disabled={isUpdating}
                    data-testid="due-date-button"
                  >
                    {dueDate ? (
                      <span className={cn("flex items-center gap-2 font-bold", isOverdue && "text-red-600")}>
                        <span className="text-lg">{format(dueDate, "dd")}</span>
                        <span className="text-xs font-normal text-muted-foreground">{format(dueDate, "MMM")}</span>
                        {isOverdue && <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 ml-auto">LATE</span>}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="text-lg opacity-20">--</span>
                        <span className="text-xs font-normal">NO DATE</span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      handleUpdateTask({ dueDate: date || null })
                    }}
                    className="rounded-none"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Priority - Editable */}
            <div className="border border-border bg-background p-3 hover:bg-muted/5 transition-colors group">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Flag className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Priority</span>
              </div>
              <Select
                value={priority}
                onValueChange={(value: TaskPriority) => {
                  setPriority(value)
                  handleUpdateTask({ priority: value })
                }}
                disabled={isUpdating}
              >
                <SelectTrigger 
                  className="w-full h-8 text-xs border-b border-border border-t-0 border-x-0 bg-transparent pl-0 pr-2 font-mono uppercase rounded-none focus:ring-0 focus:border-primary data-[state=open]:border-primary transition-colors"
                  data-testid="priority-select"
                >
                  <SelectValue>
                    {priority && getPriorityOption(priority) && (
                      <div className="flex items-center gap-2 ml-2">
                        <div className={cn("w-2 h-2 rounded-none", getPriorityOption(priority)?.color)} />
                        <span className="font-bold text-sm">{getPriorityOption(priority)?.label}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full min-w-[140px] rounded-none border-border" align="start">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="rounded-none px-3 py-2 text-xs font-mono uppercase cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-none", option.color)} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description - Editable */}
          <div className="border border-border bg-muted/5 p-3 mb-4">
            <div className="flex items-center justify-between mb-2 border-b border-dashed border-border/50 pb-1">
              <div className="flex items-center gap-1">
                <Edit3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</span>
              </div>
              {!isEditingDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-[10px] uppercase font-bold hover:bg-background border border-transparent hover:border-border rounded-none"
                  onClick={() => setIsEditingDescription(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] resize-none text-xs font-mono rounded-none border-border bg-background focus-visible:ring-0"
                  placeholder="ADD DETAILS..."
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-3 text-[10px] uppercase font-bold rounded-none border-border"
                    onClick={() => {
                      setDescription(task.description || "")
                      setIsEditingDescription(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 px-3 text-[10px] uppercase font-bold rounded-none"
                    onClick={handleSaveDescription}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "SAVING..." : "SAVE"}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="text-xs font-mono leading-relaxed cursor-pointer hover:bg-muted/10 p-1 -m-1"
                onClick={() => setIsEditingDescription(true)}
              >
                {description || (
                  <span className="text-muted-foreground italic uppercase text-[10px]">
                    NO DESCRIPTION PROVIDED...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Activity - Compact */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-1 mb-3">
              <MessageCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Activity Log</span>
            </div>
            
            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <div className="h-8 w-8 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold font-mono text-primary">ME</span>
              </div>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="ADD A COMMENT..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[40px] h-[40px] resize-none text-xs font-mono rounded-none border-border bg-muted/5 focus-visible:ring-0"
                  disabled={isSavingComment}
                />
                {newComment.trim() && (
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-6 px-3 text-[10px] uppercase font-bold rounded-none border-border"
                      onClick={() => setNewComment("")}
                      disabled={isSavingComment}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-6 px-3 text-[10px] uppercase font-bold rounded-none"
                      onClick={handleSaveComment}
                      disabled={isSavingComment}
                    >
                      {isSavingComment ? "POSTING..." : "POST"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center py-4 text-muted-foreground text-[10px] uppercase font-mono animate-pulse">
                SYNCING COMMENTS...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3 pl-4 border-l border-border/50">
                {comments.map((comment) => (
                  <div key={comment.id} className="group relative">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-foreground">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">
                        {format(new Date(comment.createdAt), 'MM/dd HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-[10px] uppercase font-mono border border-dashed border-border/50 bg-muted/5">
                NO ACTIVITY RECORDED
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-3 bg-muted/5 border-t border-border grid grid-cols-4 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] uppercase font-bold rounded-none border-border hover:bg-background"
            onClick={() => {
              const assigneeSelect = document.querySelector('[data-testid="assignee-select"]')
              if (assigneeSelect) (assigneeSelect as HTMLElement).click()
            }}
          >
            Assign
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] uppercase font-bold rounded-none border-border hover:bg-background"
            onClick={() => {
              const prioritySelect = document.querySelector('[data-testid="priority-select"]')
              if (prioritySelect) (prioritySelect as HTMLElement).click()
            }}
          >
            Priority
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[10px] uppercase font-bold rounded-none border-border hover:bg-background"
            onClick={() => {
              const dueDateButton = document.querySelector('[data-testid="due-date-button"]')
              if (dueDateButton) (dueDateButton as HTMLElement).click()
            }}
          >
            Due Date
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8 text-[10px] uppercase font-bold rounded-none hover:bg-destructive/90"
            onClick={handleDeleteTask}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}