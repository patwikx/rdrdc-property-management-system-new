import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Receipt, Plus, CheckCircle, AlertCircle } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { CreateUnitTaxForm } from "./create-unit-tax-form"
import { format } from "date-fns"

interface UnitTaxesProps {
  unit: UnitWithDetails
}

export function UnitTaxes({ unit }: UnitTaxesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleTaxCreated = () => {
    setIsAddDialogOpen(false)
    // Refresh the page or update the unit data
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Unit Property Taxes</span>
            </CardTitle>
            <CardDescription>Property tax records specific to this unit</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Record
              </Button>
            </DialogTrigger>
            <DialogContent className="!w-[650px] !max-w-[650px] !min-w-[650px]" style={{ width: '650px', maxWidth: '650px', minWidth: '650px' }}>
              <DialogHeader>
                <DialogTitle>Add Space RPT Record</DialogTitle>
              </DialogHeader>
              <CreateUnitTaxForm
                unitId={unit.id}
                onSuccess={handleTaxCreated}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {unit.unitTaxes.length > 0 ? (
          <div className="space-y-4">
            {unit.unitTaxes.map((tax) => (
              <div key={tax.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Tax Year {tax.taxYear}</h4>
                    <p className="text-sm text-muted-foreground">Tax Dec: {tax.taxDecNo}</p>
                    {tax.isQuarterly && tax.whatQuarter && (
                      <p className="text-xs text-muted-foreground">{tax.whatQuarter} Quarter</p>
                    )}
                  </div>
                  <Badge className={tax.isPaid ? 'bg-green-600' : 'bg-red-600'}>
                    {tax.isPaid ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unpaid
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Amount</span>
                    <p className="font-semibold text-lg">₱{tax.taxAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Due Date</span>
                    <p className={`font-medium ${!tax.isPaid && new Date(tax.dueDate) < new Date() ? 'text-red-600' : ''}`}>
                      {format(new Date(tax.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {tax.isPaid && tax.paidDate && (
                    <div>
                      <span className="font-medium text-muted-foreground">Paid Date</span>
                      <p className="font-medium text-green-700">
                        {format(new Date(tax.paidDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {tax.remarks && (
                  <div className="mt-4 pt-4 border-t border-muted">
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Remarks:</span>
                      <p className="mt-1">{tax.remarks}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 text-sm font-semibold">No tax records</h4>
            <p className="text-sm text-muted-foreground">
              This unit has no property tax records yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}