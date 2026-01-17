"use client"

import { useState } from "react"
import { 
  OpportunityLossResult, 
  OpportunityLossFilters
} from "@/lib/actions/comprehensive-reports-actions"
import { ReportHeader } from "@/components/reports/shared/report-header"
import { StatsCard } from "@/components/reports/shared/stats-card"
import { 
  Building, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
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

interface OpportunityLossClientProps {
  initialData: OpportunityLossResult
  filters: OpportunityLossFilters
}

export function OpportunityLossClient({ initialData }: OpportunityLossClientProps) {
  const [data] = useState<OpportunityLossResult>(initialData)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <ReportHeader 
        title="Opportunity Loss Report" 
        description="Analysis of revenue lost due to unit vacancy and downtime"
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
          title="Total Period Loss"
          value={formatCurrency(data.summary.periodOpportunityLoss)}
          description="Cumulative revenue impact"
          icon={TrendingDown}
          valueClassName="text-rose-600"
        />
        <StatsCard
          title="Monthly Impact"
          value={formatCurrency(data.summary.monthlyOpportunityLoss)}
          description="Recurring monthly loss"
          icon={AlertTriangle}
          valueClassName="text-orange-600"
        />
        <StatsCard
          title="Avg. Vacancy"
          value={`${data.summary.averageVacancyDays} Days`}
          description="Mean turnover time"
          icon={Clock}
        />
        <StatsCard
          title="Highest Loss Unit"
          value={data.summary.highestLoss?.unitNumber || 'N/A'}
          description={data.summary.highestLoss ? formatCurrency(data.summary.highestLoss.amount) : '-'}
          icon={Building}
          valueClassName="text-rose-600"
        />
      </div>

      {/* Property Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 border border-border bg-background h-fit">
          <div className="p-4 border-b border-border bg-muted/5">
            <h3 className="text-sm font-bold uppercase tracking-widest">Property Impact</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-[10px] font-bold uppercase">Property</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">Vacant</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">Total Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.propertyBreakdown.map((prop) => (
                <TableRow key={prop.propertyId} className="border-b border-border/50 hover:bg-muted/5">
                  <TableCell className="font-mono text-xs font-medium">
                    {prop.propertyCode}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {prop.vacantUnits}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-rose-600">
                    {formatCurrency(prop.periodLoss)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Unit Detail Table */}
        <div className="col-span-1 lg:col-span-2 border border-border bg-background">
          <div className="p-4 border-b border-border bg-muted/5">
            <h3 className="text-sm font-bold uppercase tracking-widest">Vacancy Details</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Unit Info</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Vacant Since</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-right">Days</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-right">Daily Loss</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground text-right">Total Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/5 border-b border-border transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase">{item.unitNumber}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.property.propertyCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none text-[9px] uppercase">
                      {item.unit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.vacancy.vacantSince ? format(new Date(item.vacancy.vacantSince), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-xs font-bold",
                    item.vacancy.vacantDays > 90 ? "text-rose-600" :
                    item.vacancy.vacantDays > 30 ? "text-orange-600" : "text-foreground"
                  )}>
                    {item.vacancy.vacantDays}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatCurrency(item.vacancy.dailyLoss)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-rose-600">
                    {formatCurrency(item.vacancy.totalLoss)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}