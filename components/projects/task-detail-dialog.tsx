"use client"

import { useState, useEffect } from "react"
import { 
  Calendar, 
  User, 
  MessageCircle, 
  Paperclip, 
  CheckSquare,
  Flag,
  Trash2,
  Edit3,
  CalendarIcon,
  UserX,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    label: "Low",
    color: "bg-gray-500"
  },
  {
    value: TaskPriority.MEDIUM,
    label: "Medium",
    color: "bg-blue-500"
  },
  {
    value: TaskPriority.HIGH,
    label: "High",
    color: "bg-orange-500"
  },
  {
    value: TaskPriority.URGENT,
    label: "Urgent",
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-semibold">{task.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span>in list</span>
              <Badge variant="outline" className="text-xs px-1 py-0">TODO</Badge>
            </div>
            <div className="flex items-center gap-1">
              <span>Created by</span>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(task.createdBy.firstName, task.createdBy.lastName)}
                </AvatarFallback>
              </Avatar>
              <span>{task.createdBy.firstName} {task.createdBy.lastName}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Task Details - Editable Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Assignee - Editable */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Assigned to</span>
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
                  className="w-full h-7 text-xs border-none bg-transparent px-1 hover:bg-muted/50"
                  data-testid="assignee-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="unassigned" className="px-3">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Unassigned</span>
                    </div>
                  </SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="px-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date - Editable */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Due Date</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-7 text-xs p-0 font-normal justify-start hover:bg-muted/50",
                      !dueDate && "text-muted-foreground"
                    )}
                    disabled={isUpdating}
                    data-testid="due-date-button"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dueDate ? (
                      <span className={cn(isOverdue && "text-red-600")}>
                        {format(dueDate, "MMM dd")}
                        {isOverdue && <span className="ml-1">Overdue</span>}
                      </span>
                    ) : (
                      <span>No due date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      handleUpdateTask({ dueDate: date || null })
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Priority - Editable */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-2">
                <Flag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Priority</span>
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
                  className="w-full h-7 text-xs border-none bg-transparent px-1 hover:bg-muted/50"
                  data-testid="priority-select"
                >
                  <SelectValue>
                    {priority && getPriorityOption(priority) && (
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", getPriorityOption(priority)?.color)} />
                        <span>{getPriorityOption(priority)?.label}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="px-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", option.color)} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description - Editable */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Edit3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">Description</span>
              </div>
              {!isEditingDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
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
                  className="min-h-[60px] resize-none text-sm"
                  placeholder="Add a more detailed description..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-6 px-3 text-xs"
                    onClick={handleSaveDescription}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-3 text-xs"
                    onClick={() => {
                      setDescription(task.description || "")
                      setIsEditingDescription(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm leading-relaxed cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                onClick={() => setIsEditingDescription(true)}
              >
                {description || (
                  <span className="text-muted-foreground">
                    Add a more detailed description...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Activity - Compact */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-3">
              <MessageCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">Activity</span>
            </div>
            
            {/* Add Comment */}
            <div className="flex gap-2 mb-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {getInitials(task.createdBy.firstName, task.createdBy.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                  disabled={isSavingComment}
                />
                {newComment.trim() && (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      className="h-7 px-3 text-xs"
                      onClick={handleSaveComment}
                      disabled={isSavingComment}
                    >
                      {isSavingComment ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => setNewComment("")}
                      disabled={isSavingComment}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center py-4 text-muted-foreground text-xs">
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(comment.user.firstName, comment.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM dd, yyyy • h:mm a')}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-xs">
                No comments yet. Be the first to add one!
              </div>
            )}
          </div>

          {/* Actions - Functional */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-sm font-medium mb-2">Actions</div>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs justify-start"
                onClick={() => {
                  // Focus on assignee dropdown
                  const assigneeSelect = document.querySelector('[data-testid="assignee-select"]')
                  if (assigneeSelect) {
                    (assigneeSelect as HTMLElement).click()
                  }
                }}
              >
                <User className="h-3 w-3 mr-1" />
                Assign
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs justify-start"
                onClick={() => {
                  // Focus on priority dropdown
                  const prioritySelect = document.querySelector('[data-testid="priority-select"]')
                  if (prioritySelect) {
                    (prioritySelect as HTMLElement).click()
                  }
                }}
              >
                <Flag className="h-3 w-3 mr-1" />
                Priority
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs justify-start"
                onClick={() => toast.info("Checklist feature coming soon!")}
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                Checklist
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs justify-start"
                onClick={() => {
                  // Focus on due date picker
                  const dueDateButton = document.querySelector('[data-testid="due-date-button"]')
                  if (dueDateButton) {
                    (dueDateButton as HTMLElement).click()
                  }
                }}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Due Date
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs justify-start"
                onClick={() => toast.info("File attachments coming soon!")}
              >
                <Paperclip className="h-3 w-3 mr-1" />
                Attachment
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-8 text-xs justify-start"
                onClick={handleDeleteTask}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}