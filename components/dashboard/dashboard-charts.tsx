"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { Building, TrendingUp, Users, BarChart3 } from "lucide-react"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

interface OccupancyChartProps {
  stats: DashboardStats
}

export function OccupancyChart({ stats }: OccupancyChartProps) {
  const data = [
    { 
      name: 'Occupied', 
      value: stats.units.occupied, 
      color: '#10b981'
    },
    { 
      name: 'Vacant', 
      value: stats.units.vacant, 
      color: '#f59e0b'
    },
    { 
      name: 'Maintenance', 
      value: stats.units.maintenance, 
      color: '#ef4444'
    },
    { 
      name: 'Reserved', 
      value: stats.units.reserved, 
      color: '#6366f1'
    },
  ]

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { name: string; value: number; color: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = stats.units.total
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0'
      
      return (
        <div className="rounded-lg border bg-background p-2 shadow-md">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ backgroundColor: data.payload.color }}
              />
              <span className="font-medium">{data.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.value} units ({percentage}%)
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-1 lg:col-span-3 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Unit Status Distribution</CardTitle>
              <CardDescription>Current occupancy breakdown across all properties</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
              {stats.occupancy.unitBasedRate}% Occupied
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-3">
          {data.map((item) => {
            const percentage = stats.units.total > 0 ? ((item.value / stats.units.total) * 100).toFixed(1) : '0'
            return (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{percentage}%</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall Stats */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {stats.units.total}
              </div>
              <div className="text-xs text-muted-foreground">Total Units</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {stats.occupancy.overallRate}%
              </div>
              <div className="text-xs text-muted-foreground">Overall Rate</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {(stats.units.occupiedArea / 1000).toFixed(1)}k
              </div>
              <div className="text-xs text-muted-foreground">Occupied sqm</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PropertyTypeChartProps {
  stats: DashboardStats
}

export function PropertyTypeChart({ stats }: PropertyTypeChartProps) {
  const data = [
    { 
      name: 'Commercial', 
      value: stats.properties.byType.COMMERCIAL,
      color: '#3b82f6'
    },
    { 
      name: 'Residential', 
      value: stats.properties.byType.RESIDENTIAL,
      color: '#10b981'
    },
    { 
      name: 'Mixed Use', 
      value: stats.properties.byType.MIXED,
      color: '#f59e0b'
    },
  ]

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { color: string } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = stats.properties.total > 0 ? ((data.value / stats.properties.total) * 100).toFixed(1) : '0'
      
      return (
        <div className="rounded-lg border bg-background p-2 shadow-md">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ backgroundColor: data.payload.color }}
              />
              <span className="font-medium">{label}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.value} properties ({percentage}%)
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-1 lg:col-span-3 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-green-600/10 flex items-center justify-center">
              <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Property Portfolio</CardTitle>
              <CardDescription>Distribution of properties by type</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400">
              {stats.properties.total} Total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                fill="currentColor"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-3 gap-3">
          {data.map((item) => {
            const percentage = stats.properties.total > 0 ? ((item.value / stats.properties.total) * 100).toFixed(1) : '0'
            return (
              <div key={item.name} className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div 
                    className="h-2.5 w-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-lg font-semibold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{percentage}%</div>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-muted-foreground">Total Leasable Area:</span>
            </div>
            <span className="font-semibold">
              {(stats.properties.totalLeasableArea / 1000).toFixed(1)}k sqm
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}