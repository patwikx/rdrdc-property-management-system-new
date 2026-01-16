"use client"

import { format } from "date-fns"
import { 
  Building2, 
  User, 
  Calendar,
  Clock,
  Wrench,
  FileText,
  CheckCircle2
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getDaysElapsed } from "@/lib/utils/date-helpers"
import type { RWOWithDetails } from "@/lib/types/rwo-types"
import { MaintenanceStatus } from "@prisma/client"

/**
 * RWO Detail Dialog Component
 * Displays full RWO information and history
 * Allows status changes from dialog
 * Requirements: 2.10
 */

interface RWODetailDialogProps {
  request: RWOWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
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
  EMERGENCY: { label: "Emergency", className: "bg-red-500 text-white" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  LOW: { label: "Low", className: "bg-green-100 text-green-700" }
}

const statusConfig = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-700" }
}

export function RWODetailDialog({ 
  request, 
  open, 
  onOpenChange,
  onStatusChange 
}: RWODetailDialogProps) {
  if (!request) return null

  const daysElapsed = getDaysElapsed(request.createdAt)
  const priorityInfo = priorityConfig[request.priority]
  const statusInfo = statusConfig[request.status]

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(request.id, newStatus)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            RWO Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Priority Badges */}
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", statusInfo.className)}>
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", priorityInfo.className)}>
              {priorityInfo.label} Priority
            </Badge>
          </div>

          {/* Space & Property Info */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.unit.unitNumber}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {request.unit.property.propertyName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Tenant: {request.tenant.businessName}</span>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Category:</span>
            <span className="text-sm">{categoryLabels[request.category]}</span>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Description</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {request.description}
            </p>
          </div>

          <Separator />

          {/* Timeline Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created</span>
              </div>
              <p className="pl-6 font-medium">
                {format(new Date(request.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Days Elapsed</span>
              </div>
              <p className={cn(
                "pl-6 font-medium",
                daysElapsed > 7 && "text-red-600",
                daysElapsed > 3 && daysElapsed <= 7 && "text-yellow-600"
              )}>
                {daysElapsed} days
              </p>
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Assigned To</span>
            </div>
            <p className="pl-6 text-sm font-medium">
              {request.assignedTo 
                ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                : <span className="text-yellow-600">Unassigned</span>
              }
            </p>
          </div>

          {/* Completed Date (if applicable) */}
          {request.completedAt && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Completed</span>
              </div>
              <p className="pl-6 text-sm font-medium text-green-600">
                {format(new Date(request.completedAt), 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          <Separator />

          {/* Status Change */}
          {onStatusChange && request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Change Status</label>
              <Select
                value={request.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaintenanceStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
