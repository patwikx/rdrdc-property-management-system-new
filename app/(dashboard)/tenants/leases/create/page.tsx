"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Building, Users, Calendar as CalendarIcon, DollarSign, Search, X, TrendingUp } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { createLease, getAvailableUnits, AvailableUnit } from "@/lib/actions/lease-actions"
import { getAllTenants } from "@/lib/actions/tenant-actions"
import { UnitCard } from "@/components/lease-form/unit-card"
import { UnitConfiguration } from "@/components/lease-form/unit-configuration"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { z } from "zod"
import { Check, ChevronsUpDown } from "lucide-react"

// Types
interface Tenant {
  id: string
  bpCode: string
  firstName: string | null
  lastName: string | null
  company: string
  businessName: string
  email: string
  status: string
}

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

// Form Schema
const LeaseFormSchema = z.object({
  tenantId: z.string().min(1, "Please select a tenant"),
  startDate: z.date({ message: "Start date is required" }),
  endDate: z.date({ message: "End date is required" }),
  securityDeposit: z.number().min(0, "Security deposit must be positive"),
  // Rate increase settings - required fields (Requirements 1.2, 1.3)
  standardIncreasePercentage: z.number().min(0, "Percentage must be positive").max(100, "Percentage cannot exceed 100"),
  increaseIntervalYears: z.number().min(1, "Interval must be at least 1 year").max(10, "Interval cannot exceed 10 years"),
  autoIncreaseEnabled: z.boolean()
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
})

type LeaseFormData = z.infer<typeof LeaseFormSchema>

