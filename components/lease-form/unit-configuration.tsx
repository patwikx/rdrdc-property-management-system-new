// components/lease-form/unit-configuration.tsx
import { X, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <div className="space-y-4 pt-4 border-t border-dashed border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest">Configuration</h4>
        <Badge variant="secondary" className="rounded-none text-[9px] uppercase tracking-wider">
          {selectedUnitsData.length} Selected
        </Badge>
      </div>

      <div className="space-y-2">
        {selectedUnitsData.map((unitData) => {
          const hasFloors = unitData.unit.unitFloors && unitData.unit.unitFloors.length > 0

          return (
            <div key={unitData.unit.id} className="border border-border bg-background group hover:border-primary/30 transition-colors">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/5">
                <div className="flex items-center space-x-2">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono font-bold text-sm">SPACE {unitData.unit.unitNumber}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => onRemoveUnit(unitData.unit.id, e)}
                  className="h-6 w-6 p-0 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {/* Total Rent Input */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                    Total Monthly Rent
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitData.customRentAmount || 0}
                      onChange={(e) => onUpdateUnitRent(unitData.unit.id, parseFloat(e.target.value) || 0)}
                      className="pl-8 h-9 rounded-none border-border font-mono text-xs focus-visible:ring-0 focus-visible:border-primary"
                    />
                  </div>
                </div>

                {hasFloors && (
                  <div className="space-y-3 pt-3 border-t border-dashed border-border/50">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono block">
                      Floor Rate Adjustments
                    </Label>

                    <div className="space-y-2">
                      {unitData.unit.unitFloors?.map((floor) => {
                        const floorOverride = unitData.floorOverrides.find(f => f.floorId === floor.id)
                        const currentRate = floorOverride?.customRate ?? floor.rate ?? 0
                        const currentRent = floorOverride?.customRent ?? floor.rent ?? 0

                        return (
                          <div key={floor.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-border bg-muted/5 items-center">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Type</span>
                              <p className="text-xs font-bold font-mono">{floor.floorType}</p>
                            </div>
                            
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Area</span>
                              <p className="text-xs font-mono">{floor.area} sqm</p>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-2 gap-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[9px] text-muted-foreground">₱</span>
                                <Input
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
                                  className="pl-5 h-7 text-[10px] font-mono rounded-none border-border"
                                  placeholder="RATE"
                                />
                              </div>
                              <div className="flex items-center justify-end px-2 h-7 bg-muted/20 border border-border">
                                <span className="text-[10px] font-mono">₱{currentRent.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border border-border bg-muted/10 flex justify-between items-center mt-4">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Monthly Rent</span>
        <span className="text-lg font-bold font-mono text-primary">
          ₱{selectedUnitsData.reduce((sum, u) => sum + u.customRentAmount, 0).toLocaleString()}
        </span>
      </div>
    </div>
  )
}