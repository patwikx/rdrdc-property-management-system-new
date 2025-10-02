import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap, Power, Droplets } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { CreateUnitUtilityForm } from "./create-unit-utility-form"
import { format } from "date-fns"

interface UnitUtilitiesProps {
  unit: UnitWithDetails
}

function getUtilityIcon(type: string) {
  switch (type) {
    case 'ELECTRICITY': return Power
    case 'WATER': return Droplets
    case 'OTHERS': return Zap
    default: return Zap
  }
}

function getUtilityColor(type: string) {
  switch (type) {
    case 'ELECTRICITY': return 'bg-yellow-600'
    case 'WATER': return 'bg-blue-600'
    case 'OTHERS': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}

export function UnitUtilities({ unit }: UnitUtilitiesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleUtilityCreated = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the unit data
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Utilities ({unit.utilityAccounts.length})</h3>
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
            <CreateUnitUtilityForm
              unitId={unit.id}
              onSuccess={handleUtilityCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      {unit.utilityAccounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {unit.utilityAccounts.map((utility) => {
            const UtilityIcon = getUtilityIcon(utility.utilityType)
            return (
              <Card key={utility.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <UtilityIcon className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{utility.utilityType}</span>
                        <Badge className={getUtilityColor(utility.utilityType)}>
                          {utility.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Account: <span className="font-mono">{utility.accountNumber}</span></div>
                        {utility.meterNumber && (
                          <div>Meter: <span className="font-mono">{utility.meterNumber}</span></div>
                        )}
                        {utility.billingId && (
                          <div>Billing ID: <span className="font-mono">{utility.billingId}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {utility.remarks && (
                    <div className="mt-3 pt-3 border-t border-muted">
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Notes:</span>
                        <p className="mt-1 text-sm">{utility.remarks}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-muted text-xs text-muted-foreground">
                    Created {format(new Date(utility.createdAt), 'MMM dd, yyyy')}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No available utilities</h3>
          <p className="mt-2 text-muted-foreground">
            This unit doesn&apos;t have any utility connections yet.
          </p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Utility
          </Button>
        </div>
      )}
    </div>
  )
}