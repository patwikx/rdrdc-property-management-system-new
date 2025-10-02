// components/dashboard/lease-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

interface LeaseOverviewProps {
  stats: DashboardStats
}

export function LeaseOverview({ stats }: LeaseOverviewProps) {
  const total = stats.leases.active + stats.leases.expiringSoon + stats.leases.expired

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Lease Overview</CardTitle>
        <CardDescription>Active and expiring leases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.leases.active}</div>
              <div className="text-xs text-green-600 mt-1">Active</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.leases.expiringSoon}</div>
              <div className="text-xs text-yellow-600 mt-1">Expiring Soon</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.leases.expired}</div>
              <div className="text-xs text-gray-600 mt-1">Expired</div>
            </div>
          </div>
          
          <div className="pt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Active Lease Rate</span>
              <span className="font-semibold">
                {total > 0 ? ((stats.leases.active / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <Progress 
              value={total > 0 ? (stats.leases.active / total) * 100 : 0} 
              className="h-2"
            />
          </div>
        </div>
        <div className="mt-6">
          <Link href="/tenants/leases">
            <Button className="w-full" variant="outline" size="lg">
              View All Leases
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}