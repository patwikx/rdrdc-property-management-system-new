"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TaskSchema, TaskFormData } from "@/lib/validations/project-schema"
import { createTask } from "@/lib/actions/project-actions"
import { TaskPriority } from "@prisma/client"

interface ProjectMember {
  id: string
  name: string
}

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  columnId: string
  projectMembers: ProjectMember[]
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

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  columnId, 
  projectMembers 
}: CreateTaskDialogProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: TaskPriority.MEDIUM,
    },
  })

  const getPriorityOption = (value: TaskPriority) => {
    return priorityOptions.find(option => option.value === value)
  }

  async function onSubmit(data: TaskFormData) {
    try {
      const result = await createTask({
        ...data,
        projectId,
        columnId,
      })
      
      if (result.error) {
        toast.error(result.error)
        console.error("Task creation error:", result.error)
      } else {
        toast.success(result.success)
        onOpenChange(false)
        form.reset()
      }
    } catch (error) {
      console.error("Task creation error:", error)
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-none border-border p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border bg-muted/5">
          <DialogTitle className="text-sm font-bold uppercase tracking-widest">New Task Entry</DialogTitle>
          <DialogDescription className="text-xs font-mono uppercase text-muted-foreground">
            Define task parameters
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest">Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="TASK TITLE" {...field} className="rounded-none border-border h-9 font-mono text-xs uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="ENTER DETAILS..."
                      className="resize-none rounded-none border-border font-mono text-xs uppercase min-h-[80px]"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest">Priority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-none border-border h-9 text-xs font-mono uppercase">
                          <SelectValue placeholder="SELECT PRIORITY">
                            {field.value && getPriorityOption(field.value) && (
                              <div className="flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-none", getPriorityOption(field.value)?.color)} />
                                <span>{getPriorityOption(field.value)?.label}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-border">
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs font-mono uppercase">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-none", option.color)} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest">Assignee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-none border-border h-9 text-xs font-mono uppercase">
                          <SelectValue placeholder="SELECT MEMBER" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-none border-border">
                        <SelectItem value="unassigned" className="text-xs font-mono uppercase">UNASSIGNED</SelectItem>
                        {projectMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id} className="text-xs font-mono uppercase">
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest">Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal rounded-none border-border h-9 text-xs font-mono uppercase",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>PICK DATE</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        className="rounded-none"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-none h-8 text-[10px] font-bold uppercase tracking-wider border-border"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-none h-8 text-[10px] font-bold uppercase tracking-wider">
                <Plus className="mr-2 h-3 w-3" />
                Create Task
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}