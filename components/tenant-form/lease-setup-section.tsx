// components/tenant-form/LeaseSetupSection.tsx
import { useState } from "react"
import { Calendar as CalendarIcon, Home, Search, Check, ChevronsUpDown, Key } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { TenantFormData, UnitData, SelectedUnitData } from "@/types/tenant-form"
import { UnitCard } from "./unit-card"
import { UnitConfiguration } from "./unit-configuration"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

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

const leaseStatusOptions = [
  {
    value: "PENDING",
    label: "PENDING",
    color: "bg-amber-500"
  },
  {
    value: "ACTIVE",
    label: "ACTIVE",
    color: "bg-emerald-500"
  }
]

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
    return property ? property.propertyName : "SELECT_PROPERTY"
  }

  const getStatusOption = (value: string) => {
    return leaseStatusOptions.find(option => option.value === value)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Key className="h-3 w-3" />
            Lease Agreement
          </span>
        </div>
        
        <div className="p-6">
          <FormField
            control={form.control}
            name="createLease"
            render={({ field }) => (
              <FormItem className={`flex flex-row items-start space-x-3 space-y-0 p-4 border transition-all cursor-pointer ${field.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    className="rounded-none mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-bold text-xs uppercase tracking-wide cursor-pointer">
                    Initialize Lease
                  </FormLabel>
                  <FormDescription className="text-[10px] font-mono">
                    Create initial lease agreement now
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {createLease && (
            <div className="mt-6 space-y-6 pt-6 border-t border-dashed border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Property *</FormLabel>
                      <Popover open={openPropertySelect} onOpenChange={setOpenPropertySelect}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openPropertySelect}
                              className={cn(
                                "w-full justify-between h-10 rounded-none border-border font-mono text-sm",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isLoading}
                            >
                              {field.value ? getPropertyDisplayText(field.value) : "SELECT_PROPERTY"}
                              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 rounded-none border-border" align="start">
                          <Command>
                            <CommandInput placeholder="SEARCH_PROPERTIES..." className="font-mono text-xs uppercase" />
                            <CommandList>
                              <CommandEmpty>NO_PROPERTY_FOUND</CommandEmpty>
                              <CommandGroup>
                                {properties.map((property) => (
                                  <CommandItem
                                    key={property.id}
                                    value={property.propertyName}
                                    onSelect={() => {
                                      form.setValue("propertyId", property.id)
                                      setOpenPropertySelect(false)
                                    }}
                                    className="font-mono text-xs uppercase"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-3 w-3",
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="leaseStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Lease Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger className="h-10 rounded-none border-border font-mono text-xs uppercase">
                            <SelectValue placeholder="SELECT_STATUS">
                              {field.value && getStatusOption(field.value) && (
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", getStatusOption(field.value)?.color)} />
                                  <span>{getStatusOption(field.value)?.label}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-none border-border">
                          {leaseStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="font-mono text-xs uppercase">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", option.color)} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedProperty && (
                <div className="space-y-4 pt-6 border-t border-dashed border-border">
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Select Spaces</FormLabel>
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
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {availableUnits.length} AVAILABLE / {allUnits.length} TOTAL
                          {selectedUnitsData.length > 0 && (
                            <span className="ml-2 font-bold text-primary">• {selectedUnitsData.length} SELECTED</span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  
                  {/* Unit Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="SEARCH SPACES..."
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      className="pl-10 h-10 rounded-none border-border font-mono text-xs uppercase focus-visible:ring-0 focus-visible:border-primary"
                    />
                  </div>
                  
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
                    <div className="text-center py-8 border border-dashed border-border">
                      <Home className="mx-auto h-8 w-8 text-muted-foreground/30" />
                      <h4 className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {unitSearchQuery ? 'NO MATCHING SPACES' : 'NO AVAILABLE SPACES'}
                      </h4>
                    </div>
                  )}

                  {/* Selected Units Configuration */}
                  {selectedUnitsData.length > 0 && (
                    <UnitConfiguration
                      selectedUnitsData={selectedUnitsData}
                      onUpdateUnitRent={onUpdateUnitRent}
                      onUpdateFloorRate={onUpdateFloorRate}
                      onRemoveUnit={handleRemoveUnit}
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed border-border">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Start Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-10 w-full justify-start text-left font-normal rounded-none border-border font-mono text-sm",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isLoading}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            disabled={isLoading}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">End Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-10 w-full justify-start text-left font-normal rounded-none border-border font-mono text-sm",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isLoading}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-none border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            disabled={isLoading}
                          />
                        </PopoverContent>
                      </Popover>
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
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Monthly Rent *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-mono text-muted-foreground">₱</span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                            className="h-10 pl-8 rounded-none border-border font-mono text-sm focus-visible:ring-0 focus-visible:border-primary"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Security Deposit *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-mono text-muted-foreground">₱</span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                            className="h-10 pl-8 rounded-none border-border font-mono text-sm focus-visible:ring-0 focus-visible:border-primary"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}