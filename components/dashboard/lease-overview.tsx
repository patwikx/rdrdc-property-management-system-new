// components/dashboard/lease-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface LeaseOverviewProps {
  stats: DashboardStats
}

export function LeaseOverview({ stats }: LeaseOverviewProps) {
  const total = stats.leases.active + stats.leases.expiringSoon + stats.leases.expired
  const activeRate = total > 0 ? (stats.leases.active / total) * 100 : 0

  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-16 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-base font-semibold tracking-tight">Lease Status</CardTitle>
        <CardDescription className="text-xs">Active & expiring contracts</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tighter">{stats.leases.active}</span>
              <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mt-0.5">Active</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tighter">{stats.leases.expiringSoon}</span>
              <span className="text-[9px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest mt-0.5">Expiring</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 border border-muted/20">
              <span className="text-2xl font-bold text-muted-foreground tracking-tighter">{stats.leases.expired}</span>
              <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-0.5">Expired</span>
            </div>
          </div>
          
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Health Rate</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{activeRate.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Link href="/tenants/leases" className="block">
            <Button className="w-full text-xs font-semibold tracking-wide h-8 shadow-sm bg-background/50 border-muted hover:bg-muted/50 text-foreground" variant="ghost" size="sm">
              Manage Leases
              <ArrowUpRight className="ml-1.5 h-3 w-3 opacity-70" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}