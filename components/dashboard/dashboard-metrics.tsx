import { Building2, Users, DollarSign, Activity } from "lucide-react"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface DashboardMetricsProps {
  stats: DashboardStats
}

export function DashboardMetrics({ stats }: DashboardMetricsProps) {
  const occupancyRate = stats.occupancy.overallRate
  const collectionRate = stats.financial.totalRentCollected > 0 
    ? (stats.financial.totalRentCollected / (stats.financial.totalRentCollected + stats.financial.overduePayments)) * 100 
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      {/* METRIC 1: PROPERTIES */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 relative group hover:bg-muted/5 transition-colors">
        <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Properties</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter text-foreground">
            {stats.properties.total}
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">{(stats.properties.totalLeasableArea / 1000).toFixed(1)}k SQM Area</span>
          <div className="h-1 w-12 bg-primary/20">
            <div className="h-full bg-primary w-full" />
          </div>
        </div>
      </div>

      {/* METRIC 2: OCCUPANCY */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 relative group hover:bg-muted/5 transition-colors">
        <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Occupancy Rate</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter text-emerald-600 dark:text-emerald-400">
            {occupancyRate.toFixed(1)}%
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">{stats.units.occupied}/{stats.units.total} Units</span>
          <div className="h-1 w-12 bg-emerald-900/20">
            <div className="h-full bg-emerald-500" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>
      </div>

      {/* METRIC 3: COLLECTION */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 relative group hover:bg-muted/5 transition-colors">
        <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Collection Rate</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter text-blue-600 dark:text-blue-400">
            {collectionRate.toFixed(0)}%
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">₱{(stats.financial.totalRentCollected / 1000000).toFixed(2)}M YTD</span>
          <div className="h-1 w-12 bg-blue-900/20">
            <div className="h-full bg-blue-500" style={{ width: `${collectionRate}%` }} />
          </div>
        </div>
      </div>

      {/* METRIC 4: MAINTENANCE */}
      <div className="p-4 flex flex-col justify-between h-28 relative group hover:bg-muted/5 transition-colors">
        <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Active Requests</p>
          <h3 className="text-3xl font-mono font-medium tracking-tighter text-rose-600 dark:text-rose-400">
            {stats.maintenance.emergency + stats.maintenance.pending + stats.maintenance.inProgress}
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground font-mono">{stats.maintenance.emergency} Critical</span>
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