// components/dashboard/maintenance-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

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
      color: "bg-red-600"
    },
    { 
      label: "Pending", 
      value: stats.maintenance.pending,
      percentage: total > 0 ? (stats.maintenance.pending / total) * 100 : 0,
      color: "bg-yellow-600"
    },
    { 
      label: "In Progress", 
      value: stats.maintenance.inProgress,
      percentage: total > 0 ? (stats.maintenance.inProgress / total) * 100 : 0,
      color: "bg-blue-600"
    },
    { 
      label: "Completed", 
      value: stats.maintenance.completed,
      percentage: total > 0 ? (stats.maintenance.completed / total) * 100 : 0,
      color: "bg-green-600"
    },
  ]

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Maintenance Requests</CardTitle>
        <CardDescription>Current maintenance status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.value} ({item.percentage.toFixed(0)}%)
                </span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/maintenance/requests">
            <Button className="w-full" variant="outline" size="lg">
              View All Requests
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}