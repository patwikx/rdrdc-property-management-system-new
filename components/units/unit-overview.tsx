import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, User, Receipt, FileText, DollarSign, Ruler, Calendar, Clock } from "lucide-react"
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
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Area</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unit.totalArea.toLocaleString()} sqm</div>
            <p className="text-xs text-muted-foreground">
              {unit.unitFloors.length} floor{unit.unitFloors.length !== 1 ? 's' : ''} configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{unit.totalRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₱{unit.unitFloors.length > 0 ? (unit.totalRent / unit.totalArea).toFixed(2) : '0'} per sqm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tenant</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {currentTenant ? (
                <div>
                  <p className="truncate">{currentTenant.firstName} {currentTenant.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentTenant.company}</p>
                </div>
              ) : (
                <span className="text-muted-foreground">Vacant</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Title</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {unit.propertyTitle ? (
                <div>
                  <p className="truncate">{unit.propertyTitle.titleNo}</p>
                  <p className="text-xs text-muted-foreground">Lot {unit.propertyTitle.lotNo}</p>
                </div>
              ) : (
                <span className="text-muted-foreground">No title linked</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Floor Configuration</span>
          </CardTitle>
          <CardDescription>Breakdown of unit floors and rental rates</CardDescription>
        </CardHeader>
        <CardContent>
          {unit.unitFloors.length > 0 ? (
            <div className="space-y-4">
              {unit.unitFloors.map((floor) => (
                <div key={floor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-medium">{floor.floorType.replace('_', ' ')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {floor.area.toLocaleString()} sqm × ₱{floor.rate.toLocaleString()}/sqm
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₱{floor.rent.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Monthly</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total Monthly Rent:</span>
                  <span>₱{unit.totalRent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <h4 className="mt-2 text-sm font-semibold">No floor configuration</h4>
              <p className="text-sm text-muted-foreground">
                This unit has no floor configuration set up yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Lease Summary */}
      {currentLease && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Current Lease</span>
            </CardTitle>
            <CardDescription>Active lease information and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lease Period</p>
                <p className="text-lg font-semibold">
                  {format(new Date(currentLease.startDate), 'MMM dd, yyyy')} - {format(new Date(currentLease.endDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                <p className="text-lg font-semibold">₱{currentLease.totalRentAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Deposit</p>
                <p className="text-lg font-semibold">₱{currentLease.securityDeposit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className="bg-green-600">
                  {currentLease.status}
                </Badge>
              </div>
            </div>

            {/* Lease Progress */}
            {leaseProgress && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Lease Progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`${leaseProgress.getProgressColor().replace('bg-', 'border-')} ${leaseProgress.getProgressColor().replace('bg-', 'text-')}`}>
                      {leaseProgress.getProgressStatus()}
                    </Badge>
                    <span className="text-sm font-medium">{Math.round(leaseProgress.progressPercentage)}%</span>
                  </div>
                </div>
                
                <Progress 
                  value={leaseProgress.progressPercentage} 
                  className="h-2"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{format(leaseProgress.startDate, 'MMM dd, yyyy')}</span>
                  <span>{format(leaseProgress.endDate, 'MMM dd, yyyy')}</span>
                </div>

                <div className="grid gap-2 md:grid-cols-3 text-center">
                  <div className="p-2 border rounded">
                    <p className="text-lg font-bold text-green-600">{Math.max(differenceInDays(new Date(), leaseProgress.startDate), 0)}</p>
                    <p className="text-xs text-muted-foreground">Days Elapsed</p>
                  </div>
                  <div className="p-2 border rounded">
                    <p className={`text-lg font-bold ${leaseProgress.remainingDays <= 0 ? 'text-red-600' : leaseProgress.remainingDays <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.max(leaseProgress.remainingDays, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Days Remaining</p>
                  </div>
                  <div className="p-2 border rounded">
                    <p className="text-lg font-bold text-blue-600">{differenceInDays(leaseProgress.endDate, leaseProgress.startDate)}</p>
                    <p className="text-xs text-muted-foreground">Total Days</p>
                  </div>
                </div>

                {leaseProgress.isExpiringSoon && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Lease expires in {leaseProgress.remainingDays} days
                      </span>
                    </div>
                  </div>
                )}

                {leaseProgress.isExpired && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Lease expired {Math.abs(leaseProgress.remainingDays)} days ago
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}