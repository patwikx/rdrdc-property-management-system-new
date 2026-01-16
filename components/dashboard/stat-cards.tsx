import { Card, CardContent } from "@/components/ui/card"
import { 
  Building2, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: { value: number; positive: boolean }
  href?: string
  className?: string
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  href,
  className
}: StatCardProps) {
  const TrendIcon = trend 
    ? trend.positive 
      ? TrendingUp 
      : trend.value === 0 
        ? Minus 
        : TrendingDown
    : null

  const content = (
    <Card className={cn("relative overflow-hidden border-muted/60 transition-all hover:border-primary/20 hover:shadow-md group", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4 relative z-10">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
            </div>
            
            <div className="space-y-1">
              {trend && TrendIcon && (
                <div className={cn(
                  "flex items-center text-xs font-medium w-fit px-2 py-0.5 rounded-full",
                  trend.positive 
                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" 
                    : trend.value === 0
                      ? "text-muted-foreground bg-muted"
                      : "text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400"
                )}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                  <span className="ml-1 opacity-70">vs last month</span>
                </div>
              )}
              {description && (
                <p className="text-xs text-muted-foreground/80 font-medium">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center transition-colors group-hover:bg-primary/10">
            <Icon className="h-6 w-6 text-primary/80" />
          </div>
        </div>
        
        {/* Decorative background element */}
        <Icon className="absolute -right-4 -bottom-4 h-24 w-24 text-primary/5 rotate-[-10deg] transition-transform group-hover:scale-110" />
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href} className="block no-underline">{content}</Link>
  }

  return content
}

interface DashboardStatsCardsProps {
  stats: DashboardStats
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Properties"
        value={stats.properties.total}
        icon={Building2}
        description={`${(stats.properties.totalLeasableArea / 1000).toFixed(1)}k sqm leasable`}
        href="/properties"
      />
      <StatCard
        title="Occupancy"
        value={`${stats.occupancy.overallRate}%`}
        icon={TrendingUp}
        description={`${stats.units.occupied} / ${stats.units.total} units occupied`}
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
        title="Revenue"
        value={`₱${(stats.financial.totalRentCollected / 1000000).toFixed(2)}M`}
        icon={DollarSign}
        description={`${stats.financial.pendingPayments} pending payments`}
        trend={{ value: 8, positive: true }}
        href="/financial/payments"
      />
    </div>
  )
}