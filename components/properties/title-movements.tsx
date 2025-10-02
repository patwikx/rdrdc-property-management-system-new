import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Activity } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateMovementForm } from "./create-movement-form"
import { format } from "date-fns"

interface TitleMovementsProps {
  property: PropertyWithDetails
}

export function TitleMovements({ property }: TitleMovementsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleMovementCreated = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the property data
    window.location.reload()
  }
  if (property.titleMovements.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No title movements found</h3>
        <p className="mt-2 text-muted-foreground">
          This property doesn&apos;t have any title movement records yet.
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4" variant="outline">
              Add Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Title Movement</DialogTitle>
            </DialogHeader>
            <CreateMovementForm 
              propertyId={property.id}
              onSuccess={handleMovementCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-600'
      case 'RELEASED': return 'bg-blue-600'
      case 'RETURNED': return 'bg-green-600'
      case 'IN_TRANSIT': return 'bg-orange-600'
      case 'LOST': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Title Movements ({property.titleMovements.length})</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Add Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Title Movement</DialogTitle>
            </DialogHeader>
            <CreateMovementForm 
              propertyId={property.id}
              onSuccess={handleMovementCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4">
        {property.titleMovements.slice(0, 10).map((movement) => (
          <Card key={movement.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getStatusColor(movement.status)}>
                      {movement.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(movement.requestDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Purpose:</span> {movement.purpose}</div>
                    <div><span className="font-medium">Location:</span> {movement.location}</div>
                    <div><span className="font-medium">Requested by:</span> {movement.user.firstName} {movement.user.lastName}</div>
                    {movement.returnDate && (
                      <div><span className="font-medium">Returned:</span> {format(new Date(movement.returnDate), 'MMM dd, yyyy')}</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {property.titleMovements.length > 10 && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              View All {property.titleMovements.length} Movements
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}