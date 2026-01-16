// components/tenant-form/UnitConfiguration.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building, Trash2 } from "lucide-react"
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
    <div className="space-y-4 pt-4 border-t border-dashed border-border">
      <div className="flex items-center space-x-2 pb-2">
        <Building className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Selected Space Configuration</h4>
      </div>
      
      {selectedUnitsData.map((unitData) => (
        <div key={unitData.unit.id} className="border border-border bg-background p-0 group hover:border-primary/30 transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-dashed border-border/50 bg-muted/5">
            <span className="font-mono font-bold text-sm">SPACE {unitData.unit.unitNumber}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => onRemoveUnit(unitData.unit.id, e)}
              className="h-6 w-6 p-0 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="p-4 space-y-6">
            {/* Unit Total Rent Override */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono block mb-1.5">Override Monthly Rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">₱</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitData.customRentAmount || 0}
                    onChange={(e) => onUpdateUnitRent(unitData.unit.id, parseFloat(e.target.value) || 0)}
                    className="h-9 pl-8 rounded-none border-border font-mono text-xs focus-visible:ring-0 focus-visible:border-primary"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="flex items-end pb-1">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Original Rent</div>
                  <div className="font-mono font-medium text-sm">₱{(unitData.unit.totalRent || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Floor Configuration Overrides */}
            {unitData.unit.unitFloors && unitData.unit.unitFloors.length > 0 && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono block mb-3">Floor Rate Adjustments</label>
                
                <div className="space-y-2">
                  {unitData.unit.unitFloors?.map((floor, index) => {
                    const floorOverride = unitData.floorOverrides?.find((f: FloorOverride) => f.floorId === floor.id)
                    
                    return (
                      <div key={floor.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 border border-border bg-muted/5 items-center">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Type</label>
                          <p className="text-xs font-bold font-mono">{floor.floorType || 'FLOOR'}</p>
                        </div>
                        
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Area</label>
                          <p className="text-xs font-mono">{floor.area || 0} sqm</p>
                        </div>
                        
                        <div>
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">Rate (₱/sqm)</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[10px] text-muted-foreground">₱</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={floorOverride?.customRate || floor.rate || 0}
                              onChange={(e) => onUpdateFloorRate(unitData.unit.id, floor.id, parseFloat(e.target.value) || 0, floor.area || 0)}
                              className="h-7 pl-5 text-[10px] font-mono rounded-none border-border"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <label className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Floor Rent</label>
                          <p className="text-xs font-mono font-medium">
                            ₱{((floorOverride?.customRent || floor.rent || 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}