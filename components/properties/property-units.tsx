import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Search, Plus, X } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { UnitStatus } from "@prisma/client"
import Link from "next/link"

interface PropertyUnitsProps {
  property: PropertyWithDetails
}

const ITEMS_PER_PAGE = 12

export function PropertyUnits({ property }: PropertyUnitsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return 'bg-red-600'
      case 'VACANT': return 'bg-green-600'
      case 'MAINTENANCE': return 'bg-yellow-600'
      case 'RESERVED': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }

  // Filter units based on search term and status
  const filteredUnits = property.units.filter(unit => {
    // Status filter
    if (statusFilter !== "all" && unit.status !== statusFilter) {
      return false
    }

    // Search filter
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUnits = filteredUnits.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as UnitStatus | "all")
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

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

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by unit number, status, title, or amount..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select
          value={statusFilter}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={UnitStatus.OCCUPIED}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <span>Occupied</span>
              </div>
            </SelectItem>
            <SelectItem value={UnitStatus.VACANT}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span>Vacant</span>
              </div>
            </SelectItem>
            <SelectItem value={UnitStatus.MAINTENANCE}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-600" />
                <span>Maintenance</span>
              </div>
            </SelectItem>
            <SelectItem value={UnitStatus.RESERVED}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Reserved</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || statusFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      {(searchTerm || statusFilter !== "all") && (
        <div className="text-sm text-muted-foreground">
          {filteredUnits.length} of {property.units.length} spaces
        </div>
      )}

      {/* No Results Message */}
      {filteredUnits.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="mt-2 text-sm font-semibold">No spaces found</h4>
          <p className="text-sm text-muted-foreground">
            No spaces match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}

      {/* Units Grid */}
      {paginatedUnits.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {paginatedUnits.map((unit) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Showing X of Y message */}
          <div className="text-center text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUnits.length)} of {filteredUnits.length} spaces
            {(searchTerm || statusFilter !== "all") && ` (filtered from ${property.units.length} total)`}
          </div>
        </>
      )}
    </div>
  )
}