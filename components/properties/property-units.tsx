import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Search, Plus, X, FileText, ChevronRight } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { UnitStatus } from "@prisma/client"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PropertyUnitsProps {
  property: PropertyWithDetails
}

const ITEMS_PER_PAGE = 12

export function PropertyUnits({ property }: PropertyUnitsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500' }
      case 'VACANT': return { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-500' }
      case 'MAINTENANCE': return { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-500' }
      case 'RESERVED': return { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500' }
      default: return { border: 'border-muted', text: 'text-muted-foreground', bg: 'bg-muted' }
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
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Building2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Spaces Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Get started by adding units to this property
        </p>
        <Link href={`/properties/${property.id}/units/create`}>
          <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
            <Plus className="h-3 w-3 mr-2" />
            Add First Space
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            All Spaces
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Total Inventory: {property.units.length} Units
          </p>
        </div>
        <Link href={`/properties/${property.id}/units/create`}>
          <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
            <Plus className="h-3 w-3 mr-2" />
            Add Space
          </Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spaces..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Filter: All" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Status</SelectItem>
              <SelectItem value={UnitStatus.OCCUPIED} className="font-mono text-xs uppercase">Occupied</SelectItem>
              <SelectItem value={UnitStatus.VACANT} className="font-mono text-xs uppercase">Vacant</SelectItem>
              <SelectItem value={UnitStatus.MAINTENANCE} className="font-mono text-xs uppercase">Maintenance</SelectItem>
              <SelectItem value={UnitStatus.RESERVED} className="font-mono text-xs uppercase">Reserved</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="rounded-none border-border h-10 px-3 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {(searchTerm || statusFilter !== "all") && (
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
          Found {filteredUnits.length} matching spaces
        </div>
      )}

      {/* No Results Message */}
      {filteredUnits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border bg-muted/5">
          <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-xs font-mono uppercase text-muted-foreground">No matches found</p>
        </div>
      )}

      {/* Units Grid */}
      {paginatedUnits.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedUnits.map((unit) => {
              const styles = getStatusStyle(unit.status)
              return (
                <Link key={unit.id} href={`/properties/${property.id}/units/${unit.id}`} className="group block h-full">
                  <div className="border border-border bg-background hover:border-primary/50 transition-all h-full flex flex-col relative overflow-hidden group-hover:shadow-none">
                    {/* Status Line */}
                    <div className={`h-1 w-full ${styles.bg}`} />
                    
                    <div className="p-4 flex-1 flex flex-col">
                      {/* HEADER: Identity */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Unit Number</span>
                          <span className="font-mono text-lg font-bold tracking-tight">{unit.unitNumber}</span>
                        </div>
                        <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border ${styles.border} ${styles.text} bg-transparent`}>
                          {unit.status}
                        </Badge>
                      </div>
                      
                      {/* BODY: Key Metrics */}
                      <div className="grid grid-cols-2 gap-4 py-3 border-t border-dashed border-border/50">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Total Area</span>
                          <span className="text-xs font-mono font-medium">{unit.totalArea.toLocaleString()} sqm</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Monthly Rent</span>
                          <span className="text-xs font-mono font-medium">₱{unit.totalRent.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* FOOTER: Context/Metadata */}
                      <div className="mt-auto pt-3 border-t border-border/50">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider block">Property Title</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate">
                            <FileText className="h-3 w-3 shrink-0" />
                            {unit.propertyTitle ? (
                              <span className="truncate" title={unit.propertyTitle.titleNo}>{unit.propertyTitle.titleNo}</span>
                            ) : (
                              <span className="opacity-50 italic">Not Linked</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Action Overlay (Subtle) */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-1 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-none h-8 px-2 font-mono text-xs border-border disabled:opacity-30"
              >
                PREV
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "rounded-none h-8 w-8 p-0 font-mono text-xs",
                    pageNum === currentPage ? "bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                  )}
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-none h-8 px-2 font-mono text-xs border-border disabled:opacity-30"
              >
                NEXT
              </Button>
            </div>
          )}

          {/* Showing X of Y message */}
          <div className="flex justify-between items-center border-t border-border pt-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredUnits.length)} of {filteredUnits.length}</span>
            {(searchTerm || statusFilter !== "all") && <span>(Total: {property.units.length})</span>}
          </div>
        </>
      )}
    </div>
  )
}