// components/tenant-form/UnitCard.tsx
import { Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UnitData } from "@/types/tenant-form"

interface UnitCardProps {
  unit: UnitData
  isSelected: boolean
  onToggle: (unit: UnitData, event: React.MouseEvent) => void
}

export function UnitCard({ unit, isSelected, onToggle }: UnitCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50'
      }`}
      onClick={(e) => onToggle(unit, e)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Unit Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-lg">{unit.unitNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                className={
                  unit.status === 'VACANT' 
                    ? 'bg-green-500 text-white-700' 
                    : 'bg-yellow-500 text-yellow-700'
                }
              >
                {unit.status}
              </Badge>
              {isSelected && (
                <Badge className="bg-primary">Selected</Badge>
              )}
            </div>
          </div>

          {/* Unit Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Area:</span>
              <span className="font-medium">{unit.totalArea || 0} sqm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rent:</span>
              <span className="font-medium">₱{(unit.totalRent || 0).toLocaleString()}</span>
            </div>
            {unit.propertyTitle && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-medium text-xs">{unit.propertyTitle.titleNo}</span>
              </div>
            )}
          </div>

          {/* Floor Summary */}
          {unit.unitFloors && unit.unitFloors.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">Floor Configuration:</div>
              <div className="space-y-1">
                {unit.unitFloors?.slice(0, 2).map((floor, index) => (
                  <div key={floor.id || index} className="flex justify-between text-xs">
                    <span>{floor.floorType || 'Floor'}</span>
                    <span>{floor.area || 0} sqm</span>
                  </div>
                ))}
                {(unit.unitFloors?.length || 0) > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{(unit.unitFloors?.length || 0) - 2} more floors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}