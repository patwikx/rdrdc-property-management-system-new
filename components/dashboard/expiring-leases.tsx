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
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expiring Leases</CardTitle>
            <CardDescription>Leases expiring in the next 30 days</CardDescription>
          </div>
          {leases.length > 0 && (
            <Link href="/tenants/leases?filter=expiring">
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
          {leases.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No leases expiring soon
              </p>
            </div>
          ) : (
            leases.slice(0, 5).map((lease) => (
              <div 
                key={lease.id} 
                className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {lease.tenant.company || `${lease.tenant.firstName} ${lease.tenant.lastName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lease.leaseUnits.map(lu => lu.unit.unitNumber).join(', ')} - {lease.leaseUnits[0]?.unit.property.propertyName}
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    Expires: {format(new Date(lease.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
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