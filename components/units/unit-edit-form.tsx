import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus, Trash2, Home, ArrowUp, ArrowUpRight, Layers, Warehouse, Info, Building } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { UnitFormData } from "@/lib/validations/unit-schema"
import { UseFormReturn } from "react-hook-form"
import { UnitStatus } from "@prisma/client"

interface FloorConfig {
  id: string
  floorType: string
  area: number
  ratePerSqm: number
  floorRent: number
}

interface UnitEditFormProps {
  unit: UnitWithDetails
  form: UseFormReturn<UnitFormData>
  isSaving: boolean
  onFloorsChange?: (floors: FloorConfig[]) => void
}

const unitStatusOptions = [
  { 
    value: UnitStatus.VACANT, 
    label: "VACANT", 
    description: "Available for lease",
    color: "bg-emerald-600"
  },
  { 
    value: UnitStatus.OCCUPIED, 
    label: "OCCUPIED", 
    description: "Currently leased",
    color: "bg-blue-600"
  },
  { 
    value: UnitStatus.MAINTENANCE, 
    label: "MAINTENANCE", 
    description: "Under repair or renovation",
    color: "bg-rose-600"
  },
  { 
    value: UnitStatus.RESERVED, 
    label: "RESERVED", 
    description: "Reserved for future tenant",
    color: "bg-amber-600"
  },
]

const floorTypeOptions = [
  { value: "GROUND_FLOOR", label: "GROUND_FLOOR", icon: Home },
  { value: "SECOND_FLOOR", label: "SECOND_FLOOR", icon: ArrowUp },
  { value: "THIRD_FLOOR", label: "THIRD_FLOOR", icon: ArrowUpRight },
  { value: "MEZZANINE", label: "MEZZANINE", icon: Layers },
  { value: "ROOFTOP", label: "ROOFTOP", icon: Warehouse },
  { value: "BASEMENT", label: "BASEMENT", icon: Layers },
  { value: "OTHER", label: "OTHER", icon: Building },
]

