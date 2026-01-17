"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { cn } from "@/lib/utils"
import { RWOCard } from "./rwo-card"
import type { RWOWithDetails } from "@/lib/types/rwo-types"
import { MaintenanceStatus } from "@prisma/client"

interface RWOColumnProps {
  status: MaintenanceStatus
  requests: RWOWithDetails[]
  isReceiving?: boolean
  onStatusChange?: (requestId: string, newStatus: string) => Promise<void>
  onAssign?: (requestId: string, userId: string | null) => Promise<void>
  users?: Array<{ id: string; firstName: string; lastName: string }>
}

const statusConfig: Record<MaintenanceStatus, { 
  label: string
  borderColor: string
  indicatorColor: string
}> = {
  PENDING: { 
    label: "Pending", 
    borderColor: "border-amber-500/50",
    indicatorColor: "bg-amber-500"
  },
  ASSIGNED: { 
    label: "Assigned", 
    borderColor: "border-blue-500/50",
    indicatorColor: "bg-blue-500"
  },
  IN_PROGRESS: { 
    label: "In Progress", 
    borderColor: "border-purple-500/50",
    indicatorColor: "bg-purple-500"
  },
  COMPLETED: { 
    label: "Completed", 
    borderColor: "border-emerald-500/50",
    indicatorColor: "bg-emerald-500"
  },
  CANCELLED: { 
    label: "Cancelled", 
    borderColor: "border-muted",
    indicatorColor: "bg-muted-foreground"
  }
}

export function RWOColumn({ 
  status, 
  requests, 
  isReceiving,
  onStatusChange,
  onAssign,
  users
}: RWOColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  })

  const config = statusConfig[status]

  return (
    <div className="w-full min-w-0 flex-shrink-0 flex flex-col h-full">
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between mb-2 px-3 py-2 border-b-2 bg-background",
        config.borderColor
      )}>
        <div className="flex items-center gap-2">
           <div className={cn("h-2 w-2 rounded-none", config.indicatorColor)} />
           <h3 className="font-bold text-xs uppercase tracking-widest text-foreground">
             {config.label}
           </h3>
        </div>
        <span className="text-xs font-mono font-bold text-muted-foreground">
          {requests.length}
        </span>
      </div>

      {/* Cards Container - Scrollable with fixed height */}
      <div 
        className={cn(
          "flex-1 border-border/50 max-h-[calc(100vh-24rem)] overflow-y-auto",
          isReceiving && "bg-muted/10 ring-1 ring-primary/20"
        )}
      >
        <div
          ref={setNodeRef}
          className="space-y-3 p-1 min-h-[150px]"
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
                onAssign={onAssign}
                users={users}
              />
            ))}
          </SortableContext>

          {requests.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 border border-dashed border-border/50 bg-muted/5">
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Empty</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
