
// components/dashboard/overdue-payments.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Payment {
  id: string
  amount: number
  paymentDate: Date
  lease: {
    tenant: {
      firstName: string | null
      lastName: string | null
      company: string
      bpCode: string
    }
  }
}

interface OverduePaymentsProps {
  payments: Payment[]
}

export function OverduePayments({ payments }: OverduePaymentsProps) {
  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base tracking-tight">Overdue Payments</CardTitle>
            <CardDescription className="text-[11px]">Outstanding collections</CardDescription>
          </div>
          <Link href="/financial/payments?filter=overdue">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
                <DollarSign className="h-5 w-5 text-emerald-600/50" />
              </div>
              <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-widest">
                All collections current
              </p>
            </div>
          ) : (
            payments.slice(0, 5).map((payment) => (
              <div 
                key={payment.id} 
                className="group relative flex items-start gap-3 pb-3 border-b border-muted/40 last:border-0 last:pb-0 transition-colors hover:bg-muted/5 -mx-1 px-1 rounded-lg"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold leading-snug text-foreground/90 tracking-tight">
                    {payment.lease.tenant.company || `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-foreground tracking-tighter">₱{payment.amount.toLocaleString()}</span>
                    <span className="opacity-30 text-[10px]">•</span>
                    <span className="text-[10px] font-medium text-rose-600 uppercase tracking-tight">Due {format(new Date(payment.paymentDate), 'MMM dd')}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <Badge variant="destructive" className="text-[8px] font-black h-4 px-1 rounded-sm tracking-widest">OVERDUE</Badge>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">{payment.lease.tenant.bpCode}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}