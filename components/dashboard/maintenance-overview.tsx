// components/dashboard/maintenance-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface MaintenanceOverviewProps {
  stats: DashboardStats
}

export function MaintenanceOverview({ stats }: MaintenanceOverviewProps) {
  const total = stats.maintenance.emergency + stats.maintenance.pending + 
                stats.maintenance.inProgress + stats.maintenance.completed

  const data = [
    { 
      label: "Emergency", 
      value: stats.maintenance.emergency,
      percentage: total > 0 ? (stats.maintenance.emergency / total) * 100 : 0,
      color: "bg-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-500/10",
      borderColor: "border-rose-100 dark:border-rose-500/20"
    },
    { 
      label: "Pending", 
      value: stats.maintenance.pending,
      percentage: total > 0 ? (stats.maintenance.pending / total) * 100 : 0,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
      borderColor: "border-amber-100 dark:border-amber-500/20"
    },
    { 
      label: "In Progress", 
      value: stats.maintenance.inProgress,
      percentage: total > 0 ? (stats.maintenance.inProgress / total) * 100 : 0,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      borderColor: "border-blue-100 dark:border-blue-500/20"
    },
    { 
      label: "Completed", 
      value: stats.maintenance.completed,
      percentage: total > 0 ? (stats.maintenance.completed / total) * 100 : 0,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      borderColor: "border-emerald-100 dark:border-emerald-500/20"
    },
  ]

  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-20 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-500" />
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          Maintenance Board
        </CardTitle>
        <CardDescription className="text-xs">Active requests status</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.label} className="group/item">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold tracking-tight text-foreground/70 group-hover/item:text-foreground transition-colors">
                  {item.label}
                </span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${item.bgColor} border ${item.borderColor}`}>
                  <span className={`text-[10px] font-bold ${item.textColor}`}>
                    {item.value}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium opacity-70">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${item.color} ${item.percentage > 0 ? 'opacity-100' : 'opacity-0'}`} 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-2">
          <Link href="/rwo" className="block">
            <Button className="w-full text-xs font-semibold tracking-wide h-10 shadow-sm bg-background border-muted hover:bg-muted/50 text-foreground" variant="outline" size="sm">
              <span className="mr-2">Manage Requests</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}