// components/lease-form/unit-card.tsx
import { Building, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AvailableUnit } from "@/lib/actions/lease-actions"

interface UnitCardProps {
  unit: AvailableUnit
  isSelected: boolean
  onToggle: (unit: AvailableUnit, event: React.MouseEvent) => void
}

export function UnitCard({ unit, isSelected, onToggle }: UnitCardProps) {
  return (
    <div
      onClick={(e) => onToggle(unit, e)}
      className={cn(
        "relative flex flex-col p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{unit.unitNumber}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{unit.property.propertyName}</p>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total Area: {unit.totalArea} sqm</span>
        </div>
        {unit.unitFloors && unit.unitFloors.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {unit.unitFloors.length} floor{unit.unitFloors.length !== 1 ? 's' : ''}
          </Badge>
        )}
        <div className="pt-2 border-t">
          <p className="text-sm font-semibold text-primary">₱{unit.totalRent.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}