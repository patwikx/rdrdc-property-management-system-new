import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface MaintenanceLogProps {
  stats: DashboardStats
}

export function MaintenanceLog({ stats }: MaintenanceLogProps) {
  const categories = [
    { label: 'Emergency', count: stats.maintenance.emergency, color: 'bg-rose-500' },
    { label: 'Pending', count: stats.maintenance.pending, color: 'bg-amber-500' },
    { label: 'In Progress', count: stats.maintenance.inProgress, color: 'bg-blue-500' },
    { label: 'Completed', count: stats.maintenance.completed, color: 'bg-emerald-500' },
  ]

  return (
    <div className="border border-border bg-background p-0 flex flex-col h-full relative">
      <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-orange-500 rounded-none" />
          Maintenance Log
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">Status</span>
      </div>

      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
         {categories.map((cat, i) => (
           <div key={i} className="border border-border p-3 flex flex-col justify-between hover:bg-muted/5 transition-colors">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">{cat.label}</span>
                 <div className={`h-1.5 w-1.5 ${cat.color} rounded-none`} />
              </div>
              <span className="text-2xl font-mono leading-none">{cat.count}</span>
           </div>
         ))}
      </div>

      <div className="p-4 pt-0">
        <Link href="/rwo" className="block">
          <Button variant="outline" className="w-full rounded-none border-border hover:bg-muted/10 text-xs font-mono uppercase h-8">
             Access Requests <ArrowUpRight className="ml-2 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  )
}