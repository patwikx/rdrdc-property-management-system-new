// components/lease-form/unit-card.tsx
import { Building, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AvailableUnit } from "@/lib/actions/lease-actions"

interface UnitCardProps {
  unit: AvailableUnit
  isSelected: boolean
  onToggle: (unit: AvailableUnit, event: React.MouseEvent) => void
}

export function UnitCard({ unit, isSelected, onToggle }: UnitCardProps) {
  return (
    <div 
      className={`relative cursor-pointer transition-all border p-4 group ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-muted/5'
      }`}
      onClick={(e) => onToggle(unit, e)}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-1.5 py-0.5">
          <Check className="h-3 w-3" />
        </div>
      )}

      <div className="space-y-3">
        {/* Unit Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg font-mono">SPACE {unit.unitNumber || 'N/A'}</span>
          </div>
          {!isSelected && (
            <Badge 
              variant="outline"
              className={`rounded-none text-[9px] uppercase tracking-widest border-0 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600`}
            >
              VACANT
            </Badge>
          )}
        </div>

        {/* Property Info */}
        <div className="text-xs font-mono text-muted-foreground truncate uppercase tracking-wider">
          {unit.property.propertyName}
        </div>

        {/* Unit Details */}
        <div className="space-y-1.5 text-xs font-mono border-t border-dashed border-border/50 pt-2">
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Area</span>
            <span className="font-medium">{unit.totalArea || 0} sqm</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Rent</span>
            <span className="font-medium">₱{(unit.totalRent || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Floor Summary */}
        {unit.unitFloors && unit.unitFloors.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Configuration</div>
            <div className="space-y-1">
              {unit.unitFloors?.slice(0, 2).map((floor, index) => (
                <div key={floor.id || index} className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{floor.floorType || 'FLOOR'}</span>
                  <span>{floor.area || 0} sqm</span>
                </div>
              ))}
              {(unit.unitFloors?.length || 0) > 2 && (
                <div className="text-[9px] text-muted-foreground italic text-right">
                  +{(unit.unitFloors?.length || 0) - 2} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {isSelected && <div className="absolute inset-0 border-2 border-primary pointer-events-none" />}
    </div>
  )
}