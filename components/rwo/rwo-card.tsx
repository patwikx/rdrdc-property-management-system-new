"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  Building2, 
  User, 
  Calendar,
  Clock,
  AlertTriangle
} from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { getDaysElapsed } from "@/lib/utils/date-helpers"
import type { RWOWithDetails } from "@/lib/types/rwo-types"
import { RWODetailDialog } from "./rwo-detail-dialog"

interface RWOCardProps {
  request: RWOWithDetails
  onStatusChange?: (requestId: string, newStatus: string) => Promise<void>
  onAssign?: (requestId: string, userId: string | null) => Promise<void>
  users?: Array<{ id: string; firstName: string; lastName: string }>
}

const categoryLabels: Record<string, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  HVAC: "HVAC",
  APPLIANCE: "Appliance",
  STRUCTURAL: "Structural",
  OTHER: "Other"
}

const priorityConfig = {
  EMERGENCY: { 
    label: "EMERGENCY", 
    borderColor: "border-l-rose-600",
    textColor: "text-rose-600"
  },
  HIGH: { 
    label: "HIGH", 
    borderColor: "border-l-orange-500",
    textColor: "text-orange-600"
  },
  MEDIUM: { 
    label: "MEDIUM", 
    borderColor: "border-l-amber-500",
    textColor: "text-amber-600"
  },
  LOW: { 
    label: "LOW", 
    borderColor: "border-l-emerald-500",
    textColor: "text-emerald-600"
  }
}

export function RWOCard({ request, onStatusChange, onAssign, users }: RWOCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: request.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const daysElapsed = getDaysElapsed(request.createdAt)
  const priorityInfo = priorityConfig[request.priority]

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative border border-border bg-background p-3 transition-all hover:shadow-md",
          "cursor-grab active:cursor-grabbing",
          "border-l-[3px]", 
          priorityInfo.borderColor,
          isDragging && "opacity-50 rotate-1 scale-105 shadow-xl z-50",
        )}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          if (!isDragging) {
            e.stopPropagation()
            setIsDetailOpen(true)
          }
        }}
      >
        <div className="space-y-2">
          {/* Header: ID & Priority */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">#{request.id.slice(-6)}</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", priorityInfo.textColor)}>
              {priorityInfo.label}
            </span>
          </div>

          {/* Title/Space */}
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
               <Building2 className="h-3 w-3 text-muted-foreground" />
               <span className="font-mono text-xs font-bold">{request.unit.unitNumber}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
               <User className="h-3 w-3 text-muted-foreground" />
               <span className="text-[10px] uppercase tracking-wide text-muted-foreground truncate max-w-[150px]" title={request.tenant.businessName}>
                 {request.tenant.businessName}
               </span>
            </div>
            <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground/90">
              {request.description}
            </p>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-none text-[10px] uppercase font-medium bg-muted text-muted-foreground tracking-wide">
              {categoryLabels[request.category]}
            </span>
          </div>

          {/* Footer Metrics */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/50">
             <div className="flex items-center gap-2">
                {request.assignedTo ? (
                  <div className="flex items-center gap-1" title={`Assigned to ${request.assignedTo.firstName}`}>
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase font-medium text-muted-foreground">
                      {request.assignedTo.firstName}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] uppercase text-amber-600 font-bold tracking-wider">Unassigned</span>
                )}
             </div>

             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                   <Calendar className="h-3 w-3" />
                   <span className="text-[10px] font-mono">{format(new Date(request.createdAt), 'MM/dd')}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-mono font-bold",
                  daysElapsed > 7 ? "text-rose-600" : "text-muted-foreground"
                )}>
                   <Clock className="h-3 w-3" />
                   <span>{daysElapsed}d</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <RWODetailDialog
        request={request}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onStatusChange={onStatusChange}
        onAssign={onAssign}
        users={users}
      />
    </>
  )
}
