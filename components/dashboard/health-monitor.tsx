import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, Wallet, AlertCircle } from "lucide-react"
import type { DashboardStats } from "@/lib/types/dashboard-types"
import { cn } from "@/lib/utils"

interface HealthMonitorProps {
  stats: DashboardStats
}

export function HealthMonitor({ stats }: HealthMonitorProps) {
  // Calculate collection efficiency
  const totalExpected = stats.financial.totalRentCollected + stats.financial.pendingPayments + stats.financial.overduePayments
  const collectionRate = totalExpected > 0 ? (stats.financial.totalRentCollected / totalExpected) * 100 : 0
  
  // Calculate occupancy health
  const occupancyRate = stats.occupancy.overallRate
  const vacantUnits = stats.units.vacant

  // Calculate workload health
  const openTickets = stats.maintenance.emergency + stats.maintenance.pending + stats.maintenance.inProgress
  const criticalTickets = stats.maintenance.emergency

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Financial Health */}
      <Card className="border-muted/60 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collection Efficiency</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">
                {collectionRate.toFixed(1)}%
              </h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Collected: ₱{(stats.financial.totalRentCollected / 1000).toFixed(0)}k</span>
              <span className="font-medium text-rose-600 dark:text-rose-400">₱{(stats.financial.overduePayments / 1000).toFixed(0)}k Overdue</span>
            </div>
            <Progress value={collectionRate} className="h-1.5 bg-emerald-100 dark:bg-emerald-950" indicatorClassName="bg-emerald-600 dark:bg-emerald-500" />
          </div>
        </CardContent>
      </Card>

      {/* Occupancy Health */}
      <Card className="border-muted/60 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Occupancy Rate</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">
                {occupancyRate}%
              </h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{stats.units.occupied} Occupied</span>
              <span className={cn("font-medium", vacantUnits > 0 ? "text-amber-600" : "text-muted-foreground")}>
                {vacantUnits} Vacant Units
              </span>
            </div>
            <Progress value={occupancyRate} className="h-1.5 bg-blue-100 dark:bg-blue-950" indicatorClassName="bg-blue-600 dark:bg-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Workload Health */}
      <Card className="border-muted/60 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Workload</p>
              <h3 className="text-2xl font-bold tracking-tight mt-1">
                {openTickets} <span className="text-sm font-normal text-muted-foreground">tickets</span>
              </h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{stats.maintenance.inProgress} In Progress</span>
              {criticalTickets > 0 && (
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  {criticalTickets} Emergency
                </span>
              )}
            </div>
            {/* Custom Multi-segment progress bar could go here, simplifying for now */}
            <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-950 rounded-full overflow-hidden flex">
              <div style={{ width: `${(stats.maintenance.emergency / (openTickets || 1)) * 100}%` }} className="h-full bg-rose-500" />
              <div style={{ width: `${(stats.maintenance.inProgress / (openTickets || 1)) * 100}%` }} className="h-full bg-blue-500" />
              <div style={{ width: `${(stats.maintenance.pending / (openTickets || 1)) * 100}%` }} className="h-full bg-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}