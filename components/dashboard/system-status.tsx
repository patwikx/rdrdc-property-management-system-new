import { Activity, Database, Server, Cpu } from "lucide-react"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface SystemStatusProps {
  stats: DashboardStats
}

export function SystemStatus({ stats }: SystemStatusProps) {
  const occupancyRate = stats.occupancy.overallRate
  const collectionRate = stats.financial.totalRentCollected > 0 
    ? (stats.financial.totalRentCollected / (stats.financial.totalRentCollected + stats.financial.overduePayments)) * 100 
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      {/* METRIC 1: PROPERTY_INDEX */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 relative group">
        <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
          <Database className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">PROPERTY_INDEX</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter">
            {stats.properties.total.toString().padStart(2, '0')}
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">AREA: {(stats.properties.totalLeasableArea / 1000).toFixed(1)}K SQM</span>
          <div className="h-1 w-12 bg-primary/20">
            <div className="h-full bg-primary w-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* METRIC 2: OCCUPANCY_RATE */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 relative group">
        <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
          <Server className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">OCCUPANCY_RATE</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter text-emerald-600 dark:text-emerald-400">
            {occupancyRate.toFixed(1)}%
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">UNITS: {stats.units.occupied}/{stats.units.total}</span>
          <div className="h-1 w-12 bg-emerald-900/20">
            <div className="h-full bg-emerald-500" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>
      </div>

      {/* METRIC 3: REVENUE_FLOW */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 relative group">
        <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">REVENUE_FLOW</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter text-blue-600 dark:text-blue-400">
            {collectionRate.toFixed(0)}%
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">YTD: ₱{(stats.financial.totalRentCollected / 1000000).toFixed(2)}M</span>
          <div className="h-1 w-12 bg-blue-900/20">
            <div className="h-full bg-blue-500" style={{ width: `${collectionRate}%` }} />
          </div>
        </div>
      </div>

      {/* METRIC 4: SYS_LOAD */}
      <div className="p-4 flex flex-col justify-between h-28 relative group">
        <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
          <Cpu className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">SYS_LOAD</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter text-rose-600 dark:text-rose-400">
            {stats.maintenance.emergency}
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">CRITICAL_TICKETS</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-1 w-1.5 ${i < stats.maintenance.emergency ? 'bg-rose-500' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}