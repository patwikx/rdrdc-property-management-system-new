"use client"

import { Building, Search, X, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UnitCard } from "@/components/lease-form/unit-card"
import { UnitConfiguration } from "@/components/lease-form/unit-configuration"
import { AvailableUnit } from "@/lib/actions/lease-actions"
import { cn } from "@/lib/utils"

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

interface SpaceSelectionStepProps {
  units: AvailableUnit[]
  filteredUnits: AvailableUnit[]
  selectedUnitsData: SelectedUnitData[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedProperty: string
  setSelectedProperty: (property: string) => void
  minArea: string
  setMinArea: (area: string) => void
  properties: Array<{ id: string; name: string }>
  openPropertySelect: boolean
  setOpenPropertySelect: (open: boolean) => void
  hasActiveFilters: boolean
  clearFilters: () => void
  toggleUnitSelection: (unit: AvailableUnit, event: React.MouseEvent) => void
  updateUnitRent: (unitId: string, newRent: number) => void
  updateFloorRate: (unitId: string, floorId: string, newRate: number, area: number) => void
  handleRemoveUnit: (unitId: string, event: React.MouseEvent) => void
}

export function SpaceSelectionStep({
  units,
  filteredUnits,
  selectedUnitsData,
  searchQuery,
  setSearchQuery,
  selectedProperty,
  setSelectedProperty,
  minArea,
  setMinArea,
  properties,
  openPropertySelect,
  setOpenPropertySelect,
  hasActiveFilters,
  clearFilters,
  toggleUnitSelection,
  updateUnitRent,
  updateFloorRate,
  handleRemoveUnit
}: SpaceSelectionStepProps) {
  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border bg-muted/10 p-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <Building className="h-3 w-3" />
          Space Assignment
        </span>
      </div>
      <div className="p-6">
        {units.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border bg-muted/5">
            <Building className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No Available Spaces</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">All units occupied</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-dashed border-border">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search spaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-none border-border font-mono text-xs uppercase"
                />
              </div>

              <Popover open={openPropertySelect} onOpenChange={setOpenPropertySelect}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPropertySelect}
                    className="w-[180px] justify-between h-9 rounded-none border-border font-mono text-xs uppercase"
                  >
                    {selectedProperty === "all"
                      ? "All properties"
                      : properties.find((p) => p.id === selectedProperty)?.name}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 rounded-none border-border">
                  <Command>
                    <CommandInput placeholder="Search property..." className="font-mono text-xs uppercase" />
                    <CommandList>
                      <CommandEmpty>No property found</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedProperty("all")
                            setOpenPropertySelect(false)
                          }}
                          className="font-mono text-xs uppercase"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              selectedProperty === "all" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All properties
                        </CommandItem>
                        {properties.map((prop) => (
                          <CommandItem
                            key={prop.id}
                            value={prop.name}
                            onSelect={() => {
                              setSelectedProperty(prop.id)
                              setOpenPropertySelect(false)
                            }}
                            className="font-mono text-xs uppercase"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                selectedProperty === prop.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {prop.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Input
                type="number"
                placeholder="Min area"
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                className="w-[100px] h-9 rounded-none border-border font-mono text-xs"
              />

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  title="Clear filters"
                  className="h-9 w-9 rounded-none border-border"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Results */}
            {filteredUnits.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border bg-muted/5">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No Spaces Found</h3>
              </div>
            ) : (
              <>
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
                  Available: {filteredUnits.length} / {units.length}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-2">
                  {filteredUnits.map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      isSelected={selectedUnitsData.some(u => u.unit.id === unit.id)}
                      onToggle={toggleUnitSelection}
                    />
                  ))}
                </div>

                <UnitConfiguration
                  selectedUnitsData={selectedUnitsData}
                  onUpdateUnitRent={updateUnitRent}
                  onUpdateFloorRate={updateFloorRate}
                  onRemoveUnit={handleRemoveUnit}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
