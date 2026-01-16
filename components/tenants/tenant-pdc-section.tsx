"use client"

import { Badge } from "@/components/ui/badge"
import { CreditCard, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { TenantPDC } from "@/lib/actions/tenant-pdc-actions"

interface TenantPDCSectionProps {
  pdcs: TenantPDC[]
}

function getPDCStatusColor(status: string) {
  switch (status) {
    case "Open": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "Deposited": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "RETURNED": return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    case "Bounced": return "bg-rose-500/10 text-rose-600 border-rose-500/20"
    case "Cancelled": return "bg-slate-500/10 text-slate-600 border-slate-500/20"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

export function TenantPDCSection({ pdcs }: TenantPDCSectionProps) {
  // Calculate stats client-side
  const stats = {
    total: pdcs.length,
    totalAmount: pdcs.reduce((sum, p) => sum + p.amount, 0),
    open: pdcs.filter(p => p.status === 'Open').length,
    openAmount: pdcs.filter(p => p.status === 'Open').reduce((sum, p) => sum + p.amount, 0),
    deposited: pdcs.filter(p => p.status === 'Deposited').length,
    depositedAmount: pdcs.filter(p => p.status === 'Deposited').reduce((sum, p) => sum + p.amount, 0),
    overdue: pdcs.filter(p => p.status === 'Open' && new Date(p.dueDate) < new Date()).length,
    overdueAmount: pdcs.filter(p => p.status === 'Open' && new Date(p.dueDate) < new Date()).reduce((sum, p) => sum + p.amount, 0),
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Total PDCs</span>
            <FileText className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block">{stats.total}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.totalAmount)}</span>
          </div>
        </div>

        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Open</span>
            <Clock className="h-4 w-4 text-blue-500/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block text-blue-600">{stats.open}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.openAmount)}</span>
          </div>
        </div>

        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Deposited</span>
            <CheckCircle className="h-4 w-4 text-emerald-500/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block text-emerald-600">{stats.deposited}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.depositedAmount)}</span>
          </div>
        </div>

        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-rose-500/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block text-rose-600">{stats.overdue}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.overdueAmount)}</span>
          </div>
        </div>
      </div>

      {/* PDC List */}
      <div className="border border-border bg-background p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Check Inventory
        </h3>
        
        {pdcs.length > 0 ? (
          <div className="grid gap-2">
            {pdcs.map((pdc) => (
              <div key={pdc.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 border border-border bg-muted/5 items-center hover:border-primary/30 transition-colors">
                {/* Status */}
                <div className="md:col-span-2">
                  <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border-0 px-1.5 py-0.5 w-fit ${getPDCStatusColor(pdc.status)}`}>
                    {pdc.status}
                  </Badge>
                </div>

                {/* Amount */}
                <div className="md:col-span-3">
                  <span className="text-[10px] text-muted-foreground uppercase block md:hidden mb-1">Amount</span>
                  <span className="font-mono font-bold text-sm">{formatCurrency(pdc.amount)}</span>
                </div>

                {/* Details */}
                <div className="md:col-span-4">
                  <span className="text-[10px] text-muted-foreground uppercase block md:hidden mb-1">Details</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{pdc.bankName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">CHK#{pdc.checkNo} • REF:{pdc.refNo}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="md:col-span-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-muted-foreground tracking-widest">Due Date</span>
                    <span className="font-mono text-xs">{format(new Date(pdc.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border bg-muted/5">
            <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No Checks Found</h3>
          </div>
        )}
      </div>
    </div>
  )
}