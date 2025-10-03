"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building, Users, BarChart3, TrendingUp } from "lucide-react"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

interface OccupancyOverviewProps {
  stats: DashboardStats
}

export function OccupancyOverview({ stats }: OccupancyOverviewProps) {
  const occupancyMetrics = [
    {
      title: "Overall Occupancy Rate",
      description: "Based on total leasable area vs occupied area",
      value: stats.occupancy.overallRate,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-600/10",
      progressColor: "bg-blue-600",
      details: `${(stats.units.occupiedArea / 1000).toFixed(1)}k of ${(stats.properties.totalLeasableArea / 1000).toFixed(1)}k sqm`
    },
    {
      title: "Unit-Based Rate",
      description: "Based on number of occupied units",
      value: stats.occupancy.unitBasedRate,
      icon: Building,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-600/10",
      progressColor: "bg-green-600",
      details: `${stats.units.occupied} of ${stats.units.total} units`
    },
    {
      title: "Area-Based Rate",
      description: "Based on unit areas only",
      value: stats.occupancy.areaBasedRate,
      icon: BarChart3,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-600/10",
      progressColor: "bg-orange-600",
      details: `${(stats.units.occupiedArea / 1000).toFixed(1)}k of ${(stats.units.totalArea / 1000).toFixed(1)}k sqm`
    }
  ]

  return (
    <Card className="col-span-1 lg:col-span-6 hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Occupancy Analytics</CardTitle>
              <CardDescription>Comprehensive occupancy metrics across all properties</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-purple-600 border-purple-600 dark:text-purple-400 dark:border-purple-400">
            Portfolio Overview
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {occupancyMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.title} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`h-6 w-6 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-3 w-3 ${metric.color}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{metric.title}</h4>
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${metric.color}`}>
                      {metric.value.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={metric.value} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {metric.details}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Vacant Units</div>
              <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {stats.units.vacant}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.units.total > 0 ? ((stats.units.vacant / stats.units.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Maintenance</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                {stats.units.maintenance}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.units.total > 0 ? ((stats.units.maintenance / stats.units.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Reserved</div>
              <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {stats.units.reserved}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.units.total > 0 ? ((stats.units.reserved / stats.units.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Active Leases</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {stats.leases.active}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.leases.expiringSoon} expiring soon
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}