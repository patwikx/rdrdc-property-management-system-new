// components/tenant-form/LeaseSetupSection.tsx
import { useState } from "react"
import { Calendar, Home, Search, Check, ChevronsUpDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData, UnitData, SelectedUnitData } from "@/types/tenant-form"
import { UnitCard } from "./unit-card"
import { UnitConfiguration } from "./unit-configuration"
import { cn } from "@/lib/utils"

interface PropertyWithDetails {
  id: string
  propertyName: string
  units?: UnitData[]
}

interface LeaseSetupSectionProps {
  form: UseFormReturn<TenantFormData>
  isLoading: boolean
  properties: Array<{ id: string; propertyName: string }>
  selectedProperty: PropertyWithDetails | null
  selectedUnitsData: SelectedUnitData[]
  onToggleUnit: (unit: UnitData, event: React.MouseEvent) => void
  onUpdateUnitRent: (unitId: string, newRent: number) => void
  onUpdateFloorRate: (unitId: string, floorId: string, newRate: number, area: number) => void
}

export function LeaseSetupSection({
  form,
  isLoading,
  properties,
  selectedProperty,
  selectedUnitsData,
  onToggleUnit,
  onUpdateUnitRent,
  onUpdateFloorRate,
}: LeaseSetupSectionProps) {
  const [unitSearchQuery, setUnitSearchQuery] = useState("")
  const [openPropertySelect, setOpenPropertySelect] = useState(false)
  const createLease = form.watch('createLease')

  const handleRemoveUnit = (unitId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const unit = selectedUnitsData.find(u => u.unit.id === unitId)?.unit
    if (unit) {
      onToggleUnit(unit, event)
    }
  }

  const getPropertyDisplayText = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    return property ? property.propertyName : "Select property"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Lease Setup (Optional)</h3>
      </div>
      
      <FormField
        control={form.control}
        name="createLease"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-medium">
                Create lease agreement during tenant setup
              </FormLabel>
              <FormDescription>
                You can set up the tenant&apos;s first lease agreement now, or add it later from their profile.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      {createLease && (
        <div className="space-y-6 p-4 border rounded-lg bg-muted/20">
          <h4 className="font-medium flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Lease Details</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">Property *</FormLabel>
                  <Popover open={openPropertySelect} onOpenChange={setOpenPropertySelect}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPropertySelect}
                          className={cn(
                            "w-full justify-between h-10",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {field.value ? getPropertyDisplayText(field.value) : "Select property"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search property..." />
                        <CommandList>
                          <CommandEmpty>No property found.</CommandEmpty>
                          <CommandGroup>
                            {properties.map((property) => (
                              <CommandItem
                                key={property.id}
                                value={property.propertyName}
                                onSelect={() => {
                                  form.setValue("propertyId", property.id)
                                  setOpenPropertySelect(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === property.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {property.propertyName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-xs">
                    Choose the property for this lease
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaseStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Lease Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Initial lease status
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedProperty && (
            <div className="space-y-4">
              <FormLabel className="text-sm font-medium">Available Spaces</FormLabel>
              <FormDescription className="text-xs">
                Select one or more spaces for this lease. Click on spaces to select them.
              </FormDescription>
              
              {/* Unit Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search spaces by number, area, or rent..."
                  value={unitSearchQuery}
                  onChange={(e) => setUnitSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              {/* Available Units Count */}
              {(() => {
                const allUnits = selectedProperty.units || []
                const availableUnits = allUnits.filter((unit: UnitData) => 
                  (unit.status === 'VACANT' || unit.status === 'MAINTENANCE') &&
                  (unitSearchQuery === '' || 
                   unit.unitNumber?.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
                   unit.totalArea?.toString().includes(unitSearchQuery) ||
                   unit.totalRent?.toString().includes(unitSearchQuery))
                )
                
                return (
                  <div className="text-sm text-muted-foreground">
                    {availableUnits.length} available space{availableUnits.length !== 1 ? 's' : ''} found 
                    (of {allUnits.length} total spaces)
                    {selectedUnitsData.length > 0 && (
                      <span className="ml-2">• {selectedUnitsData.length} selected</span>
                    )}
                  </div>
                )
              })()}
              
              {/* Unit Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {selectedProperty.units
                  ?.filter((unit: UnitData) => 
                    (unit.status === 'VACANT' || unit.status === 'MAINTENANCE') &&
                    (unitSearchQuery === '' || 
                     unit.unitNumber?.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
                     unit.totalArea?.toString().includes(unitSearchQuery) ||
                     unit.totalRent?.toString().includes(unitSearchQuery))
                  )
                  .map((unit: UnitData) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      isSelected={selectedUnitsData.some(u => u.unit.id === unit.id)}
                      onToggle={onToggleUnit}
                    />
                  )) || []}
              </div>

              {/* No Units Found */}
              {selectedProperty.units?.filter((unit: UnitData) => 
                (unit.status === 'VACANT' || unit.status === 'MAINTENANCE') &&
                (unitSearchQuery === '' || 
                 unit.unitNumber?.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
                 unit.totalArea?.toString().includes(unitSearchQuery) ||
                 unit.totalRent?.toString().includes(unitSearchQuery))
              ).length === 0 && (
                <div className="text-center py-8">
                  <Home className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h4 className="mt-2 text-sm font-semibold">
                    {unitSearchQuery ? 'No spaces found' : 'No available spaces'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {unitSearchQuery 
                      ? 'Try adjusting your search terms'
                      : 'All spaces in this property are currently occupied'
                    }
                  </p>
                </div>
              )}

              {/* Selected Units Configuration */}
              <UnitConfiguration
                selectedUnitsData={selectedUnitsData}
                onUpdateUnitRent={onUpdateUnitRent}
                onUpdateFloorRate={onUpdateFloorRate}
                onRemoveUnit={handleRemoveUnit}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Start Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Lease start date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">End Date *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Lease end date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="totalRentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Total Monthly Rent *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className="h-10 pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Total monthly rent amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="securityDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Security Deposit *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                        className="h-10 pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Security deposit amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}