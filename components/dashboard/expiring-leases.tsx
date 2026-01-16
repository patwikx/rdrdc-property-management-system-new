// components/dashboard/expiring-leases.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Lease {
  id: string
  endDate: Date
  tenant: {
    firstName: string | null
    lastName: string | null
    company: string
    bpCode: string
  }
  leaseUnits: Array<{
    unit: {
      unitNumber: string
      property: {
        propertyName: string
      }
    }
  }>
}

interface ExpiringLeasesProps {
  leases: Lease[]
}

export function ExpiringLeases({ leases }: ExpiringLeasesProps) {
  return (
    <Card className="col-span-1 border-muted/60 shadow-sm transition-all hover:shadow-md flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base tracking-tight">Expiring Leases</CardTitle>
            <CardDescription className="text-[11px]">Leases ending in 30 days</CardDescription>
          </div>
          <Link href="/tenants/leases?filter=expiring">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {leases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-emerald-600/50" />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground italic">
                No leases expiring soon
              </p>
            </div>
          ) : (
            leases.slice(0, 5).map((lease) => (
              <div 
                key={lease.id} 
                className="group relative flex items-start gap-3 pb-3 border-b border-muted/40 last:border-0 last:pb-0 transition-colors hover:bg-muted/5 -mx-1 px-1 rounded-lg"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold leading-snug text-foreground/90 tracking-tight">
                    {lease.tenant.company || `${lease.tenant.firstName} ${lease.tenant.lastName}`}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
                    {lease.leaseUnits.map(lu => lu.unit.unitNumber).join(', ')} • {lease.leaseUnits[0]?.unit.property.propertyName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                      Ends {format(new Date(lease.endDate), 'MMM dd')}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[9px] font-bold h-5 px-1.5 bg-muted/50 text-muted-foreground">
                  {lease.tenant.bpCode}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}