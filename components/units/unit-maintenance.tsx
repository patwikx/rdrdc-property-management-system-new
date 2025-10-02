import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { CreateMaintenanceForm } from "./create-maintenance-form"
import { format } from "date-fns"

interface UnitMaintenanceProps {
  unit: UnitWithDetails
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'EMERGENCY': return 'bg-red-600'
    case 'HIGH': return 'bg-orange-600'
    case 'MEDIUM': return 'bg-yellow-600'
    case 'LOW': return 'bg-green-600'
    default: return 'bg-gray-600'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'bg-green-600'
    case 'IN_PROGRESS': return 'bg-blue-600'
    case 'ASSIGNED': return 'bg-yellow-600'
    case 'PENDING': return 'bg-gray-600'
    case 'CANCELLED': return 'bg-red-600'
    default: return 'bg-gray-600'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED': return CheckCircle
    case 'IN_PROGRESS': return Clock
    case 'ASSIGNED': return AlertTriangle
    case 'PENDING': return Clock
    case 'CANCELLED': return AlertTriangle
    default: return Clock
  }
}

export function UnitMaintenance({ unit }: UnitMaintenanceProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleMaintenanceCreated = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the unit data
    window.location.reload()
  }

  // Get current tenant ID if available
  const currentLease = unit.leaseUnits.find(lu => lu.lease.status === 'ACTIVE')?.lease
  const currentTenantId = currentLease?.tenant.id

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>Maintenance Requests</span>
            </CardTitle>
            <CardDescription>Maintenance history and current requests for this unit</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="!w-[650px] !max-w-[650px] !min-w-[650px]" style={{ width: '650px', maxWidth: '650px', minWidth: '650px' }}>
              <DialogHeader>
                <DialogTitle>Create Maintenance Request</DialogTitle>
              </DialogHeader>
              <CreateMaintenanceForm
                unitId={unit.id}
                tenantId={currentTenantId}
                onSuccess={handleMaintenanceCreated}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {unit.maintenanceRequests.length > 0 ? (
          <div className="space-y-4">
            {unit.maintenanceRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status)
              return (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{request.category}</h4>
                        <Badge className={getPriorityColor(request.priority)} variant="secondary">
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Requested</span>
                      <p className="font-medium">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    {request.completedAt && (
                      <div>
                        <span className="font-medium text-muted-foreground">Completed</span>
                        <p className="font-medium text-green-700">
                          {format(new Date(request.completedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Wrench className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 text-sm font-semibold">No maintenance requests</h4>
            <p className="text-sm text-muted-foreground">
              This unit has no maintenance history yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}