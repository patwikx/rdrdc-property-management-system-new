import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, AlertTriangle, User, CheckCircle, Clock, Search, Plus, FileText, X } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateTitleForm } from "./create-title-form"

interface PropertyTitlesProps {
  property: PropertyWithDetails
}

type EncumbranceFilter = "all" | "encumbered" | "clear"
type TaxStatusFilter = "all" | "paid" | "unpaid"

const ITEMS_PER_PAGE = 12

export function PropertyTitles({ property }: PropertyTitlesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [encumbranceFilter, setEncumbranceFilter] = useState<EncumbranceFilter>("all")
  const [taxStatusFilter, setTaxStatusFilter] = useState<TaxStatusFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const handleTitleCreated = () => {
    setIsAddDialogOpen(false)
    window.location.reload()
  }

  // Filter titles based on search term and filters
  const filteredTitles = property.titles.filter(title => {
    // Encumbrance filter
    if (encumbranceFilter === "encumbered" && !title.isEncumbered) return false
    if (encumbranceFilter === "clear" && title.isEncumbered) return false

    // Tax status filter
    if (taxStatusFilter !== "all") {
      const hasUnpaidTaxes = title.propertyTaxes.some(tax => !tax.isPaid)
      if (taxStatusFilter === "unpaid" && !hasUnpaidTaxes) return false
      if (taxStatusFilter === "paid" && hasUnpaidTaxes) return false
    }

    // Search filter
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      title.titleNo.toLowerCase().includes(searchLower) ||
      title.lotNo.toLowerCase().includes(searchLower) ||
      title.registeredOwner.toLowerCase().includes(searchLower)
    )
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredTitles.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTitles = filteredTitles.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleEncumbranceFilterChange = (value: string) => {
    setEncumbranceFilter(value as EncumbranceFilter)
    setCurrentPage(1)
  }

  const handleTaxStatusFilterChange = (value: string) => {
    setTaxStatusFilter(value as TaxStatusFilter)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setEncumbranceFilter("all")
    setTaxStatusFilter("all")
    setCurrentPage(1)
  }

  // Calculate summary statistics
  const totalTitles = property.titles.length
  const encumberedTitles = property.titles.filter(title => title.isEncumbered).length
  const totalArea = property.titles.reduce((sum, title) => sum + title.lotArea, 0)
  const totalTaxes = property.titles.reduce((sum, title) => sum + title.propertyTaxes.length, 0)
  const unpaidTaxes = property.titles.reduce((sum, title) => 
    sum + title.propertyTaxes.filter(tax => !tax.isPaid).length, 0
  )

  if (property.titles.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No property titles found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any registered titles yet.
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Title
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Property Title</DialogTitle>
            </DialogHeader>
            <CreateTitleForm 
              propertyId={property.id}
              onSuccess={handleTitleCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Titles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTitles}</div>
            <p className="text-xs text-muted-foreground">
              {totalArea.toLocaleString()} sqm total area
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encumbered</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{encumberedTitles}</div>
            <p className="text-xs text-muted-foreground">
              {encumberedTitles > 0 ? 'Requires attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Taxes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTaxes}</div>
            <p className="text-xs text-muted-foreground">
              Total tax records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Taxes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{unpaidTaxes}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidTaxes > 0 ? 'Needs payment' : 'All paid'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Property Titles ({property.titles.length})</h3>
          <p className="text-sm text-muted-foreground">Manage and view all property title records</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Title
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Property Title</DialogTitle>
            </DialogHeader>
            <CreateTitleForm 
              propertyId={property.id}
              onSuccess={handleTitleCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title number, lot number, or owner..."
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
          value={encumbranceFilter}
          onValueChange={handleEncumbranceFilterChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="clear">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span>Clear</span>
              </div>
            </SelectItem>
            <SelectItem value="encumbered">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <span>Encumbered</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={taxStatusFilter}
          onValueChange={handleTaxStatusFilterChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Taxes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Taxes</SelectItem>
            <SelectItem value="paid">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <span>All Paid</span>
              </div>
            </SelectItem>
            <SelectItem value="unpaid">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-600" />
                <span>Has Unpaid</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || encumbranceFilter !== "all" || taxStatusFilter !== "all") && (
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
      {(searchTerm || encumbranceFilter !== "all" || taxStatusFilter !== "all") && (
        <div className="text-sm text-muted-foreground">
          {filteredTitles.length} of {property.titles.length} titles
        </div>
      )}

      {/* No Results Message */}
      {filteredTitles.length === 0 && (
        <div className="text-center py-8">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="mt-2 text-sm font-semibold">No titles found</h4>
          <p className="text-sm text-muted-foreground">
            No titles match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}

      {/* Title Records - Card Grid */}
      {paginatedTitles.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedTitles.map((title) => (
              <Card key={title.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {title.titleNo}
                    </CardTitle>
                    {title.isEncumbered ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Encumbered
                      </Badge>
                    ) : (
                      <Badge className="bg-green-600 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Clear
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-3">
                  {/* Property Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lot No:</span>
                      <span className="font-medium">{title.lotNo}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Area:</span>
                      <span className="font-medium">{title.lotArea.toLocaleString()} sqm</span>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Owner</span>
                    </div>
                    <p className="font-semibold text-sm leading-tight">{title.registeredOwner}</p>
                  </div>

                  {/* Property Taxes */}
                  {title.propertyTaxes.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">Taxes</span>
                        </div>
                        <span className="text-xs font-medium">{title.propertyTaxes.length} records</span>
                      </div>
                      <div className="space-y-1">
                        {title.propertyTaxes.slice(0, 2).map((tax) => (
                          <div key={tax.id} className="flex items-center justify-between text-xs bg-background border rounded p-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{tax.taxYear}</span>
                              <span className="text-muted-foreground">₱{tax.taxAmount.toLocaleString()}</span>
                            </div>
                            {tax.isPaid ? (
                              <Badge className="bg-green-600 text-xs h-5 px-2">
                                <CheckCircle className="h-3 w-3" />
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-600 text-xs h-5 px-2">
                                <Clock className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        ))}
                        {title.propertyTaxes.length > 2 && (
                          <div className="text-center">
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              +{title.propertyTaxes.length - 2} more
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <Receipt className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No tax records</p>
                    </div>
                  )}

                  {/* Encumbrance Details */}
                  {title.isEncumbered && title.encumbranceDetails && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-2">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide font-medium">Encumbrance</span>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 leading-tight">{title.encumbranceDetails}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
            Showing {startIndex + 1}-{Math.min(endIndex, filteredTitles.length)} of {filteredTitles.length} titles
            {(searchTerm || encumbranceFilter !== "all" || taxStatusFilter !== "all") && ` (filtered from ${property.titles.length} total)`}
          </div>
        </>
      )}
    </div>
  )
}