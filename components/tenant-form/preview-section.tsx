// components/tenant-form/TenantPreview.tsx
import { User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData, statusOptions, SelectedUnitData } from "@/types/tenant-form"

interface PropertyWithDetails {
  propertyName: string
}

interface TenantPreviewProps {
  form: UseFormReturn<TenantFormData>
  selectedProperty: PropertyWithDetails | null
  selectedUnitsData: SelectedUnitData[]
}

export function TenantPreview({ form, selectedProperty, selectedUnitsData }: TenantPreviewProps) {
  const selectedStatus = form.watch('status')
  const createLease = form.watch('createLease')
  const selectedOption = statusOptions.find(opt => opt.value === selectedStatus)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <User className="h-5 w-5 mr-2" />
          Tenant Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground font-medium">Name:</span>
            <p className="text-foreground font-medium">
              {form.watch('firstName') || 'First'} {form.watch('lastName') || 'Last'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">BP Code:</span>
            <p className="text-foreground font-medium font-mono">{form.watch('bpCode') || 'Not set'}</p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Status:</span>
            <div className="flex items-center space-x-1 mt-1">
              {selectedOption && (
                <Badge className={selectedOption.color}>
                  {selectedOption.label}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Company:</span>
            <p className="text-foreground font-medium">{form.watch('company') || 'Not set'}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground font-medium">Email:</span>
              <p className="text-foreground">{form.watch('email') || 'Not set'}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Phone:</span>
              <p className="text-foreground">{form.watch('phone') || 'Not set'}</p>
            </div>
          </div>
          
          {createLease && (
            <div className="mt-3">
              <div className="font-medium text-sm mb-2">
                ✓ Lease agreement will be created with this tenant
              </div>
              {selectedProperty && (
                <div className="text-xs">
                  Property: {selectedProperty.propertyName}
                </div>
              )}
              {selectedUnitsData.length > 0 && (
                <div className="text-xs">
                  Units: {selectedUnitsData.map(u => u.unit.unitNumber).join(', ')} 
                  • Total: ₱{selectedUnitsData.reduce((sum, u) => sum + (u.customRentAmount || 0), 0).toLocaleString()}/month
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}