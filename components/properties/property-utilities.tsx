import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateUtilityForm } from "./create-utility-form"

interface PropertyUtilitiesProps {
  property: PropertyWithDetails
}

export function PropertyUtilities({ property }: PropertyUtilitiesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleUtilityCreated = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the property data
    window.location.reload()
  }
  if (property.utilities.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No utilities found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any utility connections yet.
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4" variant="outline">
              Add Utility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Utility</DialogTitle>
            </DialogHeader>
            <CreateUtilityForm 
              propertyId={property.id}
              onSuccess={handleUtilityCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const getUtilityTypeColor = (type: string) => {
    switch (type) {
      case 'ELECTRICITY': return 'bg-yellow-600'
      case 'WATER': return 'bg-blue-600'
      case 'OTHERS': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Utilities ({property.utilities.length})</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Add Utility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Utility</DialogTitle>
            </DialogHeader>
            <CreateUtilityForm 
              propertyId={property.id}
              onSuccess={handleUtilityCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {property.utilities.map((utility) => (
          <Card key={utility.id}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">{utility.provider}</span>
                    <Badge className={getUtilityTypeColor(utility.utilityType)}>
                      {utility.utilityType}
                    </Badge>
                    {utility.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Account: {utility.accountNumber}</div>
                    {utility.meterNumber && <div>Meter: {utility.meterNumber}</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}