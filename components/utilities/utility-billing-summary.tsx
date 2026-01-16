"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  DollarSign 
} from "lucide-react"
import type { UtilityBillingSummary as SummaryType } from "@/lib/actions/utility-billing-actions"

/**
 * UtilityBillingSummary Component
 * Displays summary statistics for utility billing monitoring
 * Requirements: 1.7
 */

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  variant?: 'default' | 'warning' | 'danger'
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  variant = 'default'
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${variantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface UtilityBillingSummaryProps {
  summary: SummaryType
}

export function UtilityBillingSummary({ summary }: UtilityBillingSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Bills"
        value={summary.totalBills}
        icon={FileText}
        description="All utility bills"
      />
      <StatCard
        title="Overdue Bills"
        value={summary.overdueCount}
        icon={AlertTriangle}
        description={formatCurrency(summary.totalOverdueAmount)}
        variant={summary.overdueCount > 0 ? 'danger' : 'default'}
      />
      <StatCard
        title="Due Soon"
        value={summary.upcomingCount}
        icon={Clock}
        description="Due within 7 days"
        variant={summary.upcomingCount > 0 ? 'warning' : 'default'}
      />
      <StatCard
        title="Total Amount Due"
        value={formatCurrency(summary.totalAmountDue)}
        icon={DollarSign}
        description="All unpaid bills"
      />
    </div>
  )
}