export function UnitEditForm({ unit, form, isSaving, onFloorsChange }: UnitEditFormProps) {
  const [floors, setFloors] = useState<FloorConfig[]>([])

  // Initialize floors from unit data
  useEffect(() => {
    if (unit.unitFloors.length > 0) {
      const initialFloors = unit.unitFloors.map(floor => ({
        id: floor.id,
        // Use the raw floorType from DB (e.g. "GROUND_FLOOR") to match options
        floorType: floor.floorType, 
        area: floor.area,
        ratePerSqm: floor.rate,
        floorRent: floor.rent
      }))
      setFloors(initialFloors)
      onFloorsChange?.(initialFloors)
    } else {
      // Default floor if none exist
      const defaultFloors = [{
        id: crypto.randomUUID(),
        floorType: "",
        area: 0,
        ratePerSqm: 0,
        floorRent: 0
      }]
      setFloors(defaultFloors)
      onFloorsChange?.(defaultFloors)
    }
  }, [unit.unitFloors, onFloorsChange])

  const addFloor = () => {
    const newFloors = [...floors, {
      id: crypto.randomUUID(),
      floorType: "",
      area: 0,
      ratePerSqm: 0,
      floorRent: 0
    }]
    setFloors(newFloors)
    onFloorsChange?.(newFloors)
  }

  const removeFloor = (id: string) => {
    if (floors.length > 1) {
      const updatedFloors = floors.filter(floor => floor.id !== id)
      setFloors(updatedFloors)
      onFloorsChange?.(updatedFloors)
      
      // Calculate totals with the updated floors
      const totalArea = updatedFloors.reduce((sum, floor) => sum + floor.area, 0)
      const totalRent = updatedFloors.reduce((sum, floor) => sum + floor.floorRent, 0)
      
      form.setValue('totalArea', totalArea)
      form.setValue('totalRent', totalRent)
    }
  }

  const updateFloor = (id: string, field: keyof FloorConfig, value: string | number) => {
    const updatedFloors = floors.map(floor => {
      if (floor.id === id) {
        const updatedFloor = { ...floor, [field]: value }
        // Auto-calculate floor rent when area or rate changes
        if (field === 'area' || field === 'ratePerSqm') {
          updatedFloor.floorRent = updatedFloor.area * updatedFloor.ratePerSqm
        }
        return updatedFloor
      }
      return floor
    })
    
    setFloors(updatedFloors)
    onFloorsChange?.(updatedFloors)
    
    // Calculate totals with the updated floors
    const totalArea = updatedFloors.reduce((sum, floor) => sum + floor.area, 0)
    const totalRent = updatedFloors.reduce((sum, floor) => sum + floor.floorRent, 0)
    
    form.setValue('totalArea', totalArea)
    form.setValue('totalRent', totalRent)
  }

  // Get icon for floor type
  const getFloorIcon = (floorType: string) => {
    const option = floorTypeOptions.find(opt => opt.value === floorType)
    return option ? option.icon : Home
  }

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Info className="h-3 w-3" />
            Space Identity
          </span>
        </div>
        <div className="p-6">
          <Form {...form}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Space Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="SPACE_ID" 
                          {...field}
                          disabled={isSaving}
                          className="rounded-none border-border font-mono text-sm h-10 focus-visible:ring-0 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Current Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                        <FormControl>
                          <SelectTrigger className="rounded-none border-border h-10 font-mono text-xs uppercase">
                            <SelectValue placeholder="SELECT_STATUS" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-none border-border">
                          {unitStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="font-mono text-xs uppercase">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${option.color}`} />
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

                {unit.property && (
                  <FormField
                    control={form.control}
                    name="propertyTitleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Associated Title</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "no-title"} disabled={isSaving}>
                          <FormControl>
                            <SelectTrigger className="rounded-none border-border h-10 font-mono text-xs">
                              <SelectValue placeholder="No title linked" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none border-border">
                            <SelectItem value="no-title" className="font-mono text-xs">NO_TITLE_LINKED</SelectItem>
                            {unit.propertyTitle && (
                              <SelectItem value={unit.propertyTitle.id} className="font-mono text-xs">
                                {unit.propertyTitle.titleNo} (Lot {unit.propertyTitle.lotNo})
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Area and Rent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed border-border">
                <FormField
                  control={form.control}
                  name="totalArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Total Floor Area (sqm)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSaving}
                            className="rounded-none border-border font-mono text-sm h-10 pr-12 focus-visible:ring-0 focus-visible:border-primary"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">
                            SQM
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Total Monthly Rent</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">
                            ₱
                          </span>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isSaving}
                            className="rounded-none border-border font-mono text-sm h-10 pl-8 focus-visible:ring-0 focus-visible:border-primary"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* Floor Configuration */}
      <div className="border border-border bg-background">
        <div className="border-b border-border bg-muted/10 p-3 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Layers className="h-3 w-3" />
            Floor Configuration
          </span>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addFloor}
            disabled={isSaving}
            className="rounded-none h-7 text-[10px] font-mono uppercase tracking-wider border-border hover:bg-muted"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add Floor
          </Button>
        </div>
        <div className="p-6 space-y-4">
          {floors.map((floor, index) => {
            const FloorIcon = getFloorIcon(floor.floorType)
            return (
              <div key={floor.id} className="relative border border-border bg-background p-4 group hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between mb-4 border-b border-dashed border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 border border-border bg-muted/10">
                      <FloorIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider font-mono">Floor {index + 1}</span>
                  </div>
                  {floors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFloor(floor.id)}
                      disabled={isSaving}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Floor Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Type</label>
                    <Select 
                      value={floor.floorType} 
                      onValueChange={(value) => updateFloor(floor.id, 'floorType', value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-full rounded-none h-9 border-border font-mono text-xs uppercase">
                        <SelectValue placeholder="SELECT FLOOR TYPE">
                          {floor.floorType && (
                            <div className="flex items-center gap-2">
                              <FloorIcon className="h-3 w-3" />
                              <span>{floor.floorType}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border">
                        {floorTypeOptions.map((option) => {
                          const OptionIcon = option.icon
                          return (
                            <SelectItem key={option.value} value={option.value} className="font-mono text-xs uppercase">
                              <div className="flex items-center gap-2">
                                <OptionIcon className="h-3 w-3" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Area */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Area (sqm)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={floor.area || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          updateFloor(floor.id, 'area', value)
                        }}
                        disabled={isSaving}
                        className="rounded-none h-9 border-border font-mono text-xs pr-8 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                  </div>

                  {/* Rate per sqm */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Rate (₱/sqm)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">₱</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={floor.ratePerSqm || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          updateFloor(floor.id, 'ratePerSqm', value)
                        }}
                        disabled={isSaving}
                        className="rounded-none h-9 border-border font-mono text-xs pl-6 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>
                  </div>

                  {/* Floor Rent (calculated) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Floor Rent</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-mono text-muted-foreground">₱</span>
                      <Input
                        type="number"
                        value={floor.floorRent.toFixed(2)}
                        disabled
                        className="rounded-none h-9 border-border font-mono text-xs pl-6 bg-muted/10 text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Total Summary */}
      <div className="border border-border bg-background p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground">Calculated Totals</span>
        </div>
        <div className="flex gap-6 text-sm font-mono">
          <div>
            <span className="text-muted-foreground mr-2">Area:</span>
            <span className="font-medium">{form.watch('totalArea')?.toLocaleString() || 0} sqm</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-2">Rent:</span>
            <span className="font-medium">₱{form.watch('totalRent')?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}