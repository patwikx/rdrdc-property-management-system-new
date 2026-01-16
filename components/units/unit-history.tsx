import { Badge } from "@/components/ui/badge"
import { History, Calendar, User, FileText } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { format } from "date-fns"

interface UnitHistoryProps {
  unit: UnitWithDetails
}

function getLeaseStatusStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { border: 'border-l-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'PENDING': return { border: 'border-l-amber-500', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    case 'TERMINATED': return { border: 'border-l-rose-500', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }
    case 'EXPIRED': return { border: 'border-l-slate-500', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }
    default: return { border: 'border-l-slate-500', badge: 'bg-muted/10 text-muted-foreground border-border' }
  }
}

export function UnitHistory({ unit }: UnitHistoryProps) {
  const leaseHistory = unit.leaseUnits
    .map(lu => lu.lease)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (leaseHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <History className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No History Recorded</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          No lease records found for this space
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Lease History Log
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Total Records: {leaseHistory.length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {leaseHistory.map((lease) => {
          const styles = getLeaseStatusStyle(lease.status)
          
          return (
            <div key={lease.id} className={`group border border-border border-l-4 ${styles.border} bg-background hover:bg-muted/5 transition-all p-0`}>
              {/* Header / Identity */}
              <div className="flex items-start justify-between p-4 border-b border-dashed border-border/50">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-foreground">
                      {lease.tenant.company || `${lease.tenant.firstName} ${lease.tenant.lastName}`}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">BP: {lease.tenant.bpCode}</span>
                      {lease.tenant.company && (
                        <span className="text-xs text-muted-foreground">• {lease.tenant.firstName} {lease.tenant.lastName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={`rounded-none text-[10px] uppercase tracking-widest border-0 ${styles.badge}`}>
                  {lease.status}
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
                <div className="p-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">Duration</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-mono">
                      {format(new Date(lease.startDate), 'MMM dd, yyyy')} <span className="text-muted-foreground mx-1">→</span> {format(new Date(lease.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1.5">Financials</span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Rent</span>
                      <span className="text-sm font-mono font-medium">₱{lease.totalRentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Deposit</span>
                      <span className="text-xs font-mono text-muted-foreground">₱{lease.securityDeposit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-center">
                  {lease.terminationDate ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-rose-600 uppercase tracking-widest font-bold flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> Terminated
                      </span>
                      <p className="text-xs text-muted-foreground">
                        On {format(new Date(lease.terminationDate), 'MMM dd, yyyy')}
                      </p>
                      {lease.terminationReason && (
                        <p className="text-xs italic text-muted-foreground/80 line-clamp-1" title={lease.terminationReason}>
                          &quot;{lease.terminationReason}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[10px] uppercase tracking-wider">Record ID</span>
                      <span className="text-xs font-mono">#{lease.id.slice(0, 8)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}