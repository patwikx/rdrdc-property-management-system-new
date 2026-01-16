"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { cn } from "@/lib/utils"
import { RWOCard } from "./rwo-card"
import type { RWOWithDetails } from "@/lib/types/rwo-types"
import { MaintenanceStatus } from "@prisma/client"

/**
 * RWO Column Component
 * Droppable column for each status
 * Displays column header with count
 * Requirements: 2.2
 */

interface RWOColumnProps {
  status: MaintenanceStatus
  requests: RWOWithDetails[]
  isReceiving?: boolean
  onStatusChange?: (requestId: string, newStatus: string) => Promise<void>
}

const statusConfig: Record<MaintenanceStatus, { 
  label: string
  bgColor: string
  borderColor: string
  headerBg: string
}> = {
  PENDING: { 
    label: "Pending", 
    bgColor: "bg-yellow-50/50",
    borderColor: "border-yellow-200",
    headerBg: "bg-yellow-100"
  },
  ASSIGNED: { 
    label: "Assigned", 
    bgColor: "bg-blue-50/50",
    borderColor: "border-blue-200",
    headerBg: "bg-blue-100"
  },
  IN_PROGRESS: { 
    label: "In Progress", 
    bgColor: "bg-purple-50/50",
    borderColor: "border-purple-200",
    headerBg: "bg-purple-100"
  },
  COMPLETED: { 
    label: "Completed", 
    bgColor: "bg-green-50/50",
    borderColor: "border-green-200",
    headerBg: "bg-green-100"
  },
  CANCELLED: { 
    label: "Cancelled", 
    bgColor: "bg-gray-50/50",
    borderColor: "border-gray-200",
    headerBg: "bg-gray-100"
  }
}

export function RWOColumn({ 
  status, 
  requests, 
  isReceiving,
  onStatusChange 
}: RWOColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  })

  const config = statusConfig[status]

  return (
    <div className="w-80 flex-shrink-0 flex flex-col">
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between mb-3 px-3 py-2 rounded-t-lg",
        config.headerBg
      )}>
        <h3 className="font-semibold text-sm uppercase tracking-wide">
          {config.label}
        </h3>
        <span className="text-xs font-medium bg-white/80 rounded-full px-2 py-0.5">
          {requests.length}
        </span>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-3 p-2 rounded-b-lg border-2 border-dashed min-h-[400px] transition-all duration-200",
          config.bgColor,
          config.borderColor,
          isReceiving && "ring-2 ring-primary ring-offset-2 bg-primary/5"
        )}
      >
        <SortableContext 
          items={requests.map(r => r.id)} 
          strategy={verticalListSortingStrategy}
        >
          {requests.map((request) => (
            <RWOCard 
              key={request.id} 
              request={request}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>

        {requests.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            No RWOs in this status
          </div>
        )}
      </div>
    </div>
  )
}
