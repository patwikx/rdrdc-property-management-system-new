"use client"


import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"

type PDC = {
  id: string
  amount: number
  status: "Open" | "Deposited" | "RETURNED" | "Bounced" | "Cancelled"
  dueDate: Date
}

interface PDCStatsProps {
  pdcs: PDC[]
}

export function PDCStats({ pdcs }: PDCStatsProps) {
  const stats = pdcs.reduce(
    (acc, pdc) => {
      acc.total += pdc.amount
      acc.count += 1
      
      switch (pdc.status) {
        case "Open":
          acc.open += pdc.amount
          acc.openCount += 1
          break
        case "Deposited":
          acc.deposited += pdc.amount
          acc.depositedCount += 1
          break
        case "RETURNED":
          acc.returned += pdc.amount
          acc.returnedCount += 1
          break
        case "Bounced":
          acc.bounced += pdc.amount
          acc.bouncedCount += 1
          break
        case "Cancelled":
          acc.cancelled += pdc.amount
          acc.cancelledCount += 1
          break
      }

      // Check if due within 30 days
      const daysUntilDue = Math.ceil(
        (new Date(pdc.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilDue <= 30 && daysUntilDue >= 0 && pdc.status === "Open") {
        acc.dueSoon += pdc.amount
        acc.dueSoonCount += 1
      }

      return acc
    },
    {
      total: 0,
      count: 0,
      open: 0,
      openCount: 0,
      deposited: 0,
      depositedCount: 0,
      returned: 0,
      returnedCount: 0,
      bounced: 0,
      bouncedCount: 0,
      cancelled: 0,
      cancelledCount: 0,
      dueSoon: 0,
      dueSoonCount: 0,
    }
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total PDCs</span>
          <FileText className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-bold tracking-tighter">{formatCurrency(stats.total)}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">{stats.count} Checks</span>
        </div>
      </div>

      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Pending Collection</span>
          <Clock className="h-4 w-4 text-amber-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-bold tracking-tighter text-amber-600">{formatCurrency(stats.open)}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">{stats.openCount} Open</span>
        </div>
      </div>

      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Due Soon (30d)</span>
          <AlertTriangle className="h-4 w-4 text-rose-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-bold tracking-tighter text-rose-600">{formatCurrency(stats.dueSoon)}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">{stats.dueSoonCount} Critical</span>
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Collected</span>
          <CheckCircle className="h-4 w-4 text-emerald-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-bold tracking-tighter text-emerald-600">{formatCurrency(stats.deposited)}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">{stats.depositedCount} Cleared</span>
        </div>
      </div>
    </div>
  )
}