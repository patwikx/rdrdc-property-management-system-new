import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, AlertTriangle, User, Search, Plus, FileText, X, Scale, File, AlertCircle, ChevronRight } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateTitleForm } from "./create-title-form"
import { cn } from "@/lib/utils"

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
  const unpaidTaxes = property.titles.reduce((sum, title) => 
    sum + title.propertyTaxes.filter(tax => !tax.isPaid).length, 0
  )

  const getStatusStyle = (isEncumbered: boolean) => {
    if (isEncumbered) {
      return { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-500' }
    }
    return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500' }
  }

  if (property.titles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Titles Registered</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Start by adding a property title
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <Plus className="h-3 w-3 mr-2" />
              Add First Title
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Register New Title</DialogTitle>
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
    <div className="space-y-6">
      {/* SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Titles</span>
            <File className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter">{totalTitles}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Records</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Lot Area</span>
            <Scale className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter">{totalArea.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground ml-2">SQM</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Encumbrances</span>
            <AlertTriangle className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className={cn("text-2xl font-mono font-medium tracking-tighter", encumberedTitles > 0 ? "text-rose-600" : "text-emerald-600")}>
              {encumberedTitles}
            </span>
            <span className="text-[10px] text-muted-foreground ml-2">Active</span>
          </div>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Tax Issues</span>
            <Receipt className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className={cn("text-2xl font-mono font-medium tracking-tighter", unpaidTaxes > 0 ? "text-amber-600" : "text-emerald-600")}>
              {unpaidTaxes}
            </span>
            <span className="text-[10px] text-muted-foreground ml-2">Unpaid</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Property Titles
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Registered Land Titles
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              <Plus className="h-3 w-3 mr-2" />
              Add Title
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Register New Title</DialogTitle>
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
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search titles..."
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
            value={encumbranceFilter}
            onValueChange={handleEncumbranceFilterChange}
          >
            <SelectTrigger className="w-[160px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Status</SelectItem>
              <SelectItem value="clear" className="font-mono text-xs uppercase">Clear</SelectItem>
              <SelectItem value="encumbered" className="font-mono text-xs uppercase">Encumbered</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={taxStatusFilter}
            onValueChange={handleTaxStatusFilterChange}
          >
            <SelectTrigger className="w-[160px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Taxes: All" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Taxes</SelectItem>
              <SelectItem value="paid" className="font-mono text-xs uppercase">Paid</SelectItem>
              <SelectItem value="unpaid" className="font-mono text-xs uppercase">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || encumbranceFilter !== "all" || taxStatusFilter !== "all") && (
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
      {(searchTerm || encumbranceFilter !== "all" || taxStatusFilter !== "all") && (
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
          Found {filteredTitles.length} matching titles
        </div>
      )}

      {/* No Results Message */}
      {filteredTitles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border bg-muted/5">
          <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-xs font-mono uppercase text-muted-foreground">No matches found in database</p>
        </div>
      )}

      {/* Titles Grid */}
      {paginatedTitles.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedTitles.map((title) => {
              const styles = getStatusStyle(title.isEncumbered)
              return (
                <div key={title.id} className="group block h-full cursor-pointer">
                  <div className="border border-border bg-background hover:border-primary/50 transition-all h-full flex flex-col relative overflow-hidden group-hover:shadow-none">
                    {/* Status Line */}
                    <div className={`h-1 w-full ${styles.bg}`} />
                    
                    <div className="p-4 flex-1 flex flex-col">
                      {/* HEADER: Identity */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-lg font-bold tracking-tight">{title.titleNo}</span>
                        </div>
                        {title.isEncumbered ? (
                          <Badge variant="destructive" className="rounded-none text-[9px] uppercase tracking-widest border border-rose-500 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20">
                            Encumbered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none text-[9px] uppercase tracking-widest border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
                            Clear
                          </Badge>
                        )}
                      </div>
                      
                      {/* BODY: Metrics */}
                      <div className="grid grid-cols-2 gap-4 py-3 border-t border-dashed border-border/50">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Lot Number</span>
                          <span className="text-xs font-mono font-medium">{title.lotNo}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Lot Area</span>
                          <span className="text-xs font-mono font-medium">{title.lotArea.toLocaleString()} sqm</span>
                        </div>
                      </div>

                      {/* FOOTER: Metadata */}
                      <div className="mt-4 pt-2 border-t border-border/50">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <User className="h-3 w-3" /> Registered Owner
                          </span>
                          <p className="text-xs font-medium leading-tight line-clamp-1" title={title.registeredOwner}>
                            {title.registeredOwner}
                          </p>
                        </div>
                        
                        {title.isEncumbered && title.encumbranceDetails && (
                          <div className="mt-3 bg-rose-500/5 border border-rose-500/20 p-2 flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-rose-600 mt-0.5 shrink-0" />
                            <p className="text-[9px] text-rose-700 dark:text-rose-400 line-clamp-2 leading-tight">
                              {title.encumbranceDetails}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Action Overlay */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
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
            <span>Displaying {startIndex + 1}-{Math.min(endIndex, filteredTitles.length)} of {filteredTitles.length}</span>
            {(searchTerm || encumbranceFilter !== "all" || taxStatusFilter !== "all") && <span>(Filtered from {property.titles.length})</span>}
          </div>
        </>
      )}
    </div>
  )
}