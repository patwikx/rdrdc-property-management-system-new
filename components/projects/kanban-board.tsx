"use client"

import { useCallback, useEffect, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
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
  const board = project.boards?.[0] // Using the first board for now
  
  const [columns, setColumns] = useState<Column[]>(
    (board?.columns || []).map(col => ({
      ...col,
      tasks: (col.tasks || []).filter(task => task && task.id).sort((a, b) => a.order - b.order)
    }))
  )
  
  const [activeTask, setActiveTask] = useState<Task | null>(null)

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
    } catch (error) {
      console.error("Error in handleDragStart:", error)
      setActiveTask(null)
    }
  }, [columns])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    try {
      const { active, over } = event
      
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // Find the active task and its column
      const activeColumn = columns.find(col => 
        col.tasks && col.tasks.some(task => task && task.id === activeId)
      )
      const activeTask = activeColumn?.tasks?.find(task => task && task.id === activeId)
      
      if (!activeTask || !activeColumn) return

      // Find the over column (either by column id or task id)
      let overColumn = columns.find(col => col.id === overId)
      if (!overColumn) {
        overColumn = columns.find(col => 
          col.tasks && col.tasks.some(task => task && task.id === overId)
        )
      }
      
      if (!overColumn || activeColumn.id === overColumn.id) return

      // Move task between columns
      setColumns(prevColumns => {
        try {
          const newColumns = [...prevColumns]
          
          // Remove task from active column
          const activeColIndex = newColumns.findIndex(col => col.id === activeColumn.id)
          if (activeColIndex === -1 || !newColumns[activeColIndex].tasks) return prevColumns
          
          const activeTaskIndex = newColumns[activeColIndex].tasks.findIndex(task => task && task.id === activeId)
          if (activeTaskIndex === -1) return prevColumns
          
          const [movedTask] = newColumns[activeColIndex].tasks.splice(activeTaskIndex, 1)
          if (!movedTask) return prevColumns
          
          // Add task to over column
          const overColIndex = newColumns.findIndex(col => col.id === overColumn.id)
          if (overColIndex === -1) return prevColumns
          
          if (!newColumns[overColIndex].tasks) {
            newColumns[overColIndex].tasks = []
          }
          
          let insertIndex = newColumns[overColIndex].tasks.length
          
          // If dropping on a specific task, insert before it
          if (overId !== overColumn.id) {
            const overTaskIndex = newColumns[overColIndex].tasks.findIndex(task => task && task.id === overId)
            if (overTaskIndex !== -1) {
              insertIndex = overTaskIndex
            }
          }
          
          newColumns[overColIndex].tasks.splice(insertIndex, 0, movedTask)
          
          return newColumns
        } catch (error) {
          console.error("Error in setColumns:", error)
          return prevColumns
        }
      })
    } catch (error) {
      console.error("Error in handleDragOver:", error)
    }
  }, [columns])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveTask(null)
    
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the active task and its current column
    const activeColumn = columns.find(col => 
      col.tasks && col.tasks.some(task => task && task.id === activeId)
    )
    const activeTask = activeColumn?.tasks?.find(task => task && task.id === activeId)
    
    if (!activeTask || !activeColumn || !activeColumn.tasks) return

    // Find the destination column
    let overColumn = columns.find(col => col.id === overId)
    if (!overColumn) {
      overColumn = columns.find(col => 
        col.tasks && col.tasks.some(task => task && task.id === overId)
      )
    }
    
    if (!overColumn || !overColumn.tasks) return

    const activeTaskIndex = activeColumn.tasks.findIndex(task => task && task.id === activeId)
    const overTaskIndex = overColumn.tasks.findIndex(task => task && task.id === overId)
    
    if (activeTaskIndex === -1) return

    if (activeColumn.id === overColumn.id) {
      // Reordering within the same column
      if (activeTaskIndex !== overTaskIndex && overTaskIndex !== -1) {
        const newTasks = arrayMove(activeColumn.tasks, activeTaskIndex, overTaskIndex)
        const taskIds = newTasks.filter(task => task && task.id).map(task => task.id)
        
        try {
          await reorderTasks(activeColumn.id, taskIds)
          toast.success("Tasks reordered successfully")
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          toast.error("Failed to reorder tasks")
          // Revert the change
          setColumns(prevColumns => {
            const newColumns = [...prevColumns]
            const colIndex = newColumns.findIndex(col => col.id === activeColumn.id)
            if (colIndex !== -1 && newColumns[colIndex].tasks) {
              newColumns[colIndex].tasks = arrayMove(newColumns[colIndex].tasks, overTaskIndex, activeTaskIndex)
            }
            return newColumns
          })
        }
      }
    } else {
      // Moving between columns
      const destinationIndex = overTaskIndex === -1 ? overColumn.tasks.length : overTaskIndex
      
      try {
        await moveTask(activeId, activeColumn.id, overColumn.id, destinationIndex)
        toast.success("Task moved successfully")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to move task")
        // Revert the change by resetting columns from project data
        setColumns(
          (board?.columns || []).map(col => ({
            ...col,
            tasks: (col.tasks || []).sort((a, b) => a.order - b.order)
          }))
        )
      }
    }
  }, [columns, board?.columns])

  // Ensure columns state is always valid
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
  
  // Early return AFTER all hooks have been called
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