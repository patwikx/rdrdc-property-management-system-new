import { ArrowUpRight, CheckCircle2, AlertTriangle, XCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface PropertyHealthProps {
  stats: DashboardStats
}

export function PropertyHealth({ stats }: PropertyHealthProps) {
  const categories = [
    { label: 'Occupied', count: stats.units.occupied, color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500' },
    { label: 'Vacant', count: stats.units.vacant, color: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle, bg: 'bg-amber-500' },
    { label: 'Maintenance', count: stats.units.maintenance, color: 'text-rose-600 dark:text-rose-400', icon: XCircle, bg: 'bg-rose-500' },
    { label: 'Reserved', count: stats.units.reserved, color: 'text-blue-600 dark:text-blue-400', icon: Home, bg: 'bg-blue-500' },
  ]

  return (
    <div className="border border-border bg-background p-0 flex flex-col h-full relative group">
      <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-primary rounded-none" />
          Unit Status
        </h3>
        <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
      </div>

      <div className="flex-1 p-4 space-y-4">
         {categories.map((cat, i) => {
           const Icon = cat.icon
           return (
             <div key={i} className="flex justify-between items-center border-b border-dashed border-border/50 pb-2 last:border-0 hover:bg-muted/5 transition-colors p-1">
                <div className="flex items-center gap-3">
                   <div className={`h-1 w-1 ${cat.bg} rounded-none`} />
                   <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide flex items-center gap-2">
                      <Icon className={`h-3 w-3 ${cat.color}`} />
                      {cat.label}
                   </span>
                </div>
                <span className="font-mono text-lg leading-none text-foreground font-bold">
                   {cat.count}
                </span>
             </div>
           )
         })}
      </div>

      <div className="p-4 pt-0">
        <Link href="/properties/units" className="block">
          <Button variant="outline" className="w-full rounded-none border-border hover:bg-muted/10 text-xs font-mono uppercase h-8">
             Manage Units <ArrowUpRight className="ml-2 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  )
}