import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, Phone, Building, CreditCard, Calendar, Clock } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { format, differenceInDays, isAfter } from "date-fns"

interface UnitTenantProps {
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

export function UnitTenant({ unit }: UnitTenantProps) {
  // Get current active lease
  const currentLease = unit.leaseUnits.find(lu => lu.lease.status === 'ACTIVE')?.lease
  const currentTenant = currentLease?.tenant

  if (!currentTenant || !currentLease) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Current Tenant</h3>
          <p className="mt-2 text-muted-foreground">
            This unit is currently vacant or not leased.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate lease progress
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
    if (isExpired) return "bg-red-500"
    if (isExpiringSoon) return "bg-yellow-500"
    if (progressPercentage > 75) return "bg-orange-500"
    return "bg-green-500"
  }
  
  function getProgressStatus() {
    if (isExpired) return "Expired"
    if (isExpiringSoon) return "Expiring Soon"
    if (progressPercentage > 75) return "Nearing End"
    return "Active"
  }

  return (
    <div className="space-y-6">
      {/* Tenant Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Tenant Information</span>
          </CardTitle>
          <CardDescription>Current tenant details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Personal Details */}
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Personal Details</span>
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{currentTenant.firstName} {currentTenant.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">BP Code</p>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded w-fit">{currentTenant.bpCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="outline">{currentTenant.status}</Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Contact Information</span>
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{currentTenant.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{currentTenant.phone}</p>
                </div>
                {currentTenant.emergencyContactName && (
                  <>
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Emergency Contact</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="font-semibold">{currentTenant.emergencyContactName}</p>
                    </div>
                    {currentTenant.emergencyContactPhone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p>{currentTenant.emergencyContactPhone}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Business Information</span>
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p className="font-semibold">{currentTenant.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                  <p>{currentTenant.businessName}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lease Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Lease Progress</span>
          </CardTitle>
          <CardDescription>Current lease term timeline and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Lease Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={`${getProgressColor().replace('bg-', 'border-')} ${getProgressColor().replace('bg-', 'text-')}`}>
                  {getProgressStatus()}
                </Badge>
                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
            
            <Progress 
              value={progressPercentage} 
              className="h-3"
              style={{
                '--progress-background': getProgressColor().replace('bg-', '')
              } as React.CSSProperties}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{format(startDate, 'MMM dd, yyyy')}</span>
              <span>{format(endDate, 'MMM dd, yyyy')}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totalDays}</p>
              <p className="text-xs text-muted-foreground">Total Days</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">{Math.max(elapsedDays, 0)}</p>
              <p className="text-xs text-muted-foreground">Days Elapsed</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className={`text-2xl font-bold ${remainingDays <= 0 ? 'text-red-600' : remainingDays <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                {Math.max(remainingDays, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Days Remaining</p>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Lease expires in {remainingDays} days - Consider renewal discussions
                </span>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Lease expired {Math.abs(remainingDays)} days ago - Action required
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lease Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Lease Agreement</span>
          </CardTitle>
          <CardDescription>Current lease terms and conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="text-lg font-semibold">{format(new Date(currentLease.startDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="text-lg font-semibold">{format(new Date(currentLease.endDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
              <p className="text-lg font-semibold">₱{currentLease.totalRentAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Security Deposit</p>
              <p className="text-lg font-semibold">₱{currentLease.securityDeposit.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lease Status</p>
                <Badge className={getLeaseStatusColor(currentLease.status)}>
                  {currentLease.status}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{format(new Date(currentLease.createdAt), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}