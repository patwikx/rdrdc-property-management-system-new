import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, User, Receipt, FileText, DollarSign, Ruler, Calendar, Clock, Info, Layers, Phone, Mail, Building as CompanyIcon } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { format, differenceInDays, isAfter } from "date-fns"

interface UnitOverviewProps {
  unit: UnitWithDetails
}

export function UnitOverview({ unit }: UnitOverviewProps) {
  // Get current active lease
  const currentLease = unit.leaseUnits.find(lu => lu.lease.status === 'ACTIVE')?.lease
  const currentTenant = currentLease?.tenant

  // Calculate lease progress if there's an active lease
  let leaseProgress = null
  if (currentLease) {
    const now = new Date()
    const startDate = new Date(currentLease.startDate)
    const endDate = new Date(currentLease.endDate)
    
    const totalDays = differenceInDays(endDate, startDate)
    const elapsedDays = differenceInDays(now, startDate)
    const remainingDays = differenceInDays(endDate, now)
    
    // Calculate progress percentage (0-100)
    let progressPercentage = 0
    if (isAfter(now, startDate)) {
      progressPercentage = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100)
    }
    
    // Determine lease status
    const isExpired = isAfter(now, endDate)
    const isExpiringSoon = remainingDays <= 30 && remainingDays > 0
    
    function getProgressColor() {
      if (isExpired) return "bg-rose-500"
      if (isExpiringSoon) return "bg-amber-500"
      if (progressPercentage > 75) return "bg-orange-500"
      return "bg-emerald-500"
    }
    
    function getProgressStatus() {
      if (isExpired) return "Expired"
      if (isExpiringSoon) return "Expiring Soon"
      if (progressPercentage > 75) return "Nearing End"
      return "Active"
    }

    leaseProgress = {
      progressPercentage,
      remainingDays,
      isExpired,
      isExpiringSoon,
      getProgressColor,
      getProgressStatus,
      startDate,
      endDate
    }
  }

  return (
    <div className="space-y-6">
      {/* MAIN SPEC SHEET */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Info className="h-3 w-3" />
            Space Specification
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* LEFT COLUMN: IDENTITY */}
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Space Number</label>
              <div className="font-mono text-sm font-medium text-foreground">{unit.unitNumber}</div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Property</label>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{unit.property.propertyName}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Title Reference</label>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                {unit.propertyTitle ? (
                  <span className="text-sm font-mono">{unit.propertyTitle.titleNo}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No title linked</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: METRICS */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Total Area</label>
                <div className="flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono">{unit.totalArea.toLocaleString()} sqm</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Monthly Rent</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono font-medium">₱{unit.totalRent.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-4 border-t border-dashed border-border">
              <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Floor Count</label>
              <div className="flex items-center gap-2 mt-1">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{unit.unitFloors.length} Floor Level{unit.unitFloors.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CURRENT LEASE & TENANT */}
      {currentLease && (
        <div className="border border-border bg-background">
          <div className="border-b border-border bg-muted/10 p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Receipt className="h-3 w-3" />
              Active Lease Agreement
            </span>
          </div>
          
          <div className="p-0 divide-y divide-border">
            
            {/* 1. TENANT PROFILE (Top Priority) */}
            {currentTenant && (
              <div className="p-6 bg-muted/5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Primary Tenant</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Identity */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-primary/10 flex items-center justify-center rounded-none border border-primary/20">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-base font-medium">{currentTenant.firstName} {currentTenant.lastName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <CompanyIcon className="h-3 w-3" />
                          {currentTenant.company || "Individual"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">
                        BP: {currentTenant.bpCode}
                      </Badge>
                      <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase bg-green-500/10 text-green-600 border-green-500/20">
                        {currentTenant.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-3 text-sm border-l border-dashed border-border pl-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`mailto:${currentTenant.email}`} className="hover:text-primary transition-colors">
                        {currentTenant.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono">{currentTenant.phone}</span>
                    </div>
                    {currentTenant.emergencyContactName && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Emergency</span>
                        <div className="flex justify-between items-center text-xs">
                          <span>{currentTenant.emergencyContactName}</span>
                          <span className="font-mono text-muted-foreground">{currentTenant.emergencyContactPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. LEASE TERMS & METRICS */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Duration</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono">
                    {format(new Date(currentLease.startDate), 'MMM dd, yyyy')} - {format(new Date(currentLease.endDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Monthly Rent</label>
                <span className="text-sm font-mono font-medium">₱{currentLease.totalRentAmount.toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Security Deposit</label>
                <span className="text-sm font-mono">₱{currentLease.securityDeposit.toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-muted-foreground tracking-widest block">Status</label>
                <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-widest border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
                  {currentLease.status}
                </Badge>
              </div>
            </div>

            {/* 3. FLOOR CONFIGURATION */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Leased Floor Configuration</h3>
              </div>
              
              {unit.unitFloors.length > 0 ? (
                <div className="border border-border rounded-none divide-y divide-border">
                  {unit.unitFloors.map((floor) => (
                    <div key={floor.id} className="flex items-center justify-between p-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-background border border-border flex items-center justify-center rounded-none shadow-sm">
                          <span className="text-[10px] font-mono font-bold">{floor.floorType.charAt(0)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold block text-foreground">{floor.floorType.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {floor.area.toLocaleString()} sqm
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-medium block">₱{floor.rent.toLocaleString()}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">₱{floor.rate.toLocaleString()}/sqm</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-border text-center bg-muted/5">
                  <span className="text-[10px] text-muted-foreground italic">No floor configuration defined</span>
                </div>
              )}
            </div>

            {/* 4. LEASE TIMELINE */}
            {leaseProgress && (
              <div className="p-6 bg-muted/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lease Timeline</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium">{Math.round(leaseProgress.progressPercentage)}% Complete</span>
                    <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border-0 ${leaseProgress.getProgressColor().replace('bg-', 'text-')}`}>
                      {leaseProgress.getProgressStatus()}
                    </Badge>
                  </div>
                </div>
                
                <Progress 
                  value={leaseProgress.progressPercentage} 
                  className="h-1.5 rounded-none bg-border/50" 
                  indicatorClassName={leaseProgress.getProgressColor()}
                />
                
                <div className="grid gap-4 md:grid-cols-3 pt-6">
                  <div className="border border-border p-3 bg-background">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Elapsed</div>
                    <div className="text-lg font-mono font-bold text-foreground">
                      {Math.max(differenceInDays(new Date(), leaseProgress.startDate), 0)} <span className="text-xs font-normal text-muted-foreground">days</span>
                    </div>
                  </div>
                  <div className="border border-border p-3 bg-background">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Remaining</div>
                    <div className={`text-lg font-mono font-bold ${leaseProgress.remainingDays <= 30 ? 'text-amber-600' : 'text-foreground'}`}>
                      {Math.max(leaseProgress.remainingDays, 0)} <span className="text-xs font-normal text-muted-foreground">days</span>
                    </div>
                  </div>
                  <div className="border border-border p-3 bg-background">
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Total Term</div>
                    <div className="text-lg font-mono font-bold text-foreground">
                      {differenceInDays(leaseProgress.endDate, leaseProgress.startDate)} <span className="text-xs font-normal text-muted-foreground">days</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}