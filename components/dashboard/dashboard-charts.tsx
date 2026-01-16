"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { BarChart3 } from "lucide-react"
import type { DashboardStats } from "@/lib/types/dashboard-types"

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
        <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-2.5 shadow-xl border-muted/50">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: data.payload.color }}
              />
              <span className="font-semibold text-xs tracking-tight">{data.name}</span>
            </div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {data.value} spaces • {percentage}%
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base tracking-tight">Space Status</CardTitle>
              <CardDescription className="text-[11px]">Portfolio occupancy breakdown</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="h-6 font-semibold text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50/30">
            {stats.occupancy.unitBasedRate}% Occupied
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="h-[240px] pt-4 relative">
             {/* Center Stats Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
              <span className="text-3xl font-bold tracking-tighter text-foreground">{stats.units.total}</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Total Spaces</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-6">
            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.map((item) => {
                const percentage = stats.units.total > 0 ? ((item.value / stats.units.total) * 100).toFixed(1) : '0'
                return (
                  <div key={item.name} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-muted/20 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] font-semibold tracking-tight">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold">{item.value}</span>
                      <span className="text-[10px] text-muted-foreground/60 ml-1 font-medium">{percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Stats Row */}
             <div className="pt-4 border-t border-muted/60">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Occupancy Rate</div>
                  <div className="text-lg font-bold tracking-tight text-emerald-600">
                    {stats.occupancy.overallRate}%
                  </div>
                </div>
                <div className="space-y-0.5 text-right">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Occupied Area</div>
                  <div className="text-lg font-bold tracking-tight text-amber-600">
                    {(stats.units.occupiedArea / 1000).toFixed(1)}k <span className="text-xs font-normal text-muted-foreground">sqm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}