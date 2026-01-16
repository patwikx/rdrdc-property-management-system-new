"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, 
  Clock, 
  FileText,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Gift
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { UpcomingTask, Lease, Anniversary } from "@/lib/types/dashboard-types"

interface ManagementConsoleProps {
  tasks: UpcomingTask[]
  leases: Lease[]
  anniversaries: Anniversary[]
}

export function ManagementConsole({ tasks, leases, anniversaries }: ManagementConsoleProps) {
  const [activeTab, setActiveTab] = useState<'TASKS' | 'LEASES' | 'ANNIVERSARIES'>('LEASES')

  return (
    <div className="border border-border bg-background h-[600px] flex flex-col font-mono text-sm relative">
      {/* HEADER BAR */}
      <div className="border-b border-border bg-muted/10 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-primary rounded-none" />
          <span className="uppercase tracking-widest text-[10px] font-bold text-foreground">Management Console</span>
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-border divide-x divide-border">
        <button 
          onClick={() => setActiveTab('LEASES')}
          className={cn(
            "flex-1 py-3 text-xs uppercase tracking-wider hover:bg-muted/5 transition-colors flex items-center justify-center gap-2 relative",
            activeTab === 'LEASES' ? "bg-background font-bold text-foreground" : "bg-muted/5 text-muted-foreground"
          )}
        >
          {activeTab === 'LEASES' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500" />}
          <FileText className="h-3.5 w-3.5" />
          Expiring Leases ({leases.length})
        </button>
        <button 
          onClick={() => setActiveTab('TASKS')}
          className={cn(
            "flex-1 py-3 text-xs uppercase tracking-wider hover:bg-muted/5 transition-colors flex items-center justify-center gap-2 relative",
            activeTab === 'TASKS' ? "bg-background font-bold text-foreground" : "bg-muted/5 text-muted-foreground"
          )}
        >
          {activeTab === 'TASKS' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
          <ClipboardList className="h-3.5 w-3.5" />
          My Tasks ({tasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('ANNIVERSARIES')}
          className={cn(
            "flex-1 py-3 text-xs uppercase tracking-wider hover:bg-muted/5 transition-colors flex items-center justify-center gap-2 relative",
            activeTab === 'ANNIVERSARIES' ? "bg-background font-bold text-foreground" : "bg-muted/5 text-muted-foreground"
          )}
        >
          {activeTab === 'ANNIVERSARIES' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-pink-500" />}
          <Gift className="h-3.5 w-3.5" />
          Anniversaries ({anniversaries.length})
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-0 bg-background">
        
        {/* LEASES LIST */}
        {activeTab === 'LEASES' && (
           <div className="divide-y divide-border/50">
              {leases.length === 0 ? (
                 <div className="p-12 text-center text-muted-foreground uppercase tracking-widest text-xs">No expiring leases</div>
              ) : (
                 leases.map(lease => (
                    <div key={lease.id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors group">
                       <div className="flex flex-col min-w-0 pr-4">
                          <span className="text-xs font-bold uppercase truncate text-foreground mb-1">
                             {lease.tenant.company || `${lease.tenant.firstName} ${lease.tenant.lastName}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                             <FileText className="h-3 w-3" />
                             {lease.leaseUnits[0]?.unit.property.propertyName} • Unit {lease.leaseUnits[0]?.unit.unitNumber}
                          </span>
                       </div>
                       <div className="text-right shrink-0">
                          <span className="block text-xs font-mono font-bold text-orange-600">
                             {format(new Date(lease.endDate), 'yyyy-MM-dd')}
                          </span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">Expires</span>
                       </div>
                    </div>
                 ))
              )}
           </div>
        )}

        {/* TASKS LIST */}
        {activeTab === 'TASKS' && (
          <div className="divide-y divide-border/50">
             {tasks.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                   <CheckCircle2 className="h-8 w-8 mb-3 opacity-20" />
                   <p className="uppercase tracking-widest text-xs">No pending tasks</p>
                </div>
             ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-muted/5 flex items-start gap-4 group transition-colors">
                     <div className={`mt-1 h-2 w-2 rounded-none shrink-0 ${
                        task.priority === 'URGENT' ? 'bg-rose-500' : 
                        task.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'
                     }`} />
                     
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <span className="font-medium text-sm text-foreground truncate pr-2">{task.title}</span>
                           <span className="text-[10px] bg-muted px-1.5 py-0.5 text-muted-foreground uppercase tracking-wider rounded-sm shrink-0">
                              {task.status.replace('_', ' ')}
                           </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                           <span className={cn("flex items-center gap-1.5", 
                              (task.priority === 'URGENT' || task.priority === 'HIGH') ? "text-rose-600 font-medium" : ""
                           )}>
                              <Clock className="h-3 w-3" />
                              Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                           </span>
                           <span className="text-[10px] uppercase opacity-70 border border-border px-1 rounded-sm">
                              {task.priority}
                           </span>
                        </div>
                     </div>
                     <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
             )}
          </div>
        )}

        {/* ANNIVERSARIES LIST */}
        {activeTab === 'ANNIVERSARIES' && (
           <table className="w-full text-left text-xs">
              <thead className="bg-muted/10 border-b border-border font-mono text-muted-foreground sticky top-0">
                 <tr>
                    <th className="p-3 font-medium uppercase tracking-wider pl-4">Tenant</th>
                    <th className="p-3 font-medium uppercase tracking-wider text-right">Years</th>
                    <th className="p-3 font-medium uppercase tracking-wider text-right pr-4">Date</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                 {anniversaries.length === 0 ? (
                    <tr>
                       <td colSpan={3} className="p-12 text-center text-muted-foreground uppercase tracking-widest">No upcoming anniversaries</td>
                    </tr>
                 ) : (
                    anniversaries.map((anniversary) => (
                       <tr key={anniversary.id} className="hover:bg-muted/5 group transition-colors">
                          <td className="p-3 pl-4">
                             <div className="font-medium text-foreground">{anniversary.tenant.company || anniversary.tenant.lastName}</div>
                             <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {anniversary.unit?.property.propertyName} {anniversary.unit?.unitNumber}
                             </div>
                          </td>
                          <td className="p-3 text-right font-mono font-medium">
                             <Badge variant="outline" className="rounded-none border-pink-500/50 text-pink-600 bg-pink-500/5">
                                {anniversary.years} YRS
                             </Badge>
                          </td>
                          <td className="p-3 pr-4 text-right font-mono text-muted-foreground">
                             {format(new Date(anniversary.date), 'MMM dd')}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        )}
      </div>
    </div>
  )
}