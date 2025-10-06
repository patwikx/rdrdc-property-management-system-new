// components/tenant-form/UnitConfiguration.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FormDescription } from "@/components/ui/form"
import { Building } from "lucide-react"
import { SelectedUnitData, FloorOverride } from "@/types/tenant-form"

interface UnitConfigurationProps {
  selectedUnitsData: SelectedUnitData[]
  onUpdateUnitRent: (unitId: string, newRent: number) => void
  onUpdateFloorRate: (unitId: string, floorId: string, newRate: number, area: number) => void
  onRemoveUnit: (unitId: string, event: React.MouseEvent) => void
}

export function UnitConfiguration({ 
  selectedUnitsData, 
  onUpdateUnitRent, 
  onUpdateFloorRate,
  onRemoveUnit 
}: UnitConfigurationProps) {
  if (selectedUnitsData.length === 0) {
    return null
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Building className="h-5 w-5 text-primary" />
        <h4 className="font-medium">Selected Space Configuration</h4>
      </div>
      
      {selectedUnitsData.map((unitData) => (
        <Card key={unitData.unit.id} className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Space {unitData.unit.unitNumber}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onRemoveUnit(unitData.unit.id, e)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unit Total Rent Override */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Override Monthly Rent</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitData.customRentAmount || 0}
                    onChange={(e) => onUpdateUnitRent(unitData.unit.id, parseFloat(e.target.value) || 0)}
                    className="h-10 pl-8"
                    placeholder="0.00"
                  />
                </div>
                <FormDescription className="text-xs mt-1">
                  Override the total monthly rent for this unit
                </FormDescription>
              </div>
              
              <div className="flex items-end">
                <div>
                  <div className="text-muted-foreground mt-[-65px]">Original Rent:</div>
                  <div className="font-medium">₱{(unitData.unit.totalRent || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Floor Configuration Overrides */}
            {unitData.unit.unitFloors && unitData.unit.unitFloors.length > 0 && (
              <div>
                <label className="text-sm font-medium">Floor Rate Overrides</label>
                <FormDescription className="text-xs mb-3">
                  Adjust individual floor rates. Total unit rent will be recalculated automatically.
                </FormDescription>
                
                <div className="space-y-3">
                  {unitData.unit.unitFloors?.map((floor, index) => {
                    const floorOverride = unitData.floorOverrides?.find((f: FloorOverride) => f.floorId === floor.id)
                    
                    return (
                      <div key={floor.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg bg-muted/20">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Floor Type</label>
                          <p className="text-sm font-medium">{floor.floorType || 'Floor'}</p>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Area</label>
                          <p className="text-sm">{floor.area || 0} sqm</p>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Rate (₱/sqm)</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={floorOverride?.customRate || floor.rate || 0}
                              onChange={(e) => onUpdateFloorRate(unitData.unit.id, floor.id, parseFloat(e.target.value) || 0, floor.area || 0)}
                              className="h-8 pl-6 text-xs"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Floor Rent</label>
                          <p className="text-sm font-medium">
                            ₱{((floorOverride?.customRent || floor.rent || 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}