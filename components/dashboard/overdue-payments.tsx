
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
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overdue Payments</CardTitle>
            <CardDescription>Payments past due date</CardDescription>
          </div>
          {payments.length > 0 && (
            <Link href="/financial/payments?filter=overdue">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No overdue payments
              </p>
              <p className="text-xs text-green-600 mt-1">
                All payments are up to date
              </p>
            </div>
          ) : (
            payments.slice(0, 5).map((payment) => (
              <div 
                key={payment.id} 
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {payment.lease.tenant.company || `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Amount: ₱{payment.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-destructive font-medium">
                    Due: {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="destructive" className="mb-1">OVERDUE</Badge>
                  <p className="text-xs text-muted-foreground">{payment.lease.tenant.bpCode}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}