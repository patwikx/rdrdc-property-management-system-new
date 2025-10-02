import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, AlertTriangle, User, CheckCircle, Clock, Search } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateTitleForm } from "./create-title-form"
import { format } from "date-fns"

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
  if (property.titles.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No titles found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any registered titles yet.
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4" variant="outline">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Property Titles ({property.titles.length})</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
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

      {/* Search Bar */}
      {property.titles.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title number, lot number, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {searchTerm && (
            <div className="text-sm text-muted-foreground">
              {filteredTitles.length} of {property.titles.length} titles
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {property.titles.length > 0 && filteredTitles.length === 0 && (
        <div className="text-center py-8">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
          <h4 className="mt-2 text-sm font-semibold">No titles found</h4>
          <p className="text-sm text-muted-foreground">
            No titles match your search criteria. Try adjusting your search terms.
          </p>
        </div>
      )}
      
      {filteredTitles.map((title) => (
        <Card key={title.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Title No: {title.titleNo}</span>
                  {title.isEncumbered && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Encumbered
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Lot {title.lotNo} • {title.lotArea.toLocaleString()} sqm</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Owner Information - Prominently Displayed */}
            <div className="bg-muted/30 border border-muted-foreground/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                Registered Owner
              </h4>
              <p className="text-lg font-bold text-foreground">{title.registeredOwner}</p>
            </div>

            {/* Title Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Title Number</Label>
                <p className="font-medium">{title.titleNo}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Lot Number</Label>
                <p className="font-medium">{title.lotNo}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Lot Area</Label>
                <p className="font-medium">{title.lotArea.toLocaleString()} sqm</p>
              </div>
            </div>

            {/* Encumbrance Details */}
            {title.isEncumbered && title.encumbranceDetails && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Encumbrance Details
                </h4>
                <p className="text-red-700">{title.encumbranceDetails}</p>
              </div>
            )}

            {/* Property Taxes */}
            {title.propertyTaxes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4 flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  Property Taxes ({title.propertyTaxes.length})
                </h4>
                <div className="space-y-3">
                  {title.propertyTaxes.slice(0, 5).map((tax) => (
                    <div key={tax.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-semibold">{tax.taxYear}</div>
                          <div className="text-xs text-muted-foreground">Year</div>
                        </div>
                        <div>
                          <div className="font-medium">₱{tax.taxAmount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Tax Dec: {tax.TaxDecNo}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {tax.isPaid ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <Badge className="bg-green-600">Paid</Badge>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <Badge variant="outline">Unpaid</Badge>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due: {format(new Date(tax.dueDate), 'MMM dd, yyyy')}
                        </div>
                        {tax.paidDate && (
                          <div className="text-xs text-green-600">
                            Paid: {format(new Date(tax.paidDate), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {title.propertyTaxes.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View All {title.propertyTaxes.length} Taxes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}