// components/dashboard/dashboard-charts.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ResponsiveContainer 
} from "recharts"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

interface OccupancyChartProps {
  stats: DashboardStats
}

export function OccupancyChart({ stats }: OccupancyChartProps) {
  const data = [
    { name: 'Occupied', value: stats.units.occupied, color: '#10b981' },
    { name: 'Vacant', value: stats.units.vacant, color: '#f59e0b' },
    { name: 'Maintenance', value: stats.units.maintenance, color: '#ef4444' },
    { name: 'Reserved', value: stats.units.reserved, color: '#6366f1' },
  ]

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Unit Status Distribution</CardTitle>
        <CardDescription>Current occupancy breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const entry = props as unknown as { name: string; value: number };
                  const total = data.reduce((sum, item) => sum + item.value, 0);
                  const percent = ((entry.value / total) * 100).toFixed(0);
                  return `${entry.name} ${percent}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name}: <span className="font-semibold text-foreground">{item.value}</span>
              </span>
            </div>
          ))}
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
    { name: 'Commercial', value: stats.properties.byType.COMMERCIAL },
    { name: 'Residential', value: stats.properties.byType.RESIDENTIAL },
    { name: 'Mixed', value: stats.properties.byType.MIXED },
  ]

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Property Portfolio</CardTitle>
        <CardDescription>Properties by type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}