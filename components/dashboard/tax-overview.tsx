// components/dashboard/tax-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface TaxOverviewProps {
  stats: DashboardStats
}

export function TaxOverview({ stats }: TaxOverviewProps) {
  const propertyTotal = stats.taxes.propertyTaxesDue + stats.taxes.propertyTaxesOverdue
  const unitTotal = stats.taxes.unitTaxesDue + stats.taxes.unitTaxesOverdue

  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-16 bg-amber-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-500" />

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-base font-semibold tracking-tight">Tax Obligations</CardTitle>
        <CardDescription className="text-xs">Property & unit tax status</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {/* Property Taxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Property</span>
              <Badge variant="outline" className="text-[9px] h-4 font-bold border-muted-foreground/30">{propertyTotal}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30">
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-tight">Due</span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-300 tracking-tight leading-none mt-0.5">{stats.taxes.propertyTaxesDue}</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/30">
                <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-tight">Overdue</span>
                <span className="text-lg font-bold text-rose-700 dark:text-rose-300 tracking-tight leading-none mt-0.5">{stats.taxes.propertyTaxesOverdue}</span>
              </div>
            </div>
          </div>

          {/* Unit Taxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit</span>
              <Badge variant="outline" className="text-[9px] h-4 font-bold border-muted-foreground/30">{unitTotal}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex flex-col p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30">
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-tight">Due</span>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-300 tracking-tight leading-none mt-0.5">{stats.taxes.unitTaxesDue}</span>
              </div>
              <div className="flex flex-col p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/30">
                <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-tight">Overdue</span>
                <span className="text-lg font-bold text-rose-700 dark:text-rose-300 tracking-tight leading-none mt-0.5">{stats.taxes.unitTaxesOverdue}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-5">
          <Link href="/taxes" className="block">
            <Button className="w-full text-xs font-semibold tracking-wide h-8 shadow-sm bg-background/50 border-muted hover:bg-muted/50 text-foreground" variant="ghost" size="sm">
              View Reports
              <ArrowUpRight className="ml-1.5 h-3 w-3 opacity-70" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
