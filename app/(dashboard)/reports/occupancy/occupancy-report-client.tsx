"use client"

import React, { useState } from "react"
import { 
  OccupancyReportItem, 
  OccupancyReportFilters, 
} from "@/lib/actions/comprehensive-reports-actions"
import { ReportHeader } from "@/components/reports/shared/report-header"
import { StatsCard } from "@/components/reports/shared/stats-card"
import { 
  Building, 
  PieChart, 
  AlertCircle, 
  DollarSign,
  ChevronDown,
  ChevronRight,
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

interface OccupancyReportClientProps {
  initialData: OccupancyReportItem[]
  filters: OccupancyReportFilters
}

export function OccupancyReportClient({ initialData }: OccupancyReportClientProps) {
  const [data] = useState<OccupancyReportItem[]>(initialData)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Calculate Aggregated Stats
  const totalUnits = data.reduce((sum, item) => sum + item.occupancy.totalUnits, 0)
  const totalOccupied = data.reduce((sum, item) => sum + item.occupancy.occupiedUnits, 0)
  const totalVacant = data.reduce((sum, item) => sum + item.occupancy.vacantUnits, 0)
  const overallOccupancyRate = totalUnits > 0 ? (totalOccupied / totalUnits) * 100 : 0
  
  const totalPotentialRevenue = data.reduce((sum, item) => sum + item.revenue.potentialMonthlyRevenue, 0)
  const totalActualRevenue = data.reduce((sum, item) => sum + item.revenue.actualMonthlyRevenue, 0)
  const totalOpportunityLoss = totalPotentialRevenue - totalActualRevenue

  const toggleRow = (propertyId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId)
    } else {
      newExpanded.add(propertyId)
    }
    setExpandedRows(newExpanded)
  }

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
        title="Occupancy Report" 
        description="Comprehensive breakdown of unit status and revenue impact"
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
          title="Overall Occupancy"
          value={`${overallOccupancyRate.toFixed(1)}%`}
          description={`${totalOccupied}/${totalUnits} Units Occupied`}
          icon={PieChart}
          valueClassName={
            overallOccupancyRate >= 90 ? "text-emerald-600" : 
            overallOccupancyRate >= 75 ? "text-amber-600" : "text-rose-600"
          }
        />
        <StatsCard
          title="Vacancy Rate"
          value={`${(100 - overallOccupancyRate).toFixed(1)}%`}
          description={`${totalVacant} Units Vacant`}
          icon={AlertCircle}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(totalActualRevenue)}
          description={`Potential: ${formatCurrency(totalPotentialRevenue)}`}
          icon={DollarSign}
          valueClassName="text-blue-600"
        />
        <StatsCard
          title="Opportunity Loss"
          value={formatCurrency(totalOpportunityLoss)}
          description="Revenue lost to vacancy"
          icon={Building}
          valueClassName="text-rose-600"
        />
      </div>

      {/* Data Table */}
      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Property</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Occupancy</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Units</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Vacant</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Area Occ.</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Revenue</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Opp. Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <React.Fragment key={item.property.id}>
                <TableRow 
                  className="group hover:bg-muted/5 border-b border-border transition-colors cursor-pointer"
                  onClick={() => toggleRow(item.property.id)}
                >
                  <TableCell>
                    {expandedRows.has(item.property.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase">{item.property.propertyName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{item.property.propertyCode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "rounded-none font-mono text-xs",
                        item.occupancy.occupancyRate >= 90 ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" :
                        item.occupancy.occupancyRate >= 75 ? "border-amber-500 text-amber-600 bg-amber-500/10" :
                        "border-rose-500 text-rose-600 bg-rose-500/10"
                      )}
                    >
                      {item.occupancy.occupancyRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.occupancy.occupiedUnits}/{item.occupancy.totalUnits}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-rose-600 font-medium">
                    {item.occupancy.vacantUnits}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.area.areaOccupancyRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(item.revenue.actualMonthlyRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency(item.revenue.opportunityLoss)}
                  </TableCell>
                </TableRow>
                
                {expandedRows.has(item.property.id) && item.units && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0 bg-muted/5">
                      <div className="p-4 border-b border-border">
                         <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3 pl-2 border-l-2 border-primary">
                           Unit Details
                         </h4>
                         <Table>
                           <TableHeader>
                             <TableRow className="border-none">
                               <TableHead className="text-[10px] uppercase">Unit</TableHead>
                               <TableHead className="text-[10px] uppercase">Status</TableHead>
                               <TableHead className="text-[10px] uppercase">Tenant</TableHead>
                               <TableHead className="text-[10px] uppercase text-right">Area</TableHead>
                               <TableHead className="text-[10px] uppercase text-right">Rent</TableHead>
                               <TableHead className="text-[10px] uppercase text-right">Lease End</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {item.units.map((unit) => (
                               <TableRow key={unit.id} className="border-border/50">
                                 <TableCell className="font-mono text-xs">{unit.unitNumber}</TableCell>
                                 <TableCell>
                                    <Badge variant="outline" className="rounded-none text-[9px] uppercase">
                                      {unit.status}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                                   {unit.tenant?.businessName || "-"}
                                 </TableCell>
                                 <TableCell className="font-mono text-xs text-right">
                                   {unit.totalArea} sqm
                                 </TableCell>
                                 <TableCell className="font-mono text-xs text-right">
                                   {formatCurrency(unit.totalRent)}
                                 </TableCell>
                                 <TableCell className="font-mono text-xs text-right text-muted-foreground">
                                   {unit.leaseEndDate ? format(new Date(unit.leaseEndDate), 'MMM dd, yyyy') : "-"}
                                 </TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                         </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}