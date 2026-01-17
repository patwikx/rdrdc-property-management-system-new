"use client"

import { useState } from "react"
import { 
  MultiSpaceTenantsResult, 
  MultiSpaceTenantsFilters
} from "@/lib/actions/comprehensive-reports-actions"
import { ReportHeader } from "@/components/reports/shared/report-header"
import { StatsCard } from "@/components/reports/shared/stats-card"
import { 
  Users, 
  Building2, 
  LayoutGrid, 
  Wallet,
  Filter,
  ChevronDown,
  ChevronRight
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


interface MultiSpaceClientProps {
  initialData: MultiSpaceTenantsResult
  filters: MultiSpaceTenantsFilters
}

export function MultiSpaceClient({ initialData }: MultiSpaceClientProps) {
  const [data] = useState<MultiSpaceTenantsResult>(initialData)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (tenantId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(tenantId)) {
      newExpanded.delete(tenantId)
    } else {
      newExpanded.add(tenantId)
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
        title="Multi-Space Tenants" 
        description="Portfolio analysis of tenants leasing multiple units"
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
          title="Total Multi-Space Tenants"
          value={data.summary.totalTenants}
          description="Tenants with >1 unit"
          icon={Users}
        />
        <StatsCard
          title="Total Units Leased"
          value={data.summary.totalUnits}
          description={`Avg. ${data.summary.averageUnitsPerTenant} units per tenant`}
          icon={LayoutGrid}
          valueClassName="text-blue-600"
        />
        <StatsCard
          title="Total Monthly Revenue"
          value={formatCurrency(data.summary.totalMonthlyRevenue)}
          description="From multi-space accounts"
          icon={Wallet}
          valueClassName="text-emerald-600"
        />
        <StatsCard
          title="Top Tenant (Units)"
          value={data.summary.topTenantByUnits || 'N/A'}
          description="Highest unit count holder"
          icon={Building2}
          valueClassName="text-sm truncate"
        />
      </div>

      {/* Data Table */}
      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenant Name</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Units</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Properties</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Total Area</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Monthly Rent</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Avg Rent/Sqm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <>
                <TableRow 
                  key={item.tenant.id} 
                  className="group hover:bg-muted/5 border-b border-border transition-colors cursor-pointer"
                  onClick={() => toggleRow(item.tenant.id)}
                >
                  <TableCell>
                    {expandedRows.has(item.tenant.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase">{item.tenant.businessName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{item.tenant.bpCode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-blue-600">
                    {item.portfolio.totalUnits}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.portfolio.propertiesCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {item.portfolio.totalArea} sqm
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {formatCurrency(item.portfolio.totalMonthlyRent)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency(item.portfolio.averageRentPerSqm)}
                  </TableCell>
                </TableRow>

                {expandedRows.has(item.tenant.id) && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0 bg-muted/5">
                      <div className="p-4 border-b border-border">
                         <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3 pl-2 border-l-2 border-primary">
                           Portfolio Breakdown
                         </h4>
                         <div className="grid gap-4">
                           {item.properties.map((property) => (
                             <div key={property.id} className="border border-border bg-background p-3">
                               <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed border-border/50">
                                 <div className="flex items-center gap-2">
                                   <Badge variant="outline" className="rounded-none text-[10px] font-mono uppercase bg-muted/10">
                                     {property.propertyCode}
                                   </Badge>
                                   <span className="text-xs font-bold uppercase">{property.propertyName}</span>
                                 </div>
                                 <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                   {formatCurrency(property.totalRent)} / Month
                                 </span>
                               </div>
                               <div className="flex flex-wrap gap-2">
                                 {item.leases
                                   .flatMap(l => l.units)
                                   .filter(u => u.propertyCode === property.propertyCode)
                                   .map(unit => (
                                     <div key={unit.id} className="flex items-center gap-2 text-[10px] font-mono border border-border px-2 py-1 bg-muted/5">
                                       <span className="font-bold">{unit.unitNumber}</span>
                                       <span className="text-muted-foreground">{unit.totalArea}sqm</span>
                                       <span className="text-emerald-600">{formatCurrency(unit.rentAmount)}</span>
                                     </div>
                                   ))
                                 }
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}