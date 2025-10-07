"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UnitSchema, UnitFormData } from "@/lib/validations/unit-schema"
import { createUnit } from "@/lib/actions/unit-actions"
import { UnitStatus } from "@prisma/client"
import { Save, Home, Ruler, Plus, Trash2, Building, ArrowUp, ArrowUpRight, Layers, Warehouse, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FloorConfig {
  id: string
  floorType: string
  area: number
  ratePerSqm: number
  floorRent: number
}

interface CreateUnitFormProps {
  propertyId: string
  propertyTitles: Array<{
    id: string
    titleNo: string
    lotNo: string
  }>
  onSuccess?: () => void
  onCancel?: () => void
}

const unitStatusOptions = [
  { 
    value: UnitStatus.VACANT, 
    label: "Vacant", 
    description: "Available for lease",
    color: "bg-green-600"
  },
  { 
    value: UnitStatus.OCCUPIED, 
    label: "Occupied", 
    description: "Currently leased",
    color: "bg-red-600"
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

export function CreateUnitForm({ propertyId, propertyTitles, onSuccess, onCancel }: CreateUnitFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [floors, setFloors] = useState<FloorConfig[]>([
    {
      id: crypto.randomUUID(),
      floorType: "",
      area: 0,
      ratePerSqm: 0,
      floorRent: 0
    }
  ])

  const form = useForm<UnitFormData>({
    resolver: zodResolver(UnitSchema),
    defaultValues: {
      propertyId,
      unitNumber: "",
      totalArea: 0,
      totalRent: 0,
      status: UnitStatus.VACANT,
      propertyTitleId: undefined,
    },
  })

  const addFloor = () => {
    setFloors([...floors, {
      id: crypto.randomUUID(),
      floorType: "",
      area: 0,
      ratePerSqm: 0,
      floorRent: 0
    }])
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
    
    // Calculate totals with the updated floors
    const totalArea = updatedFloors.reduce((sum, floor) => sum + floor.area, 0)
    const totalRent = updatedFloors.reduce((sum, floor) => sum + floor.floorRent, 0)
    
    form.setValue('totalArea', totalArea)
    form.setValue('totalRent', totalRent)
  }

  const removeFloor = (id: string) => {
    if (floors.length > 1) {
      const updatedFloors = floors.filter(floor => floor.id !== id)
      setFloors(updatedFloors)
      
      // Calculate totals with the updated floors
      const totalArea = updatedFloors.reduce((sum, floor) => sum + floor.area, 0)
      const totalRent = updatedFloors.reduce((sum, floor) => sum + floor.floorRent, 0)
      
      form.setValue('totalArea', totalArea)
      form.setValue('totalRent', totalRent)
    }
  }

  // Get icon for floor type
  const getFloorIcon = (floorType: string) => {
    const option = floorTypeOptions.find(opt => opt.value === floorType)
    return option ? option.icon : Home
  }

  async function onSubmit(data: UnitFormData) {
    setIsLoading(true)
    
    try {
      // Clean up the data before submission
      const cleanedData = {
        ...data,
        propertyTitleId: data.propertyTitleId && data.propertyTitleId !== "no-title" 
          ? data.propertyTitleId 
          : undefined
      }

      const result = await createUnit(cleanedData)
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof UnitFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Space created successfully")
        form.reset()
        onSuccess?.()
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Unit Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Home className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              
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
                          disabled={isLoading}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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

                {propertyTitles.length > 0 && (
                  <FormField
                    control={form.control}
                    name="propertyTitleId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm font-medium">Associated Property Title</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                disabled={isLoading}
                                className={cn(
                                  "h-10 justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? propertyTitles.find((title) => title.id === field.value)?.titleNo
                                  : "Select property title (optional)"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search property titles..." />
                              <CommandList>
                                <CommandEmpty>No property title found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="no-title"
                                    onSelect={() => {
                                      field.onChange(undefined)
                                      setOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        !field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="text-muted-foreground">No specific title</span>
                                  </CommandItem>
                                  {propertyTitles.map((title) => (
                                    <CommandItem
                                      key={title.id}
                                      value={`${title.titleNo}-${title.lotNo}`}
                                      onSelect={() => {
                                        field.onChange(title.id)
                                        setOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === title.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{title.titleNo}</span>
                                        <span className="text-xs text-muted-foreground">Lot {title.lotNo}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs">
                          Link this space to a specific property title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Floor Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Floor Configuration</h3>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addFloor}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Floor
                </Button>
              </div>
              
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
                              disabled={isLoading}
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
                              disabled={isLoading}
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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
            </div>

            {/* Physical & Financial Summary */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Ruler className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Total Summary</h3>
              </div>
              
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
            </div>

            {/* Unit Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Space Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Space:</span>
                    <p className="text-foreground font-medium">{form.watch('unitNumber') || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Status:</span>
                    <div className="flex items-center space-x-1 mt-1">
                      {form.watch('status') && (
                        <Badge className={unitStatusOptions.find(opt => opt.value === form.watch('status'))?.color || 'bg-gray-600'}>
                          {unitStatusOptions.find(opt => opt.value === form.watch('status'))?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Total Area:</span>
                    <p className="text-foreground font-medium">{form.watch('totalArea') || 0} sqm</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Total Rent:</span>
                    <p className="text-foreground font-medium">₱{(form.watch('totalRent') || 0).toLocaleString()}</p>
                  </div>
                </div>
                
                {floors.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium mb-2">Floor Breakdown:</h5>
                    <div className="space-y-2">
                      {floors.map((floor, index) => {
                        const FloorIcon = getFloorIcon(floor.floorType)
                        return (
                          <div key={floor.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                            <span className="flex items-center gap-2">
                              <FloorIcon className="h-4 w-4 text-muted-foreground" />
                              {floor.floorType || `Floor ${index + 1}`}
                            </span>
                            <span>{floor.area} sqm × ₱{floor.ratePerSqm}/sqm = ₱{floor.floorRent.toLocaleString()}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Space
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  )
}