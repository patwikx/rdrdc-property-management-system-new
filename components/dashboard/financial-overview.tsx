// components/dashboard/financial-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, AlertCircle, FileText, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface FinancialOverviewProps {
  stats: DashboardStats
}

export function FinancialOverview({ stats }: FinancialOverviewProps) {
  const data = [
    { 
      label: "Pending Payments", 
      value: stats.financial.pendingPayments, 
      icon: DollarSign,
      color: "text-blue-600 dark:text-blue-400",
      bgGradient: "from-blue-500/10 to-blue-500/5",
      borderColor: "border-blue-200/50 dark:border-blue-700/30",
      iconBg: "bg-blue-100 dark:bg-blue-900/30"
    },
    { 
      label: "Overdue Payments", 
      value: stats.financial.overduePayments, 
      icon: AlertCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgGradient: "from-rose-500/10 to-rose-500/5",
      borderColor: "border-rose-200/50 dark:border-rose-700/30",
      iconBg: "bg-rose-100 dark:bg-rose-900/30"
    },
    { 
      label: "Open PDCs", 
      value: stats.financial.pdcOpen, 
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400",
      bgGradient: "from-purple-500/10 to-purple-500/5",
      borderColor: "border-purple-200/50 dark:border-purple-700/30",
      iconBg: "bg-purple-100 dark:bg-purple-900/30"
    },
    { 
      label: "Deposited PDCs", 
      value: stats.financial.pdcDeposited, 
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400",
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
      borderColor: "border-emerald-200/50 dark:border-emerald-700/30",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30"
    },
  ]

  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md overflow-hidden relative group">
      {/* Subtle background pattern/gradient */}
      <div className="absolute top-0 right-0 p-20 bg-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Financial Status
        </CardTitle>
        <CardDescription className="text-xs">Real-time collections overview</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-1 gap-3">
          {data.map((item) => {
            const Icon = item.icon
            return (
              <div 
                key={item.label} 
                className={`relative flex items-center justify-between p-3 rounded-xl border ${item.borderColor} bg-gradient-to-r ${item.bgGradient} backdrop-blur-sm transition-all hover:translate-x-1`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${item.iconBg} flex items-center justify-center shadow-inner`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
                    <span className="text-sm font-bold tracking-tight text-foreground">
                      {item.label.includes('Payments') ? '₱' : ''}
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Visual Indicator Pill */}
                <div className={`h-8 w-1 rounded-full ${item.iconBg}`} />
              </div>
            )
          })}
        </div>
        <div className="mt-6">
          <Link href="/financial/payments" className="block">
            <Button className="w-full text-xs font-semibold tracking-wide h-10 shadow-sm bg-background border-muted hover:bg-muted/50 text-foreground" variant="outline" size="sm">
              <span className="mr-2">Detailed Report</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}