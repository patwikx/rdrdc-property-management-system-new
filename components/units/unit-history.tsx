import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Calendar } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { format } from "date-fns"

interface UnitHistoryProps {
  unit: UnitWithDetails
}

function getLeaseStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600'
    case 'PENDING': return 'bg-yellow-600'
    case 'TERMINATED': return 'bg-red-600'
    case 'EXPIRED': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}

export function UnitHistory({ unit }: UnitHistoryProps) {
  // Get lease history (all leases sorted by most recent)
  const leaseHistory = unit.leaseUnits
    .map(lu => lu.lease)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Tenant History</span>
        </CardTitle>
        <CardDescription>All previous and current leases for this unit</CardDescription>
      </CardHeader>
      <CardContent>
        {leaseHistory.length > 0 ? (
          <div className="space-y-4">
            {leaseHistory.map((lease) => (
              <div key={lease.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">
                      {lease.tenant.firstName} {lease.tenant.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">{lease.tenant.company}</p>
                    <p className="text-xs text-muted-foreground mt-1">BP Code: {lease.tenant.bpCode}</p>
                  </div>
                  <Badge className={getLeaseStatusColor(lease.status)}>
                    {lease.status}
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Lease Period</span>
                    <p className="font-medium">
                      {format(new Date(lease.startDate), 'MMM dd, yyyy')} - {format(new Date(lease.endDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Monthly Rent</span>
                    <p className="font-medium">₱{lease.totalRentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Security Deposit</span>
                    <p className="font-medium">₱{lease.securityDeposit.toLocaleString()}</p>
                  </div>
                </div>

                {lease.terminationDate && (
                  <div className="mt-4 pt-4 border-t border-muted">
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Terminated:</span>
                      <span className="ml-2">{format(new Date(lease.terminationDate), 'MMM dd, yyyy')}</span>
                    </div>
                    {lease.terminationReason && (
                      <div className="text-sm mt-1">
                        <span className="font-medium text-muted-foreground">Reason:</span>
                        <span className="ml-2">{lease.terminationReason}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 text-sm font-semibold">No lease history</h4>
            <p className="text-sm text-muted-foreground">
              This unit has no lease records yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}