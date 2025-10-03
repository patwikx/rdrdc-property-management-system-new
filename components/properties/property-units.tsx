import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, Search, Plus } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import Link from "next/link"

interface PropertyUnitsProps {
  property: PropertyWithDetails
}

export function PropertyUnits({ property }: PropertyUnitsProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return 'bg-green-600'
      case 'VACANT': return 'bg-gray-600'
      case 'MAINTENANCE': return 'bg-yellow-600'
      case 'RESERVED': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }



  // Filter units based on search term
  const filteredUnits = property.units.filter(unit => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      unit.unitNumber.toLowerCase().includes(searchLower) ||
      unit.status.toLowerCase().includes(searchLower) ||
      (unit.propertyTitle?.titleNo.toLowerCase().includes(searchLower)) ||
      (unit.propertyTitle?.lotNo.toLowerCase().includes(searchLower)) ||
      unit.totalArea.toString().includes(searchLower) ||
      unit.totalRent.toString().includes(searchLower)
    )
  })

  if (property.units.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No spaces found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any spaces yet.
        </p>
        <Link href={`/properties/${property.id}/units/create`}>
          <Button className="mt-4" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Spaces ({property.units.length})</h3>
        <Link href={`/properties/${property.id}/units/create`}>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Space
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      {property.units.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by unit number, status, title, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {searchTerm && (
            <div className="text-sm text-muted-foreground">
              {filteredUnits.length} of {property.units.length} spaces
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {property.units.length > 0 && filteredUnits.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="mt-2 text-sm font-semibold">No spaces found</h4>
          <p className="text-sm text-muted-foreground">
            No spaces match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {filteredUnits.map((unit) => (
          <Link key={unit.id} href={`/properties/${property.id}/units/${unit.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{unit.unitNumber}</span>
                  </div>
                  <Badge className={getStatusColor(unit.status)}>
                    {unit.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Area:</span>
                    <span className="font-medium">{unit.totalArea.toLocaleString()} sqm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rent:</span>
                    <span className="font-medium">₱{unit.totalRent.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      {unit.propertyTitle ? (
                        <>Title: {unit.propertyTitle.titleNo} (Lot {unit.propertyTitle.lotNo})</>
                      ) : (
                        <span className="italic">No title linked</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}