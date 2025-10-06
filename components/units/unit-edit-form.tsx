import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Building2, Edit, Plus, Trash2, Ruler, Home, ArrowUp, ArrowUpRight, Layers, Warehouse } from "lucide-react"
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
    label: "Vacant", 
    description: "Available for lease",
    color: "bg-gray-600"
  },
  { 
    value: UnitStatus.OCCUPIED, 
    label: "Occupied", 
    description: "Currently leased",
    color: "bg-green-600"
  },
  { 
    value: UnitStatus.MAINTENANCE, 
    label: "Maintenance", 
    description: "Under repair or renovation",
    color: "bg-yellow-600"
  },
  { 
    value: UnitStatus.RESERVED, 
    label: "Reserved", 
    description: "Reserved for future tenant",
    color: "bg-blue-600"
  },
]

const floorTypeOptions = [
  { value: "Ground Floor", label: "Ground Floor", icon: Home },
  { value: "Second Floor", label: "Second Floor", icon: ArrowUp },
  { value: "Third Floor", label: "Third Floor", icon: ArrowUpRight },
  { value: "Mezzanine", label: "Mezzanine", icon: Layers },
  { value: "Rooftop", label: "Rooftop", icon: Warehouse },
]

export function UnitEditForm({ unit, form, isSaving, onFloorsChange }: UnitEditFormProps) {
  const [floors, setFloors] = useState<FloorConfig[]>([])

  // Initialize floors from unit data
  useEffect(() => {
    if (unit.unitFloors.length > 0) {
      const initialFloors = unit.unitFloors.map(floor => ({
        id: floor.id,
        floorType: floor.floorType.replace('_', ' '),
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
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription>Update space details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Space Number *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 101, A-1, Ground Floor" 
                        {...field}
                        disabled={isSaving}
                        className="h-10"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Unique identifier for this space
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Current Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select space status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${option.color.replace('bg-', 'bg-')}`} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Current availability status
                    </FormDescription>
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
                      <FormLabel className="text-sm font-medium">Associated Property Title</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select a property title (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-title">No specific title</SelectItem>
                          {unit.propertyTitle && (
                            <SelectItem value={unit.propertyTitle.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{unit.propertyTitle.titleNo}</span>
                                <span className="text-xs text-muted-foreground">Lot {unit.propertyTitle.lotNo}</span>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Link this space to a specific property title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Area and Rent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Total Floor Area (sqm) *</FormLabel>
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
                          className="h-10 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                          sqm
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Total floor area of the space
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Total Monthly Rent *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
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
                          className="h-10 pl-8"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Monthly rental amount for this space
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Floor Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Floor Configuration</span>
              </CardTitle>
              <CardDescription>Configure individual floors and rental rates</CardDescription>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addFloor}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Floor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {floors.map((floor, index) => {
              const FloorIcon = getFloorIcon(floor.floorType)
              return (
                <Card key={floor.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FloorIcon className="h-4 w-4 text-muted-foreground" />
                        Floor {index + 1}
                        {floor.floorType && (
                          <span className="text-xs text-muted-foreground font-normal">
                            ({floor.floorType})
                          </span>
                        )}
                      </CardTitle>
                      {floors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFloor(floor.id)}
                          disabled={isSaving}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Floor Type */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Floor Type *</label>
                        <Select 
                          value={floor.floorType} 
                          onValueChange={(value) => updateFloor(floor.id, 'floorType', value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Select type">
                              {floor.floorType && (
                                <div className="flex items-center gap-2">
                                  <FloorIcon className="h-4 w-4" />
                                  <span>{floor.floorType}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {floorTypeOptions.map((option) => {
                              const OptionIcon = option.icon
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <OptionIcon className="h-4 w-4" />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Area */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Area (sqm) *</label>
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
                            className="h-10 pr-12"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            sqm
                          </span>
                        </div>
                      </div>

                      {/* Rate per sqm */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rate (₱/sqm) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            ₱
                          </span>
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
                            className="h-10 pl-8"
                          />
                        </div>
                      </div>

                      {/* Floor Rent (calculated) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Floor Rent</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            ₱
                          </span>
                          <Input
                            type="number"
                            value={floor.floorRent.toFixed(2)}
                            disabled
                            className="h-10 pl-8 bg-muted"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Auto-calculated</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ruler className="h-5 w-5" />
            <span>Total Summary</span>
          </CardTitle>
          <CardDescription>Calculated totals from floor configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Total Floor Area (sqm)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          disabled
                          className="h-10 pr-12 bg-muted"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                          sqm
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Sum of all floor areas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Total Monthly Rent</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                          ₱
                        </span>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value.toFixed(2)}
                          disabled
                          className="h-10 pl-8 bg-muted"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Auto-calculated from floor rent totals
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}