import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { DashboardStats } from "@/lib/types/dashboard-types"

interface FinancialReadoutProps {
  stats: DashboardStats
}

export function FinancialReadout({ stats }: FinancialReadoutProps) {
  const metrics = [
    { label: 'Pending Payments', value: stats.financial.pendingPayments, type: 'count' },
    { label: 'Overdue Amount', value: stats.financial.overduePayments, type: 'currency', highlight: true },
    { label: 'PDC On Hand', value: stats.financial.pdcOpen, type: 'count' },
    { label: 'Cleared Checks', value: stats.financial.pdcDeposited, type: 'count' },
  ]

  return (
    <div className="border border-border bg-background p-0 flex flex-col h-full relative group">
      <div className="p-4 border-b border-border bg-muted/10 flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-none" />
          Financial Status
        </h3>
        <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
      </div>

      <div className="flex-1 p-4 space-y-4">
         {metrics.map((m, i) => (
           <div key={i} className="flex justify-between items-end border-b border-dashed border-border/50 pb-2">
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">{m.label}</span>
              <span className={`font-mono text-lg leading-none ${m.highlight ? 'text-rose-600' : 'text-foreground'}`}>
                 {m.value.toLocaleString()}
              </span>
           </div>
         ))}
      </div>

      <div className="p-4 pt-0">
        <Link href="/financial/payments" className="block">
          <Button variant="outline" className="w-full rounded-none border-border hover:bg-muted/10 text-xs font-mono uppercase h-8">
             Full Report <ArrowUpRight className="ml-2 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  )
}