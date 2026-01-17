"use client"

import { 
  Clock, 
  Users,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity
} from "lucide-react"
import type { RWOSummary as RWOSummaryType } from "@/lib/types/rwo-types"

interface RWOSummaryProps {
  summary: RWOSummaryType
}

export function RWOSummary({ summary }: RWOSummaryProps) {
  const { statusCounts, priorityCounts, totalOpen } = summary

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      {/* Total Open */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active Requests</span>
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-foreground">{totalOpen}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Open Tickets</span>
        </div>
      </div>

      {/* Pending / In Progress */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Workload</span>
          <Users className="h-4 w-4 text-blue-600/50" />
        </div>
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-3xl font-mono font-medium tracking-tighter text-blue-600">{statusCounts.IN_PROGRESS}</span>
            <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wide">Working</span>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div>
            <span className="text-xl font-mono font-medium tracking-tighter text-amber-600">{statusCounts.PENDING}</span>
            <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wide">Pending</span>
          </div>
        </div>
      </div>

      {/* Critical / High Priority */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Critical Items</span>
          <Flame className="h-4 w-4 text-rose-600/50" />
        </div>
        <div className="flex items-baseline gap-4">
          <div>
             <span className="text-3xl font-mono font-medium tracking-tighter text-rose-600">{priorityCounts.EMERGENCY}</span>
             <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wide">Emerg.</span>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div>
             <span className="text-xl font-mono font-medium tracking-tighter text-orange-600">{priorityCounts.HIGH}</span>
             <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wide">High</span>
          </div>
        </div>
      </div>

      {/* Completed */}
      <div className="p-4 flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Performance</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-emerald-600">{statusCounts.COMPLETED}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Resolved</span>
        </div>
      </div>
    </div>
  )
}
