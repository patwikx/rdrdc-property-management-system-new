import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, DollarSign, Home } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { UnitStatus } from "@prisma/client"

interface PropertyOverviewProps {
  property: PropertyWithDetails
}

export function PropertyOverview({ property }: PropertyOverviewProps) {
  const occupiedUnits = property.units.filter(unit => unit.status === UnitStatus.OCCUPIED).length
  const vacantUnits = property.units.filter(unit => unit.status === UnitStatus.VACANT).length
  const maintenanceUnits = property.units.filter(unit => unit.status === UnitStatus.MAINTENANCE).length
  const reservedUnits = property.units.filter(unit => unit.status === UnitStatus.RESERVED).length
  
  const occupancyRate = property._count.units > 0 ? (occupiedUnits / property._count.units) * 100 : 0
  const totalRent = property.units.reduce((sum, unit) => sum + unit.totalRent, 0)
  const totalArea = property.units.reduce((sum, unit) => sum + unit.totalArea, 0)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property._count.units}</div>
            <p className="text-xs text-muted-foreground">
              {property.totalUnits ? `Target: ${property.totalUnits}` : 'No target set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {occupiedUnits} of {property._count.units} occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total rental income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Area</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              sqm occupied space
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unit Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Status Overview</CardTitle>
          <CardDescription>Current status of all units in this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{occupiedUnits}</div>
              <div className="text-sm text-green-600">Occupied</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-700">{vacantUnits}</div>
              <div className="text-sm text-gray-600">Vacant</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{maintenanceUnits}</div>
              <div className="text-sm text-yellow-600">Maintenance</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{reservedUnits}</div>
              <div className="text-sm text-blue-600">Reserved</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}