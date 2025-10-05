"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Save, User, Building, Phone, Calendar, Home, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createTenantAction, createTenantWithLeaseAction } from "@/lib/actions/tenant-server-actions"
import { getPropertyById, getProperties, PropertyWithDetails } from "@/lib/actions/property-actions"

const TenantSchema = z.object({
  // Basic Info
  bpCode: z.string().min(1, "BP Code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  
  // Contact Info
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  
  // Business Info
  company: z.string().min(1, "Company is required"),
  businessName: z.string().min(1, "Business name is required"),
  
  // Optional Lease Info
  createLease: z.boolean(),
  propertyId: z.string().optional(),
  selectedUnits: z.array(z.object({
    unitId: z.string(),
    customRentAmount: z.number().optional(),
    floorOverrides: z.array(z.object({
      floorId: z.string(),
      customRate: z.number().optional(),
      customRent: z.number().optional(),
    })).optional(),
  })).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  totalRentAmount: z.number().optional(),
  securityDeposit: z.number().optional(),
  leaseStatus: z.enum(['ACTIVE', 'PENDING']).optional(),
})

type TenantFormData = z.infer<typeof TenantSchema>

// Type definitions for unit and floor data
type UnitData = PropertyWithDetails['units'][0]


interface FloorOverride {
  floorId: string
  customRate: number
  customRent: number
}

interface SelectedUnitData {
  unit: UnitData
  customRentAmount: number
  floorOverrides: FloorOverride[]
}

const statusOptions = [
  { 
    value: 'PENDING' as const, 
    label: "Pending", 
    description: "Application under review",
    color: "bg-yellow-600"
  },
  { 
    value: 'ACTIVE' as const, 
    label: "Active", 
    description: "Approved and active tenant",
    color: "bg-green-600"
  },
  { 
    value: 'INACTIVE' as const, 
    label: "Inactive", 
    description: "Inactive or suspended",
    color: "bg-gray-600"
  },
]

export default function CreateTenantPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [properties, setProperties] = useState<Array<{id: string, propertyName: string}>>([])
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithDetails | null>(null)
  const [selectedUnitsData, setSelectedUnitsData] = useState<SelectedUnitData[]>([])
  const [unitSearchQuery, setUnitSearchQuery] = useState("")

  const form = useForm<TenantFormData>({
    resolver: zodResolver(TenantSchema),
    defaultValues: {
      bpCode: "",
      firstName: "",
      lastName: "",
      status: 'PENDING',
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      company: "",
      businessName: "",
      createLease: false,
      propertyId: "",
      selectedUnits: [],
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      totalRentAmount: 0,
      securityDeposit: 0,
      leaseStatus: 'PENDING',
    },
  })

  const createLease = form.watch('createLease')
  const selectedPropertyId = form.watch('propertyId')
  const selectedStatus = form.watch('status')
  const selectedOption = statusOptions.find(opt => opt.value === selectedStatus)

  useEffect(() => {
    async function fetchProperties() {
      try {
        // For now, we'll fetch properties when a property is selected
        // This is a temporary solution - ideally we'd have a getPropertiesForLease function
        // that returns basic property info for the dropdown
        const propertiesData = await getProperties(1, 100) // Get first 100 properties
        setProperties(propertiesData.properties)
      } catch (error) {
        console.error("Error fetching properties:", error)
      }
    }
    fetchProperties()
  }, [])

  // Fetch detailed property data when a property is selected
  useEffect(() => {
    async function fetchPropertyDetails() {
      if (selectedPropertyId) {
        try {
          const propertyData = await getPropertyById(selectedPropertyId)
          if (propertyData) {
            console.log("Property data:", propertyData)
            console.log("Units:", propertyData.units)
            setSelectedProperty(propertyData)
            // Reset selected units when property changes
            form.setValue('selectedUnits', [])
            setSelectedUnitsData([])
          }
        } catch (error) {
          console.error("Error fetching property details:", error)
        }
      } else {
        setSelectedProperty(null)
        setSelectedUnitsData([])
      }
    }
    fetchPropertyDetails()
  }, [selectedPropertyId, form])



  // Calculate total rent when selected units change
  useEffect(() => {
    const totalRent = selectedUnitsData.reduce((sum, unitData) => {
      return sum + (unitData.customRentAmount || unitData.unit.totalRent || 0)
    }, 0)
    form.setValue('totalRentAmount', totalRent)
  }, [selectedUnitsData, form])

  const toggleUnitSelection = (unit: UnitData, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const isSelected = selectedUnitsData.some(u => u.unit.id === unit.id)
    
    if (isSelected) {
      // Remove unit
      const newSelectedUnits = selectedUnitsData.filter(u => u.unit.id !== unit.id)
      setSelectedUnitsData(newSelectedUnits)
      form.setValue('selectedUnits', newSelectedUnits.map(u => ({
        unitId: u.unit.id,
        customRentAmount: u.customRentAmount,
        floorOverrides: u.floorOverrides
      })))
    } else {
      // Add unit
      const newUnitData: SelectedUnitData = {
        unit,
        customRentAmount: unit.totalRent || 0,
        floorOverrides: unit.unitFloors?.map((floor) => ({
          floorId: floor.id,
          customRate: floor.rate || 0,
          customRent: floor.rent || 0
        })) || []
      }
      const newSelectedUnits = [...selectedUnitsData, newUnitData]
      setSelectedUnitsData(newSelectedUnits)
      form.setValue('selectedUnits', newSelectedUnits.map(u => ({
        unitId: u.unit.id,
        customRentAmount: u.customRentAmount,
        floorOverrides: u.floorOverrides
      })))
    }
  }

  const updateUnitRent = (unitId: string, newRent: number) => {
    const updatedUnits = selectedUnitsData.map(unitData => {
      if (unitData.unit.id === unitId) {
        return { ...unitData, customRentAmount: newRent }
      }
      return unitData
    })
    setSelectedUnitsData(updatedUnits)
    form.setValue('selectedUnits', updatedUnits.map(u => ({
      unitId: u.unit.id,
      customRentAmount: u.customRentAmount,
      floorOverrides: u.floorOverrides
    })))
  }

  const updateFloorRate = (unitId: string, floorId: string, newRate: number, area: number) => {
    const updatedUnits = selectedUnitsData.map(unitData => {
      if (unitData.unit.id === unitId) {
        const updatedFloorOverrides = unitData.floorOverrides.map((floor: FloorOverride) => {
          if (floor.floorId === floorId) {
            return {
              ...floor,
              customRate: newRate,
              customRent: newRate * area
            }
          }
          return floor
        })
        
        // Calculate new total rent for this unit
        const newTotalRent = updatedFloorOverrides.reduce((sum: number, floor: FloorOverride) => sum + floor.customRent, 0)
        
        return {
          ...unitData,
          floorOverrides: updatedFloorOverrides,
          customRentAmount: newTotalRent
        }
      }
      return unitData
    })
    setSelectedUnitsData(updatedUnits)
    form.setValue('selectedUnits', updatedUnits.map(u => ({
      unitId: u.unit.id,
      customRentAmount: u.customRentAmount,
      floorOverrides: u.floorOverrides
    })))
  }

  async function onSubmit(data: TenantFormData) {
    setIsLoading(true)
    
    try {
      if (data.createLease && data.propertyId && data.selectedUnits && data.selectedUnits.length > 0) {
        // Create tenant with lease
        const result = await createTenantWithLeaseAction({
          bpCode: data.bpCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          company: data.company,
          businessName: data.businessName,
          status: data.status,
          createLease: true,
          leaseData: {
            selectedUnits: data.selectedUnits,
            startDate: data.startDate || new Date(),
            endDate: data.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            totalRentAmount: data.totalRentAmount || 0,
            securityDeposit: data.securityDeposit || 0,
            leaseStatus: data.leaseStatus || 'PENDING',
          },
        })
        
        if (!result.success) {
          toast.error(result.error)
          return
        }
        
        toast.success("Tenant and lease created successfully!")
      } else {
        // Create tenant only
        const tenantResult = await createTenantAction({
          bpCode: data.bpCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          company: data.company,
          businessName: data.businessName,
          status: data.status,
        })
        
        if (tenantResult.error) {
          toast.error(tenantResult.error)
          if (tenantResult.details) {
            Object.entries(tenantResult.details).forEach(([field, error]) => {
              if (error && typeof error === 'object' && '_errors' in error) {
                const messages = (error as { _errors: string[] })._errors
                if (messages && messages.length > 0) {
                  form.setError(field as keyof TenantFormData, {
                    message: messages[0],
                  })
                }
              }
            })
          }
          return
        }
        
        toast.success("Tenant created successfully!")
      }

      router.push('/tenants')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Add New Tenant</h2>
            <p className="text-muted-foreground">
              Create a new tenant profile with optional lease setup
            </p>
          </div>
        </div>
      </div>

      {/* Create Tenant Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Details</CardTitle>
          <CardDescription>
            Configure the tenant information and optional lease setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Tenant Status */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Tenant Status</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Initial Status *</FormLabel>
                        <FormControl>
                          <div className="grid gap-4 md:grid-cols-3">
                            {statusOptions.map((option) => (
                              <div
                                key={option.value}
                                className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                                  field.value === option.value
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => field.onChange(option.value)}
                              >
                                <div className="flex flex-col items-center text-center space-y-2">
                                  <div className={`rounded-lg p-2 ${option.color}`}>
                                    <User className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-sm">{option.label}</h3>
                                    <p className="text-xs text-muted-foreground">
                                      {option.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Choose the initial status for this tenant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="bpCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">BP Code *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., BP001234, TNT-2024-001" 
                              {...field}
                              disabled={isLoading}
                              className="h-10 font-mono"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Unique Business Partner identification code
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">First Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="First name" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Tenant&apos;s first name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Last Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Last name" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Tenant&apos;s last name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="email@example.com" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Primary contact email address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+63 XXX XXX XXXX" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Primary contact phone number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Emergency contact name (optional)" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Name of emergency contact person
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Emergency Contact Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Emergency contact phone (optional)" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Phone number of emergency contact
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Business Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Company *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Legal company name" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Legal company name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Business Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Business or trade name" 
                              {...field}
                              disabled={isLoading}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Business or trade name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Optional Lease Setup */}
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
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Property *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                <FormControl>
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select property" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {properties.map((property) => (
                                    <SelectItem key={property.id} value={property.id}>
                                      {property.propertyName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                          <FormLabel className="text-sm font-medium">Available Units</FormLabel>
                          <FormDescription className="text-xs">
                            Select one or more units for this lease. Click on units to select them.
                          </FormDescription>
                          
                          {/* Unit Search */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search units by number, area, or rent..."
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
                                {availableUnits.length} available unit{availableUnits.length !== 1 ? 's' : ''} found 
                                (of {allUnits.length} total units)
                                {selectedUnitsData.length > 0 && (
                                  <span className="ml-2">• {selectedUnitsData.length} selected</span>
                                )}
                              </div>
                            )
                          })()}
                          
                          {/* Unit Grid - Matching Property Units Layout */}
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                            {selectedProperty.units
                              ?.filter((unit: UnitData) => 
                                (unit.status === 'VACANT' || unit.status === 'MAINTENANCE') &&
                                (unitSearchQuery === '' || 
                                 unit.unitNumber?.toLowerCase().includes(unitSearchQuery.toLowerCase()) ||
                                 unit.totalArea?.toString().includes(unitSearchQuery) ||
                                 unit.totalRent?.toString().includes(unitSearchQuery))
                              )
                              .map((unit: UnitData) => {
                                const isSelected = selectedUnitsData.some(u => u.unit.id === unit.id)
                                
                                return (
                                  <Card 
                                    key={unit.id} 
                                    className={`cursor-pointer transition-all hover:shadow-md ${
                                      isSelected 
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={(e) => toggleUnitSelection(unit, e)}
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
                                              {unit.unitFloors?.slice(0, 2).map((floor, index: number) => (
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
                              }) || []}
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
                                {unitSearchQuery ? 'No units found' : 'No available units'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {unitSearchQuery 
                                  ? 'Try adjusting your search terms'
                                  : 'All units in this property are currently occupied'
                                }
                              </p>
                            </div>
                          )}

                          {/* Selected Units Configuration */}
                          {selectedUnitsData.length > 0 && (
                            <div className="mt-6 space-y-4">
                              <div className="flex items-center space-x-2 pb-2 border-b">
                                <Building className="h-5 w-5 text-primary" />
                                <h4 className="font-medium">Selected Units Configuration</h4>
                              </div>
                              
                              {selectedUnitsData.map((unitData) => (
                                <Card key={unitData.unit.id} className="border-primary/20">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center justify-between">
                                      <span>Unit {unitData.unit.unitNumber}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => toggleUnitSelection(unitData.unit, e)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        Remove
                                      </Button>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {/* Unit Total Rent Override */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">Override Monthly Rent</label>
                                        <div className="relative mt-1">
                                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">₱</span>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={unitData.customRentAmount || 0}
                                            onChange={(e) => updateUnitRent(unitData.unit.id, parseFloat(e.target.value) || 0)}
                                            className="h-10 pl-8"
                                            placeholder="0.00"
                                          />
                                        </div>
                                        <FormDescription className="text-xs mt-1">
                                          Override the total monthly rent for this unit
                                        </FormDescription>
                                      </div>
                                      
                                      <div className="flex items-end">
                                        <div>
                                          <div className="text-muted-foreground mt-[-65px]">Original Rent:</div>
                                          <div className="font-medium">₱{(unitData.unit.totalRent || 0).toLocaleString()}</div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Floor Configuration Overrides */}
                                    {unitData.unit.unitFloors && unitData.unit.unitFloors.length > 0 && (
                                      <div>
                                        <label className="text-sm font-medium">Floor Rate Overrides</label>
                                        <FormDescription className="text-xs mb-3">
                                          Adjust individual floor rates. Total unit rent will be recalculated automatically.
                                        </FormDescription>
                                        
                                        <div className="space-y-3">
                                          {unitData.unit.unitFloors?.map((floor, index: number) => {
                                            const floorOverride = unitData.floorOverrides?.find((f: FloorOverride) => f.floorId === floor.id)
                                            
                                            return (
                                              <div key={floor.id || index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg bg-muted/20">
                                                <div>
                                                  <label className="text-xs font-medium text-muted-foreground">Floor Type</label>
                                                  <p className="text-sm font-medium">{floor.floorType || 'Floor'}</p>
                                                </div>
                                                
                                                <div>
                                                  <label className="text-xs font-medium text-muted-foreground">Area</label>
                                                  <p className="text-sm">{floor.area || 0} sqm</p>
                                                </div>
                                                
                                                <div>
                                                  <label className="text-xs font-medium text-muted-foreground">Rate (₱/sqm)</label>
                                                  <div className="relative">
                                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">₱</span>
                                                    <Input
                                                      type="number"
                                                      step="0.01"
                                                      min="0"
                                                      value={floorOverride?.customRate || floor.rate || 0}
                                                      onChange={(e) => updateFloorRate(unitData.unit.id, floor.id, parseFloat(e.target.value) || 0, floor.area || 0)}
                                                      className="h-8 pl-6 text-xs"
                                                      placeholder="0.00"
                                                    />
                                                  </div>
                                                </div>
                                                
                                                <div>
                                                  <label className="text-xs font-medium text-muted-foreground">Floor Rent</label>
                                                  <p className="text-sm font-medium">
                                                    ₱{((floorOverride?.customRent || floor.rent || 0)).toLocaleString()}
                                                  </p>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
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

                {/* Tenant Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Tenant Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground font-medium">Name:</span>
                        <p className="text-foreground font-medium">
                          {form.watch('firstName') || 'First'} {form.watch('lastName') || 'Last'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">BP Code:</span>
                        <p className="text-foreground font-medium font-mono">{form.watch('bpCode') || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Status:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          {selectedOption && (
                            <Badge className={selectedOption.color}>
                              {selectedOption.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Company:</span>
                        <p className="text-foreground font-medium">{form.watch('company') || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground font-medium">Email:</span>
                          <p className="text-foreground">{form.watch('email') || 'Not set'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Phone:</span>
                          <p className="text-foreground">{form.watch('phone') || 'Not set'}</p>
                        </div>
                      </div>
                      
                      {createLease && (
                        <div className="mt-3">
                          <div className="font-medium text-sm mb-2">
                            ✓ Lease agreement will be created with this tenant
                          </div>
                          {selectedProperty && (
                            <div className="text-xs">
                              Property: {selectedProperty.propertyName}
                            </div>
                          )}
                          {selectedUnitsData.length > 0 && (
                            <div className="text-xs">
                              Units: {selectedUnitsData.map(u => u.unit.unitNumber).join(', ')} 
                              • Total: ₱{selectedUnitsData.reduce((sum, u) => sum + (u.customRentAmount || 0), 0).toLocaleString()}/month
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6">
                  <Link href="/tenants">
                    <Button variant="outline" disabled={isLoading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Tenant
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}