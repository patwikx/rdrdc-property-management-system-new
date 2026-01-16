"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UnitSchema, UnitFormData } from "@/lib/validations/unit-schema"
import { createUnit } from "@/lib/actions/unit-actions"
import { UnitStatus } from "@prisma/client"
import { Save, Home, Plus, Trash2, Building, ArrowUp, ArrowUpRight, Layers, Warehouse, Check, ChevronsUpDown, Info, Ruler } from "lucide-react"
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
  formId?: string
  hideActions?: boolean
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

export function CreateUnitForm({ propertyId, propertyTitles, onSuccess, onCancel, formId, hideActions }: CreateUnitFormProps) {
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
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Space Identity */}
            <div className="border border-border bg-background">
              <div className="border-b border-border bg-muted/10 p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Info className="h-3 w-3" />
                  Space Identity
                </span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="unitNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Space Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. 101, A-1" 
                            {...field}
                            disabled={isLoading}
                            className="rounded-none font-mono text-sm h-10 border-border focus-visible:ring-0 focus-visible:border-primary"
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="rounded-none border-border h-10 font-mono text-xs uppercase">
                              <SelectValue placeholder="Select Status" />
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

                  {propertyTitles.length > 0 && (
                    <FormField
                      control={form.control}
                      name="propertyTitleId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Associated Title</FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={open}
                                  disabled={isLoading}
                                  className={cn(
                                    "rounded-none h-10 justify-between border-border font-mono text-xs uppercase",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? propertyTitles.find((title) => title.id === field.value)?.titleNo
                                    : "Select Title"}
                                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 rounded-none border-border" align="start">
                              <Command>
                                <CommandInput placeholder="Search titles..." className="font-mono text-xs uppercase" />
                                <CommandList>
                                  <CommandEmpty>No titles found</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="no-title"
                                      onSelect={() => {
                                        field.onChange(undefined)
                                        setOpen(false)
                                      }}
                                      className="font-mono text-xs uppercase"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3 w-3",
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
                                        className="font-mono text-xs uppercase"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-3 w-3",
                                            field.value === title.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{title.titleNo}</span>
                                          <span className="text-[10px] text-muted-foreground">Lot {title.lotNo}</span>
                                        </div>
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
                  )}
                </div>
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
                  disabled={isLoading}
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
                            disabled={isLoading}
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
                            disabled={isLoading}
                          >
                            <SelectTrigger className="w-full rounded-none h-9 border-border font-mono text-xs uppercase">
                              <SelectValue placeholder="Select Floor Type">
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
                              disabled={isLoading}
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
                              disabled={isLoading}
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
                <Ruler className="h-4 w-4 text-primary" />
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

            {/* Submit Buttons */}
            {!hideActions && (
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-none h-10 font-mono text-xs uppercase tracking-wide border-border">
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isLoading} className="min-w-[140px] rounded-none h-10 font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90">
                  {isLoading ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Create Space</>}
                </Button>
              </div>
            )}
          </form>
        </Form>
    </div>
  )
}