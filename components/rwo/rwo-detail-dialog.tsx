"use client"

import { format } from "date-fns"
import { 
  Building2, 
  User, 
  CheckCircle2,
  X,
  UserPlus,
  Wrench
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface RWODetailDialogProps {
  request: RWOWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
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
  EMERGENCY: { label: "EMERGENCY", className: "text-rose-600 border-rose-600 bg-rose-50/50" },
  HIGH: { label: "HIGH", className: "text-orange-600 border-orange-600 bg-orange-50/50" },
  MEDIUM: { label: "MEDIUM", className: "text-amber-600 border-amber-600 bg-amber-50/50" },
  LOW: { label: "LOW", className: "text-emerald-600 border-emerald-600 bg-emerald-50/50" }
}

const statusConfig = {
  PENDING: { label: "PENDING", className: "text-amber-600 border-amber-200" },
  ASSIGNED: { label: "ASSIGNED", className: "text-blue-600 border-blue-200" },
  IN_PROGRESS: { label: "WORKING", className: "text-purple-600 border-purple-200" },
  COMPLETED: { label: "DONE", className: "text-emerald-600 border-emerald-200" },
  CANCELLED: { label: "VOID", className: "text-muted-foreground border-border" }
}

export function RWODetailDialog({ 
  request, 
  open, 
  onOpenChange,
  onStatusChange,
  onAssign,
  users = []
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

  const handleAssignChange = async (userId: string) => {
    if (onAssign) {
      await onAssign(request.id, userId === "unassigned" ? null : userId)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-none border-border p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border bg-muted/5 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-tight">
            <Wrench className="h-4 w-4" />
            RWO SPEC SHEET
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">#{request.id.slice(-6)}</span>
          </DialogTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none -mr-2" onClick={() => onOpenChange(false)}>
             <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-4 space-y-6">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between border border-border p-2 bg-muted/5">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Current Status</span>
                <span className={cn("text-lg font-mono font-bold", statusInfo.className.split(" ")[0])}>
                   {statusInfo.label}
                </span>
             </div>
             <div className="h-8 w-px bg-border" />
             <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Priority Level</span>
                <span className={cn("text-lg font-mono font-bold", priorityInfo.className.split(" ")[0])}>
                   {priorityInfo.label}
                </span>
             </div>
          </div>

          {/* Location & Tenant Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Location / Unit</span>
               <div className="flex items-center gap-2 border border-border p-2 bg-background">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                     <span className="font-mono font-bold text-sm leading-none">{request.unit.unitNumber}</span>
                     <span className="text-[10px] text-muted-foreground uppercase truncate w-[140px]">{request.unit.property.propertyName}</span>
                  </div>
               </div>
            </div>
            <div className="space-y-1">
               <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Tenant</span>
               <div className="flex items-center gap-2 border border-border p-2 bg-background">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs font-medium truncate">{request.tenant.businessName}</span>
               </div>
            </div>
          </div>

          {/* Description Block */}
          <div className="space-y-1">
             <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Issue Description</span>
                <Badge variant="outline" className="rounded-none border-border font-mono text-[10px] uppercase">
                   {categoryLabels[request.category]}
                </Badge>
             </div>
             <div className="border border-border p-3 bg-muted/5 text-sm font-mono leading-relaxed min-h-[80px]">
                {request.description}
             </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-0 border border-border divide-x divide-border">
             <div className="p-2 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Created</span>
                <span className="font-mono text-xs font-bold mt-1">{format(new Date(request.createdAt), 'MM/dd/yy')}</span>
             </div>
             <div className="p-2 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Elapsed</span>
                <span className={cn("font-mono text-xs font-bold mt-1", 
                   daysElapsed > 7 ? "text-rose-600" : 
                   daysElapsed > 3 ? "text-amber-600" : "text-foreground"
                )}>{daysElapsed} Days</span>
             </div>
             <div className="p-2 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Assigned</span>
                <span className="font-mono text-xs font-bold mt-1 uppercase">
                   {request.assignedTo ? request.assignedTo.firstName : "---"}
                </span>
             </div>
          </div>

          {/* Assignment Select */}
          {onAssign && users.length > 0 && request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
             <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                   <UserPlus className="h-3 w-3" />
                   Assign To
                </span>
                <Select
                  value={request.assignedTo?.id || "unassigned"}
                  onValueChange={handleAssignChange}
                >
                  <SelectTrigger className="w-full rounded-none border-border font-mono uppercase">
                    <SelectValue placeholder="SELECT USER" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border max-h-[200px]">
                    <SelectItem value="unassigned" className="rounded-none font-mono">
                      UNASSIGNED
                    </SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="rounded-none font-mono">
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          )}

          {/* Status Actions */}
          {onStatusChange && request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
             <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Update Status</span>
                <Select
                  value={request.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-full rounded-none border-border font-mono uppercase">
                    <SelectValue placeholder="UPDATE STATUS" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    {Object.values(MaintenanceStatus).map((status) => (
                      <SelectItem key={status} value={status} className="rounded-none font-mono">
                        {statusConfig[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          )}
          
          {request.status === 'COMPLETED' && request.completedAt && (
             <div className="flex items-center justify-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Completed on {format(new Date(request.completedAt), 'MM/dd/yy')}</span>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
