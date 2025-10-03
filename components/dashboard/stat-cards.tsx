// components/dashboard/stats-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building2, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: { value: number; positive: boolean }
  href?: string
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  href 
}: StatCardProps) {
  const TrendIcon = trend 
    ? trend.positive 
      ? TrendingUp 
      : trend.value === 0 
        ? Minus 
        : TrendingDown
    : null

  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
        {trend && TrendIcon && (
          <div className={`flex items-center text-sm mt-3 font-medium ${
            trend.positive 
              ? 'text-green-600' 
              : trend.value === 0 
                ? 'text-muted-foreground' 
                : 'text-red-600'
          }`}>
            <TrendIcon className="h-4 w-4 mr-1" />
            {trend.value > 0 ? '+' : ''}{trend.value}%
            <span className="text-xs text-muted-foreground ml-2">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

interface DashboardStatsCardsProps {
  stats: DashboardStats
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Properties"
        value={stats.properties.total}
        icon={Building2}
        description={`${(stats.properties.totalLeasableArea / 1000).toFixed(1)}k sqm leasable area`}
        href="/properties"
      />
      <StatCard
        title="Overall Occupancy"
        value={`${stats.occupancy.overallRate}%`}
        icon={TrendingUp}
        description={`${stats.units.occupied} of ${stats.units.total} units occupied`}
        trend={{ value: 5, positive: true }}
        href="/properties/units"
      />
      <StatCard
        title="Active Tenants"
        value={stats.tenants.active}
        icon={Users}
        description={`${stats.tenants.pending} pending approval`}
        trend={{ value: 2, positive: true }}
        href="/tenants"
      />
      <StatCard
        title="Total Revenue"
        value={`₱${(stats.financial.totalRentCollected / 1000000).toFixed(2)}M`}
        icon={DollarSign}
        description={`${stats.financial.pendingPayments} pending payments`}
        trend={{ value: 8, positive: true }}
        href="/financial/payments"
      />
    </div>
  )
}