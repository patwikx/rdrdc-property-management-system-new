"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { toast } from "sonner"

import { ProjectWithDetails, moveTask, reorderTasks } from "@/lib/actions/project-actions"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"

interface KanbanBoardProps {
  project: ProjectWithDetails
}

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

export function KanbanBoard({ project }: KanbanBoardProps) {
  const router = useRouter()
  const board = project.boards?.[0]
  
  const [columns, setColumns] = useState<Column[]>(
    (board?.columns || []).map(col => ({
      ...col,
      tasks: (col.tasks || []).filter(task => task && task.id).sort((a, b) => a.order - b.order)
    }))
  )
  
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    try {
      const { active } = event
      const task = columns
        .flatMap(col => col.tasks || [])
        .find(task => task && task.id === active.id)
      
      if (task) {
        setActiveTask(task)
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setActiveTask(null)
    }
  }, [columns])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (!event.over) {
      setActiveColumn(null)
      return
    }

    const overId = event.over.id as string

    // Find which column we're over
    const overColumn = columns.find(col => col.id === overId) ||
      columns.find(col => col.tasks && col.tasks.some(task => task && task.id === overId))

    if (overColumn) {
      setActiveColumn(overColumn.id)
    }
  }, [columns])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveTask(null)
    setActiveColumn(null)
    
    if (!over) {
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Use the ORIGINAL board data to find columns
    const originalColumns = (board?.columns || []).map(col => ({
      ...col,
      tasks: (col.tasks || []).filter(task => task && task.id).sort((a, b) => a.order - b.order)
    }))

    // Find which column the active task is ACTUALLY in (from server data)
    const activeColumn = originalColumns.find(col => 
      col.tasks && col.tasks.some(task => task && task.id === activeId)
    )
    const activeTask = activeColumn?.tasks?.find(task => task && task.id === activeId)
    
    if (!activeTask || !activeColumn || !activeColumn.tasks) {
      return
    }

    // Find which column we're dropping into
    let overColumn = originalColumns.find(col => col.id === overId)
    if (!overColumn) {
      overColumn = originalColumns.find(col => 
        col.tasks && col.tasks.some(task => task && task.id === overId)
      )
    }
    
    if (!overColumn || !overColumn.tasks) {
      return
    }

    const activeTaskIndex = activeColumn.tasks.findIndex(task => task && task.id === activeId)
    const overTaskIndex = overColumn.tasks.findIndex(task => task && task.id === overId)
    
    if (activeTaskIndex === -1) {
      return
    }

    if (activeColumn.id === overColumn.id) {
      // Reordering within the same column
      if (activeTaskIndex !== overTaskIndex && overTaskIndex !== -1) {
        const newTasks = arrayMove(activeColumn.tasks, activeTaskIndex, overTaskIndex)
        const taskIds = newTasks.filter(task => task && task.id).map(task => task.id)
        
        try {
          const result = await reorderTasks(activeColumn.id, taskIds)
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success("Tasks reordered successfully")
          }
          router.refresh()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          toast.error("Failed to reorder tasks")
          router.refresh()
        }
      }
    } else {
      // Moving between columns
      const destinationIndex = overTaskIndex === -1 ? overColumn.tasks.length : overTaskIndex
      
      try {
        const result = await moveTask(activeId, activeColumn.id, overColumn.id, destinationIndex)
        
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Task moved successfully")
        }
        router.refresh()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to move task")
        router.refresh()
      }
    }
  }, [board?.columns, router])

  useEffect(() => {
    if (board?.columns) {
      setColumns(
        board.columns.map(col => ({
          ...col,
          tasks: (col.tasks || []).filter(task => task && task.id).sort((a, b) => a.order - b.order)
        }))
      )
    }
  }, [board])
  
  if (!board) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No board found for this project.</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-muted/20 rounded-lg p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4 h-full">
          <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                projectId={project.id}
                projectMembers={[
                  { id: project.owner.id, name: `${project.owner.firstName} ${project.owner.lastName}` },
                  ...project.members.map(member => ({
                    id: member.user.id,
                    name: `${member.user.firstName} ${member.user.lastName}`
                  }))
                ]}
                isReceiving={activeColumn === column.id && activeTask !== null}
              />
            ))}
          </SortableContext>
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}