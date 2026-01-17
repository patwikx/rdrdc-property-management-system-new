"use client"

import { useCallback, useState } from "react"
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
import { toast } from "sonner"

import { RWOColumn } from "./rwo-column"
import { RWOCard } from "./rwo-card"
import { updateRWOStatus, assignRWO } from "@/lib/actions/rwo-actions"
import type { RWOWithDetails } from "@/lib/types/rwo-types"
import { MaintenanceStatus } from "@prisma/client"

/**
 * RWO Kanban Board Component
 * Implements drag-and-drop with dnd-kit
 * Handles status updates on drop
 * Requirements: 2.2, 2.7, 2.8
 */

interface RWOKanbanBoardProps {
  requests: RWOWithDetails[]
  users?: Array<{ id: string; firstName: string; lastName: string }>
}

// Define the order of columns
const COLUMN_ORDER: MaintenanceStatus[] = [
  MaintenanceStatus.PENDING,
  MaintenanceStatus.ASSIGNED,
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.COMPLETED,
  MaintenanceStatus.CANCELLED,
]

export function RWOKanbanBoard({ requests, users = [] }: RWOKanbanBoardProps) {
  const router = useRouter()
  const [activeRequest, setActiveRequest] = useState<RWOWithDetails | null>(null)
  const [activeColumn, setActiveColumn] = useState<MaintenanceStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Group requests by status
  const requestsByStatus = COLUMN_ORDER.reduce((acc, status) => {
    acc[status] = requests.filter(r => r.status === status)
    return acc
  }, {} as Record<MaintenanceStatus, RWOWithDetails[]>)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const request = requests.find(r => r.id === active.id)
    if (request) {
      setActiveRequest(request)
    }
  }, [requests])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (!event.over) {
      setActiveColumn(null)
      return
    }

    const overId = event.over.id as string

    // Check if we're over a column
    if (COLUMN_ORDER.includes(overId as MaintenanceStatus)) {
      setActiveColumn(overId as MaintenanceStatus)
      return
    }

    // Check if we're over a card - find its column
    const overRequest = requests.find(r => r.id === overId)
    if (overRequest) {
      setActiveColumn(overRequest.status)
    }
  }, [requests])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveRequest(null)
    setActiveColumn(null)
    
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the active request
    const draggedRequest = requests.find(r => r.id === activeId)
    if (!draggedRequest) return

    // Determine the target status
    let targetStatus: MaintenanceStatus | null = null

    // If dropped on a column
    if (COLUMN_ORDER.includes(overId as MaintenanceStatus)) {
      targetStatus = overId as MaintenanceStatus
    } else {
      // If dropped on a card, get that card's status
      const overRequest = requests.find(r => r.id === overId)
      if (overRequest) {
        targetStatus = overRequest.status
      }
    }

    if (!targetStatus || targetStatus === draggedRequest.status) {
      return // No change needed
    }

    // Update the status
    try {
      const result = await updateRWOStatus(activeId, targetStatus)
      
      if (result.status === "error") {
        toast.error(result.error.message)
        return
      }

      toast.success(`RWO moved to ${targetStatus.replace('_', ' ').toLowerCase()}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating RWO status:", error)
      toast.error("Failed to update RWO status")
      router.refresh()
    }
  }, [requests, router])

  const handleStatusChange = useCallback(async (requestId: string, newStatus: string) => {
    try {
      const result = await updateRWOStatus(requestId, newStatus as MaintenanceStatus)
      
      if (result.status === "error") {
        toast.error(result.error.message)
        return
      }

      toast.success(`RWO status updated to ${newStatus.replace('_', ' ').toLowerCase()}`)
      router.refresh()
    } catch (error) {
      console.error("Error updating RWO status:", error)
      toast.error("Failed to update RWO status")
    }
  }, [router])

  const handleAssign = useCallback(async (requestId: string, userId: string | null) => {
    try {
      const result = await assignRWO(requestId, userId)
      
      if (result.status === "error") {
        toast.error(result.error.message)
        return
      }

      toast.success(userId ? "RWO assigned successfully" : "RWO unassigned")
      router.refresh()
    } catch (error) {
      console.error("Error assigning RWO:", error)
      toast.error("Failed to assign RWO")
    }
  }, [router])

  return (
    <div className="h-full w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full">
          {COLUMN_ORDER.map((status) => (
            <RWOColumn
              key={status}
              status={status}
              requests={requestsByStatus[status]}
              isReceiving={activeColumn === status && activeRequest !== null}
              onStatusChange={handleStatusChange}
              onAssign={handleAssign}
              users={users}
            />
          ))}
        </div>

        <DragOverlay>
          {activeRequest ? (
            <div className="rotate-3 opacity-90 w-80">
              <RWOCard request={activeRequest} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
