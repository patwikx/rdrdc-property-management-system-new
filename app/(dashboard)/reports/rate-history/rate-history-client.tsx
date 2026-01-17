"use client"

import { useState } from "react"
import { 
  RateChangeHistoryResult, 
  RateChangeHistoryFilters,
} from "@/lib/actions/comprehensive-reports-actions"
import { ReportHeader } from "@/components/reports/shared/report-header"
import { StatsCard } from "@/components/reports/shared/stats-card"
import { 
  TrendingUp, 
  History, 
  UserCog,
  Filter,
  ArrowUpRight
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
import { RateChangeType, RateApprovalStatus } from "@prisma/client"

interface RateHistoryClientProps {
  initialData: RateChangeHistoryResult
  filters: RateChangeHistoryFilters
}

export function RateHistoryClient({ initialData }: RateHistoryClientProps) {
  const [data] = useState<RateChangeHistoryResult>(initialData)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getChangeTypeLabel = (type: RateChangeType) => {
    return type.replace(/_/g, ' ')
  }

  const getStatusColor = (status: RateApprovalStatus | null) => {
    switch (status) {
      case 'APPROVED': return "border-emerald-500 text-emerald-600 bg-emerald-500/10"
      case 'REJECTED': return "border-rose-500 text-rose-600 bg-rose-500/10"
      case 'PENDING': return "border-amber-500 text-amber-600 bg-amber-500/10"
      default: return "border-muted text-muted-foreground bg-muted/10"
    }
  }

  return (
    <div className="space-y-6">
      <ReportHeader 
        title="Rate Change History" 
        description="Historical analysis of rental adjustments and approvals"
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
          title="Total Adjustments"
          value={data.summary.totalChanges}
          description="Recorded rate modifications"
          icon={History}
        />
        <StatsCard
          title="Avg. Increase"
          value={`${data.summary.averageChangePercent}%`}
          description="Mean percentage growth"
          icon={TrendingUp}
          valueClassName="text-emerald-600"
        />
        <StatsCard
          title="Revenue Impact"
          value={formatCurrency(data.summary.totalIncreaseAmount)}
          description="Total monthly gain"
          icon={ArrowUpRight}
          valueClassName="text-blue-600"
        />
        <StatsCard
          title="Auto vs Manual"
          value={`${data.summary.autoAppliedCount} / ${data.summary.manualCount}`}
          description="System vs User initiated"
          icon={UserCog}
        />
      </div>

      {/* Data Table */}
      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5">
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Effective Date</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenant / Unit</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Change Type</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Old Rate</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">New Rate</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Variance</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/5 border-b border-border transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {format(new Date(item.rateChange.effectiveDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase">{item.tenant.businessName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {item.leaseUnit.propertyCode} - {item.leaseUnit.unitNumber}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit rounded-none text-[10px] uppercase">
                      {getChangeTypeLabel(item.rateChange.changeType)}
                    </Badge>
                    {item.rateChange.isAutoApplied && (
                      <span className="text-[9px] text-muted-foreground uppercase font-mono">
                        System Applied
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {formatCurrency(item.rateChange.previousRate)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold">
                  {formatCurrency(item.rateChange.newRate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "font-mono text-sm font-bold",
                      item.rateChange.changeAmount >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {item.rateChange.changeAmount >= 0 ? "+" : ""}{formatCurrency(item.rateChange.changeAmount)}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {item.rateChange.changePercentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="outline" 
                    className={cn("rounded-none font-mono text-xs uppercase", getStatusColor(item.approval?.status ?? null))}
                  >
                    {item.approval?.status || 'APPLIED'}
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