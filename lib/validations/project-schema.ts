import { z } from "zod"
import { TaskPriority, ProjectStatus } from "@prisma/client"

export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters"),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
  startDate: z.date({
    message: "Start date is required",
  }),
  endDate: z.date().optional(),
  boardTemplate: z.string().optional(),
  customColumns: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate >= data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const TaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Task title must be less than 200 characters"),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.date().optional(),
  assignedToId: z.string().optional(),
})

export const UpdateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Task title is required").max(200, "Task title must be less than 200 characters").optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.date().optional(),
  assignedToId: z.string().optional(),
  columnId: z.string().optional(),
  order: z.number().optional(),
})

export const BoardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(100, "Board name must be less than 100 characters"),
})

export const ColumnSchema = z.object({
  name: z.string().min(1, "Column name is required").max(50, "Column name must be less than 50 characters"),
})

export type ProjectFormData = z.infer<typeof ProjectSchema>
export type TaskFormData = z.infer<typeof TaskSchema>
export type UpdateTaskFormData = z.infer<typeof UpdateTaskSchema>
export type BoardFormData = z.infer<typeof BoardSchema>
export type ColumnFormData = z.infer<typeof ColumnSchema>