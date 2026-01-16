"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  Building2, 
  User, 
  Calendar,
  Clock,
  Flame,
  AlertTriangle,
  Wrench
} from "lucide-react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getDaysElapsed } from "@/lib/utils/date-helpers"
import type { RWOWithDetails } from "@/lib/types/rwo-types"
import { RWODetailDialog } from "./rwo-detail-dialog"

/**
 * RWO Card Component
 * Displays space, property, category, priority indicator, description
 * Shows assigned staff, creation date, days elapsed
 * Draggable with dnd-kit
 * Requirements: 2.3, 2.4, 2.11, 2.12
 */

interface RWOCardProps {
  request: RWOWithDetails
  onStatusChange?: (requestId: string, newStatus: string) => Promise<void>
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
    label: "Emergency", 
    className: "bg-red-500 text-white border-red-500",
    icon: Flame
  },
  HIGH: { 
    label: "High", 
    className: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertTriangle
  },
  MEDIUM: { 
    label: "Medium", 
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: null
  },
  LOW: { 
    label: "Low", 
    className: "bg-green-100 text-green-700 border-green-200",
    icon: null
  }
}

export function RWOCard({ request, onStatusChange }: RWOCardProps) {
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
  const PriorityIcon = priorityInfo.icon

  const isHighPriority = request.priority === 'EMERGENCY' || request.priority === 'HIGH'

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative p-3 rounded-lg border bg-background",
          "cursor-grab active:cursor-grabbing transition-all duration-200",
          "hover:shadow-md hover:border-border",
          isDragging && "opacity-50 rotate-2 shadow-lg scale-105",
          isHighPriority && "border-l-4",
          request.priority === 'EMERGENCY' && "border-l-red-500",
          request.priority === 'HIGH' && "border-l-orange-500"
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
        <div className="space-y-3">
          {/* Header: Space & Property */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{request.unit.unitNumber}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {request.unit.property.propertyName}
              </p>
            </div>
            
            {/* Priority Badge */}
            <Badge 
              variant="outline" 
              className={cn("flex-shrink-0 text-xs", priorityInfo.className)}
            >
              {PriorityIcon && <PriorityIcon className="h-3 w-3 mr-1" />}
              {priorityInfo.label}
            </Badge>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {categoryLabels[request.category] || request.category}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm line-clamp-2 leading-relaxed">
            {request.description}
          </p>

          {/* Footer: Assigned, Date, Days Elapsed */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {/* Assigned Staff */}
              {request.assignedTo ? (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{request.assignedTo.firstName} {request.assignedTo.lastName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-600">
                  <User className="h-3 w-3" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {/* Creation Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(request.createdAt), 'MMM dd')}</span>
              </div>

              {/* Days Elapsed */}
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                daysElapsed > 7 && "bg-red-50 text-red-600",
                daysElapsed > 3 && daysElapsed <= 7 && "bg-yellow-50 text-yellow-600"
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
      />
    </>
  )
}
