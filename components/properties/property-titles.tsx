import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, AlertTriangle, User, CheckCircle, Clock, Search, Plus, FileText } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateTitleForm } from "./create-title-form"

interface PropertyTitlesProps {
  property: PropertyWithDetails
}

export function PropertyTitles({ property }: PropertyTitlesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const handleTitleCreated = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the property data
    window.location.reload()
  }

  // Filter titles based on search term
  const filteredTitles = property.titles.filter(title => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      title.titleNo.toLowerCase().includes(searchLower) ||
      title.lotNo.toLowerCase().includes(searchLower) ||
      title.registeredOwner.toLowerCase().includes(searchLower)
    )
  })

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
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Titles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{totalTitles}</div>
            <p className="text-xs text-muted-foreground">
              {totalArea.toLocaleString()} sqm total area
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Encumbered</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-red-600">{encumberedTitles}</div>
            <p className="text-xs text-muted-foreground">
              {encumberedTitles > 0 ? 'Requires attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Property Taxes</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold">{totalTaxes}</div>
            <p className="text-xs text-muted-foreground">
              Total tax records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Unpaid Taxes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl font-bold text-yellow-600">{unpaidTaxes}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidTaxes > 0 ? 'Needs payment' : 'All paid'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Property Titles</CardTitle>
          <CardDescription className="text-sm">Manage and view all property title records</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title number, lot number, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            
            <div className="flex items-center">
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
          </div>

          {/* No Results Message */}
          {filteredTitles.length === 0 && searchTerm && (
            <div className="text-center py-6">
              <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
              <h4 className="mt-2 text-sm font-semibold">No titles found</h4>
              <p className="text-sm text-muted-foreground">
                No titles match your search criteria.
              </p>
            </div>
          )}
          {/* Title Records - Card Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTitles.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground text-sm">No title records match your search criteria.</p>
              </div>
            ) : (
              filteredTitles.map((title) => (
                <Card key={title.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {title.titleNo}
                      </CardTitle>
                      {title.isEncumbered ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-2 w-2 mr-1" />
                          Encumbered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          <CheckCircle className="h-2 w-2 mr-1" />
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
                                <Badge className="bg-green-600 text-xs h-4 px-1">
                                  <CheckCircle className="h-2 w-2" />
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs h-4 px-1">
                                  <Clock className="h-2 w-2" />
                                </Badge>
                              )}
                            </div>
                          ))}
                          {title.propertyTaxes.length > 2 && (
                            <div className="text-center">
                              <Button variant="ghost" size="sm" className="h-6 text-xs">
                                +{title.propertyTaxes.length - 2} more taxes
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
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-red-600 uppercase tracking-wide font-medium">Encumbrance</span>
                            <p className="text-xs text-red-700 mt-0.5 leading-tight">{title.encumbranceDetails}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredTitles.length > 0 && (
            <div className="mt-3 text-center text-xs text-muted-foreground">
              Showing {filteredTitles.length} of {totalTitles} title records
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}