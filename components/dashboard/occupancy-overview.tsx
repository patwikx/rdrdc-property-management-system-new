"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building, Users, BarChart3, TrendingUp } from "lucide-react"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface OccupancyOverviewProps {
  stats: DashboardStats
}

export function OccupancyOverview({ stats }: OccupancyOverviewProps) {
  const occupancyMetrics = [
    {
      title: "Overall Occupancy",
      description: "Total leasable area",
      value: stats.occupancy.overallRate,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      progressColor: "bg-blue-600",
      details: `${(stats.units.occupiedArea / 1000).toFixed(1)}k / ${(stats.properties.totalLeasableArea / 1000).toFixed(1)}k sqm`
    },
    {
      title: "Space Occupancy",
      description: "Total number of units",
      value: stats.occupancy.unitBasedRate,
      icon: Building,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      progressColor: "bg-emerald-600",
      details: `${stats.units.occupied} / ${stats.units.total} units`
    },
    {
      title: "Unit Area Rate",
      description: "Unit-specific areas",
      value: stats.occupancy.areaBasedRate,
      icon: BarChart3,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
      progressColor: "bg-amber-600",
      details: `${(stats.units.occupiedArea / 1000).toFixed(1)}k / ${(stats.units.totalArea / 1000).toFixed(1)}k sqm`
    }
  ]

  return (
    <Card className="col-span-1 lg:col-span-6 border-muted/60 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg tracking-tight">Occupancy Analytics</CardTitle>
              <CardDescription className="text-xs">Real-time metrics across portfolio</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider">
            Portfolio Overview
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-3">
          {occupancyMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.title} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-8 w-8 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold tracking-tight leading-none">{metric.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1">{metric.description}</p>
                    </div>
                  </div>
                  <div className={`text-xl font-bold tracking-tighter ${metric.color}`}>
                    {metric.value.toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={metric.value} 
                    className="h-1.5 bg-muted"
                  />
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Utilization</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{metric.details}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 pt-6 border-t border-muted/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Vacant Spaces", value: stats.units.vacant, color: "text-amber-600", sub: `${stats.units.total > 0 ? ((stats.units.vacant / stats.units.total) * 100).toFixed(1) : 0}%` },
              { label: "In Maintenance", value: stats.units.maintenance, color: "text-rose-600", sub: `${stats.units.total > 0 ? ((stats.units.maintenance / stats.units.total) * 100).toFixed(1) : 0}%` },
              { label: "Reserved", value: stats.units.reserved, color: "text-indigo-600", sub: `${stats.units.total > 0 ? ((stats.units.reserved / stats.units.total) * 100).toFixed(1) : 0}%` },
              { label: "Active Leases", value: stats.leases.active, color: "text-emerald-600", sub: `${stats.leases.expiringSoon} expiring` }
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center justify-center space-y-1 p-3 rounded-xl bg-muted/30 transition-colors hover:bg-muted/50">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <span className={`text-xl font-bold tracking-tight ${item.color}`}>{item.value}</span>
                <span className="text-[10px] text-muted-foreground/60 font-medium">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}