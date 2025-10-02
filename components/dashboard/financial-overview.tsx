// components/dashboard/financial-overview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, AlertCircle, FileText, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { DashboardStats } from "@/lib/actions/dashboard-actions"

interface FinancialOverviewProps {
  stats: DashboardStats
}

export function FinancialOverview({ stats }: FinancialOverviewProps) {
  const data = [
    { 
      label: "Pending Payments", 
      value: stats.financial.pendingPayments, 
      icon: DollarSign,
      variant: "outline" as const,
      color: "text-blue-600"
    },
    { 
      label: "Overdue Payments", 
      value: stats.financial.overduePayments, 
      icon: AlertCircle,
      variant: "destructive" as const,
      color: "text-red-600"
    },
    { 
      label: "Open PDCs", 
      value: stats.financial.pdcOpen, 
      icon: FileText,
      variant: "secondary" as const,
      color: "text-purple-600"
    },
    { 
      label: "Deposited PDCs", 
      value: stats.financial.pdcDeposited, 
      icon: FileText,
      variant: "secondary" as const,
      color: "text-green-600"
    },
  ]

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>Payment and PDC status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-background flex items-center justify-center ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <Badge variant={item.variant} className="text-base px-3 py-1">
                  {item.value}
                </Badge>
              </div>
            )
          })}
        </div>
        <div className="mt-6">
          <Link href="/financial/payments">
            <Button className="w-full" size="lg">
              View All Payments
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}