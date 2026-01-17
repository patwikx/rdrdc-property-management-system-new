"use client"

import { useState } from "react"
import { 
  LeaseAgingReportResult, 
  LeaseAgingFilters,
  AgingBucket 
} from "@/lib/actions/comprehensive-reports-actions"
import { ReportHeader } from "@/components/reports/shared/report-header"
import { StatsCard } from "@/components/reports/shared/stats-card"
import { 
  Clock, 
  AlertTriangle, 
  CalendarDays, 
  TrendingDown,
  Filter
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

interface LeaseAgingClientProps {
  initialData: LeaseAgingReportResult
  filters: LeaseAgingFilters
}

export function LeaseAgingClient({ initialData }: LeaseAgingClientProps) {
  const [data] = useState<LeaseAgingReportResult>(initialData)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getBucketColor = (bucket: AgingBucket) => {
    switch (bucket) {
      case 'expired': return "border-rose-500 text-rose-600 bg-rose-500/10"
      case '30': return "border-orange-500 text-orange-600 bg-orange-500/10"
      case '60': return "border-amber-500 text-amber-600 bg-amber-500/10"
      case '90': return "border-yellow-500 text-yellow-600 bg-yellow-500/10"
      default: return "border-emerald-500 text-emerald-600 bg-emerald-500/10"
    }
  }

  return (
    <div className="space-y-6">
      <ReportHeader 
        title="Lease Aging Report" 
        description="Expiration timeline analysis and revenue risk assessment"
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
          title="Total Active Leases"
          value={data.summary.totalLeases}
          description="Currently managed contracts"
          icon={CalendarDays}
        />
        <StatsCard
          title="Expired Leases"
          value={data.summary.expired}
          description="Require immediate attention"
          icon={AlertTriangle}
          valueClassName="text-rose-600"
        />
        <StatsCard
          title="Expiring (30 Days)"
          value={data.summary.expiring30Days}
          description="Upcoming renewals"
          icon={Clock}
          valueClassName="text-orange-600"
        />
        <StatsCard
          title="Revenue at Risk"
          value={formatCurrency(data.summary.totalRevenueAtRisk)}
          description="From expired/expiring leases"
          icon={TrendingDown}
          valueClassName="text-rose-600"
        />
      </div>

      {/* Data Table */}
      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenant</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Units</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lease Period</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Rent Amount</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Days Left</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Status Bucket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/5 border-b border-border transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase">{item.tenant.businessName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.tenant.bpCode}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.units.map((unit) => (
                      <Badge key={unit.id} variant="outline" className="rounded-none text-[10px] font-mono uppercase">
                        {unit.unitNumber}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs font-mono text-muted-foreground">
                    <span>START: {format(new Date(item.lease.startDate), 'MMM dd, yyyy')}</span>
                    <span>END: {format(new Date(item.lease.endDate), 'MMM dd, yyyy')}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(item.lease.totalRentAmount)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono text-sm font-bold",
                  item.aging.daysUntilExpiry < 0 ? "text-rose-600" : 
                  item.aging.daysUntilExpiry <= 30 ? "text-orange-600" : "text-foreground"
                )}>
                  {item.aging.daysUntilExpiry} Days
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="outline" 
                    className={cn("rounded-none font-mono text-xs uppercase", getBucketColor(item.aging.bucket))}
                  >
                    {item.aging.bucket === 'expired' ? 'EXPIRED' : `${item.aging.bucket} DAYS`}
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