export default function CreateLeasePage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [units, setUnits] = useState<AvailableUnit[]>([])
  const [selectedUnitsData, setSelectedUnitsData] = useState<SelectedUnitData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [openTenantSelect, setOpenTenantSelect] = useState(false)
  const [openPropertySelect, setOpenPropertySelect] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<string>("all")
  const [minArea, setMinArea] = useState<string>("")
  const [maxArea, setMaxArea] = useState<string>("")
  const [minRent, setMinRent] = useState<string>("")
  const [maxRent, setMaxRent] = useState<string>("")

  const form = useForm<LeaseFormData>({
    resolver: zodResolver(LeaseFormSchema),
    defaultValues: {
      tenantId: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      securityDeposit: 0,
      // Rate increase settings - sensible defaults provided; user may override
      standardIncreasePercentage: 10,
      increaseIntervalYears: 3,
      autoIncreaseEnabled: true
    },
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [tenantsResult, unitsResult] = await Promise.all([
          getAllTenants(),
          getAvailableUnits()
        ])
        
        setTenants(tenantsResult.filter(t => t.status === 'ACTIVE'))
        setUnits(unitsResult)
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load tenants and units')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Get unique properties for filter dropdown
  const properties = useMemo(() => {
    const uniqueProps = new Map<string, string>()
    units.forEach(unit => {
      uniqueProps.set(unit.property.id, unit.property.propertyName)
    })
    return Array.from(uniqueProps.entries()).map(([id, name]) => ({ id, name }))
  }, [units])

  // Filter and search units
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.property.propertyName.toLowerCase().includes(searchQuery.toLowerCase())

      // Property filter
      const matchesProperty = selectedProperty === "all" || 
        unit.property.id === selectedProperty

      // Area filter
      const matchesMinArea = minArea === "" || 
        unit.totalArea >= parseFloat(minArea)
      const matchesMaxArea = maxArea === "" || 
        unit.totalArea <= parseFloat(maxArea)

      // Rent filter
      const matchesMinRent = minRent === "" || 
        unit.totalRent >= parseFloat(minRent)
      const matchesMaxRent = maxRent === "" || 
        unit.totalRent <= parseFloat(maxRent)

      return matchesSearch && matchesProperty && matchesMinArea && 
             matchesMaxArea && matchesMinRent && matchesMaxRent
    })
  }, [units, searchQuery, selectedProperty, minArea, maxArea, minRent, maxRent])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedProperty("all")
    setMinArea("")
    setMaxArea("")
    setMinRent("")
    setMaxRent("")
  }

  const hasActiveFilters = searchQuery !== "" || selectedProperty !== "all" || 
    minArea !== "" || maxArea !== "" || minRent !== "" || maxRent !== ""

  const toggleUnitSelection = (unit: AvailableUnit, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const isSelected = selectedUnitsData.some(u => u.unit.id === unit.id)
    
    if (isSelected) {
      setSelectedUnitsData(prev => prev.filter(u => u.unit.id !== unit.id))
    } else {
      const newUnitData: SelectedUnitData = {
        unit,
        customRentAmount: unit.totalRent || 0,
        floorOverrides: unit.unitFloors.map((floor) => ({
          floorId: floor.id,
          customRate: floor.rate || 0,
          customRent: floor.rent || 0
        }))
      }
      setSelectedUnitsData(prev => [...prev, newUnitData])
    }
  }

  const updateUnitRent = (unitId: string, newRent: number) => {
    setSelectedUnitsData(prev => 
      prev.map(unitData => 
        unitData.unit.id === unitId 
          ? { ...unitData, customRentAmount: newRent }
          : unitData
      )
    )
  }

  const updateFloorRate = (unitId: string, floorId: string, newRate: number, area: number) => {
    setSelectedUnitsData(prev => 
      prev.map(unitData => {
        if (unitData.unit.id === unitId) {
          const updatedFloorOverrides = unitData.floorOverrides.map(floor => {
            if (floor.floorId === floorId) {
              return {
                ...floor,
                customRate: newRate,
                customRent: newRate * area
              }
            }
            return floor
          })
          
          const newTotalRent = updatedFloorOverrides.reduce((sum, floor) => sum + floor.customRent, 0)
          
          return {
            ...unitData,
            floorOverrides: updatedFloorOverrides,
            customRentAmount: newTotalRent
          }
        }
        return unitData
      })
    )
  }

  const handleRemoveUnit = (unitId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setSelectedUnitsData(prev => prev.filter(u => u.unit.id !== unitId))
  }

  const calculateTotalRent = () => {
    return selectedUnitsData.reduce((sum, unitData) => sum + unitData.customRentAmount, 0)
  }

  async function onSubmit(data: LeaseFormData) {
    if (selectedUnitsData.length === 0) {
      toast.error("Please select at least one space")
      return
    }

    setIsSaving(true)
    
    try {
      const leaseData = {
        tenantId: data.tenantId,
        startDate: data.startDate,
        endDate: data.endDate,
        securityDeposit: data.securityDeposit,
        selectedUnits: selectedUnitsData.map(unitData => ({
          unitId: unitData.unit.id,
          customRentAmount: unitData.customRentAmount,
          floorOverrides: unitData.floorOverrides
        })),
        // Rate increase settings (Requirements 1.2, 1.3)
        standardIncreasePercentage: data.standardIncreasePercentage,
        increaseIntervalYears: data.increaseIntervalYears,
        autoIncreaseEnabled: data.autoIncreaseEnabled
      }

      const result = await createLease(leaseData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Lease created successfully")
        router.push("/tenants/leases")
      }
    } catch (error) {
      console.error("Error creating lease:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getTenantName = (tenant: Tenant) => {
    return tenant.businessName || tenant.company
  }

  const getTenantDisplayText = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId)
    return tenant ? getTenantName(tenant) : "Select a tenant"
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Lease</h2>
          <p className="text-muted-foreground">
            Create a new lease agreement for a tenant
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Tenant Information</span>
                  </CardTitle>
                  <CardDescription>
                    Select the tenant for this lease agreement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tenant</FormLabel>
                        <Popover open={openTenantSelect} onOpenChange={setOpenTenantSelect}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openTenantSelect}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? getTenantDisplayText(field.value) : "Select a tenant"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search tenant..." />
                              <CommandList>
                                <CommandEmpty>No tenant found.</CommandEmpty>
                                <CommandGroup>
                                  {tenants.map((tenant) => (
                                    <CommandItem
                                      key={tenant.id}
                                      value={`${getTenantName(tenant)} ${tenant.bpCode} ${tenant.email}`}
                                      onSelect={() => {
                                        form.setValue("tenantId", tenant.id)
                                        setOpenTenantSelect(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === tenant.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex items-center space-x-2">
                                         <Badge variant="outline" className="text-xs">
                                          {tenant.bpCode}
                                        </Badge>
                                        <span>{getTenantName(tenant)}</span>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Lease Period</span>
                  </CardTitle>
                  <CardDescription>
                    Set the start and end dates for the lease
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              captionLayout="dropdown"
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
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              captionLayout="dropdown"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Space Selection</span>
                  </CardTitle>
                  <CardDescription>
                    Select spaces to include in this lease and configure rent amounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {units.length === 0 ? (
                    <div className="text-center py-8">
                      <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No available spaces</h3>
                      <p className="mt-2 text-muted-foreground">
                        All spaces are currently occupied or reserved.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search and Filters Bar */}
                      <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by space number or property..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>

                        {/* Property Filter - Combobox */}
                        <Popover open={openPropertySelect} onOpenChange={setOpenPropertySelect}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={openPropertySelect}
                              className="w-[200px] justify-between"
                            >
                              {selectedProperty === "all"
                                ? "All properties"
                                : properties.find((p) => p.id === selectedProperty)?.name}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput placeholder="Search property..." />
                              <CommandList>
                                <CommandEmpty>No property found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="all"
                                    onSelect={() => {
                                      setSelectedProperty("all")
                                      setOpenPropertySelect(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
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
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
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

                        {/* Area Min */}
                        <Input
                          type="number"
                          placeholder="Min area (sqm)"
                          value={minArea}
                          onChange={(e) => setMinArea(e.target.value)}
                          className="w-[140px]"
                        />

                        {/* Area Max */}
                        <Input
                          type="number"
                          placeholder="Max area (sqm)"
                          value={maxArea}
                          onChange={(e) => setMaxArea(e.target.value)}
                          className="w-[140px]"
                        />

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={clearFilters}
                            title="Clear all filters"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Active Filters Badges */}
                      {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-muted-foreground">Active filters:</span>
                          {selectedProperty !== "all" && (
                            <Badge variant="secondary" className="gap-1">
                              {properties.find(p => p.id === selectedProperty)?.name}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setSelectedProperty("all")}
                              />
                            </Badge>
                          )}
                          {minArea && (
                            <Badge variant="secondary" className="gap-1">
                              Min: {minArea} sqm
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setMinArea("")}
                              />
                            </Badge>
                          )}
                          {maxArea && (
                            <Badge variant="secondary" className="gap-1">
                              Max: {maxArea} sqm
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setMaxArea("")}
                              />
                            </Badge>
                          )}
                          {minRent && (
                            <Badge variant="secondary" className="gap-1">
                              Min: ₱{minRent}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setMinRent("")}
                              />
                            </Badge>
                          )}
                          {maxRent && (
                            <Badge variant="secondary" className="gap-1">
                              Max: ₱{maxRent}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => setMaxRent("")}
                              />
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Results */}
                      {filteredUnits.length === 0 ? (
                        <div className="text-center py-12">
                          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No spaces found</h3>
                          <p className="mt-2 text-muted-foreground">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground">
                            Showing {filteredUnits.length} of {units.length} spaces
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Financial Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                              ₱
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selected Spaces:</span>
                      <span className="font-medium">{selectedUnitsData.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Monthly Rent:</span>
                      <span className="font-medium">₱{calculateTotalRent().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit:</span>
                      <span className="font-medium">₱{form.watch('securityDeposit')?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Initial Payment:</span>
                      <span>₱{(calculateTotalRent() + (form.watch('securityDeposit') || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Increase Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Rate Increase Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure automatic rate increase parameters for this lease
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="standardIncreasePercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standard Increase Percentage *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Percentage increase applied at each interval
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="increaseIntervalYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Increase Interval *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              step="1"
                              placeholder="3"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              className="pr-12"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                              years
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Number of years between rate increases
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoIncreaseEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Enable Automatic Rate Increases
                          </FormLabel>
                          <FormDescription>
                            When enabled, the system will automatically flag this lease for rate increases at the specified interval
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSaving || selectedUnitsData.length === 0}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating Lease...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Lease
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/tenants/leases">
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}