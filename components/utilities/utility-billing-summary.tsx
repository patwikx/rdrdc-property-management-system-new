"use client"

import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  DollarSign 
} from "lucide-react"
import type { UtilityBillingSummary as SummaryType } from "@/lib/actions/utility-billing-actions"

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
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      {/* Total Bills */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Bills</span>
          <FileText className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-foreground">{summary.totalBills}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Records</span>
        </div>
      </div>

      {/* Overdue Bills */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Overdue</span>
          <AlertTriangle className="h-4 w-4 text-rose-600/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-rose-600">{summary.overdueCount}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide font-mono">
            {formatCurrency(summary.totalOverdueAmount)}
          </span>
        </div>
      </div>

      {/* Due Soon */}
      <div className="p-4 border-r border-border flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Due Soon</span>
          <Clock className="h-4 w-4 text-amber-600/50" />
        </div>
        <div>
          <span className="text-3xl font-mono font-medium tracking-tighter text-amber-600">{summary.upcomingCount}</span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Next 7 Days</span>
        </div>
      </div>

      {/* Total Amount Due */}
      <div className="p-4 flex flex-col justify-between h-28 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Outstanding</span>
          <DollarSign className="h-4 w-4 text-primary/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-foreground">
             {formatCurrency(summary.totalAmountDue)}
          </span>
          <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wide">Receivable</span>
        </div>
      </div>
    </div>
  )
}
