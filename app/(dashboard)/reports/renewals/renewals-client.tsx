"use client"

import { useState } from "react"
import { 
  LeaseRenewalsDueResult, 
  LeaseRenewalsDueFilters,
} from "@/lib/actions/comprehensive-reports-actions"
import { ReportHeader } from "@/components/reports/shared/report-header"
import { StatsCard } from "@/components/reports/shared/stats-card"
import { 
  Calendar, 
  AlertOctagon, 
  CheckCircle2, 
  Clock,
  Filter,
  TrendingUp
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface RenewalsClientProps {
  initialData: LeaseRenewalsDueResult
  filters: LeaseRenewalsDueFilters
}

export function RenewalsClient({ initialData }: RenewalsClientProps) {
  const [data] = useState<LeaseRenewalsDueResult>(initialData)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'RENEW': return "border-emerald-500 text-emerald-600 bg-emerald-500/10"
      case 'NEGOTIATE': return "border-blue-500 text-blue-600 bg-blue-500/10"
      case 'TERMINATE': return "border-rose-500 text-rose-600 bg-rose-500/10"
      case 'EXPIRED': return "border-muted text-muted-foreground bg-muted/10"
      default: return "border-border text-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <ReportHeader 
        title="Lease Renewals Due" 
        description="Upcoming lease expirations and renewal recommendations"
        onExportCsv={() => console.log("Export CSV")}
        onExportPdf={() => console.log("Export PDF")}
      >
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Filter
           </Button>
        </div>
      </ReportHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Due (90 Days)"
          value={data.summary.totalDue}
          description="Leases requiring action"
          icon={Calendar}
        />
        <StatsCard
          title="Critical / Urgent"
          value={`${data.summary.critical} / ${data.summary.urgent}`}
          description="<7 days / <30 days"
          icon={AlertOctagon}
          valueClassName="text-rose-600"
        />
        <StatsCard
          title="Revenue at Risk"
          value={formatCurrency(data.summary.totalMonthlyRevenueAtRisk)}
          description="Monthly impact"
          icon={TrendingUp}
          valueClassName="text-orange-600"
        />
        <StatsCard
          title="Avg. Tenure"
          value={`${data.summary.averageTenureYears} Years`}
          description="Tenant retention metric"
          icon={CheckCircle2}
          valueClassName="text-blue-600"
        />
      </div>

      {/* Data Table */}
      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenant Details</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expiration</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenure</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Rent Amount</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Last Increase</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/5 border-b border-border transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase">{item.tenant.businessName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {item.units.map(u => u.unitNumber).join(', ')} • {item.tenant.bpCode}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-mono text-sm font-bold",
                      item.renewal.daysUntilExpiry < 0 ? "text-muted-foreground" :
                      item.renewal.daysUntilExpiry <= 30 ? "text-rose-600" :
                      item.renewal.daysUntilExpiry <= 60 ? "text-orange-600" : "text-emerald-600"
                    )}>
                      {format(new Date(item.lease.endDate), 'MMM dd, yyyy')}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {item.renewal.daysUntilExpiry < 0 
                        ? `${Math.abs(item.renewal.daysUntilExpiry)} Days Overdue`
                        : `${item.renewal.daysUntilExpiry} Days Left`
                      }
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {item.lease.tenureYears}y {item.lease.tenureMonths}m
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatCurrency(item.lease.totalRentAmount)}
                </TableCell>
                <TableCell className="text-right">
                  {item.lastRateIncrease ? (
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        +{item.lastRateIncrease.increasePercent}%
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.lastRateIncrease.date ? format(new Date(item.lastRateIncrease.date), 'MM/yy') : '-'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="outline" 
                    className={cn("rounded-none font-mono text-xs uppercase", getActionColor(item.renewal.recommendedAction))}
                  >
                    {item.renewal.recommendedAction}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}