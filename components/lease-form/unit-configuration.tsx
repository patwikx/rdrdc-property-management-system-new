// components/lease-form/unit-configuration.tsx
import { X, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AvailableUnit } from "@/lib/actions/lease-actions"

interface FloorOverride {
  floorId: string
  customRate: number
  customRent: number
}

interface SelectedUnitData {
  unit: AvailableUnit
  customRentAmount: number
  floorOverrides: FloorOverride[]
}

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
  onRemoveUnit,
}: UnitConfigurationProps) {
  if (selectedUnitsData.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Selected Spaces Configuration</h4>
        <Badge variant="secondary">
          {selectedUnitsData.length} space{selectedUnitsData.length !== 1 ? 's' : ''} selected
        </Badge>
      </div>

      <div className="space-y-2">
        {selectedUnitsData.map((unitData) => {
          const hasFloors = unitData.unit.unitFloors && unitData.unit.unitFloors.length > 0

          return (
            <Card key={unitData.unit.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 mt-[-20px] mb-[-15px]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">Space: {unitData.unit.unitNumber}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {unitData.unit.property.propertyName}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => onRemoveUnit(unitData.unit.id, e)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">


                {hasFloors && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Floor-by-Floor Rates</Label>
                      <Badge variant="outline" className="text-xs">
                        {unitData.unit.unitFloors?.length} floor{unitData.unit.unitFloors?.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {unitData.unit.unitFloors?.map((floor) => {
                        const floorOverride = unitData.floorOverrides.find(f => f.floorId === floor.id)
                        const currentRate = floorOverride?.customRate ?? floor.rate ?? 0
                        const currentRent = floorOverride?.customRent ?? floor.rent ?? 0

                        return (
                          <div key={floor.id} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium">Floor: {floor.floorType}</p>
                                <p className="text-xs text-muted-foreground">
                                  Area: {floor.area} sqm
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                ₱{currentRent.toLocaleString()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor={`rate-${floor.id}`} className="text-xs">
                                  Rate per sqm
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                                    ₱
                                  </span>
                                  <Input
                                    id={`rate-${floor.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={currentRate}
                                    onChange={(e) => 
                                      onUpdateFloorRate(
                                        unitData.unit.id,
                                        floor.id,
                                        parseFloat(e.target.value) || 0,
                                        floor.area
                                      )
                                    }
                                    className="pl-6 h-8 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Monthly Rent</Label>
                                <div className="h-8 px-3 py-2 border rounded-md bg-muted flex items-center text-xs">
                                  ₱{currentRent.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor={`total-rent-${unitData.unit.id}`} className="text-xs">
                    Total Monthly Rent
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      id={`total-rent-${unitData.unit.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitData.customRentAmount || 0}
                      onChange={(e) => onUpdateUnitRent(unitData.unit.id, parseFloat(e.target.value) || 0)}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Monthly Rent</span>
          <span className="text-xl font-bold text-primary">
            ₱{selectedUnitsData.reduce((sum, u) => sum + u.customRentAmount, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}