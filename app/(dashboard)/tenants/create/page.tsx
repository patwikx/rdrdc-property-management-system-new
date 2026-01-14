// app/tenants/create/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createTenantAction, createTenantWithLeaseAction } from "@/lib/actions/tenant-server-actions"
import { getPropertyById, getProperties, PropertyWithDetails } from "@/lib/actions/property-actions"
import { TenantSchema, TenantFormData, UnitData, SelectedUnitData, FloorOverride } from "@/types/tenant-form"
import { TenantStatusSelector } from "@/components/tenant-form/tenant-status-selector"
import { BasicInfoSection } from "@/components/tenant-form/basic-info"
import { ContactInfoSection } from "@/components/tenant-form/contact-info"
import { BusinessInfoSection } from "@/components/tenant-form/business-info"
import { LeaseSetupSection } from "@/components/tenant-form/lease-setup-section"
import { TenantPreview } from "@/components/tenant-form/tenant-preview"

export default function CreateTenantPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [properties, setProperties] = useState<Array<{id: string, propertyName: string}>>([])
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithDetails | null>(null)
  const [selectedUnitsData, setSelectedUnitsData] = useState<SelectedUnitData[]>([])

  const form = useForm<TenantFormData>({
    resolver: zodResolver(TenantSchema),
    defaultValues: {
      bpCode: "",
      firstName: "",
      lastName: "",
      status: 'PENDING',
      // Personal Information
      homeAddress: "",
      facebookName: "",
      // Contact Info
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      // Business Info
      company: "",
      businessName: "",
      natureOfBusiness: "",
      yearsInBusiness: "",
      positionInCompany: "",
      officeAddress: "",
      facebookPage: "",
      website: "",
      authorizedSignatory: "",
      isStore: false,
      isOffice: false,
      isFranchise: false,
      // Bank Details
      bankName1: "",
      bankAddress1: "",
      bankName2: "",
      bankAddress2: "",
      // Other Business
      otherBusinessName: "",
      otherBusinessAddress: "",
      // Lease Info
      createLease: false,
      propertyId: "",
      selectedUnits: [],
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      totalRentAmount: 0,
      securityDeposit: 0,
      leaseStatus: 'PENDING',
    },
  })

  const selectedPropertyId = form.watch('propertyId')

  // Fetch properties on mount
  useEffect(() => {
    async function fetchProperties() {
      try {
        const propertiesData = await getProperties(1, 100)
        setProperties(propertiesData.properties)
      } catch (error) {
        console.error("Error fetching properties:", error)
      }
    }
    fetchProperties()
  }, [])

  // Fetch detailed property data when selected
  useEffect(() => {
    async function fetchPropertyDetails() {
      if (selectedPropertyId) {
        try {
          const propertyData = await getPropertyById(selectedPropertyId)
          if (propertyData) {
            setSelectedProperty(propertyData)
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
      const newSelectedUnits = selectedUnitsData.filter(u => u.unit.id !== unit.id)
      setSelectedUnitsData(newSelectedUnits)
      form.setValue('selectedUnits', newSelectedUnits.map(u => ({
        unitId: u.unit.id,
        customRentAmount: u.customRentAmount,
        floorOverrides: u.floorOverrides
      })))
    } else {
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
          // Personal Information
          homeAddress: data.homeAddress,
          facebookName: data.facebookName,
          // Business Information
          natureOfBusiness: data.natureOfBusiness,
          yearsInBusiness: data.yearsInBusiness,
          positionInCompany: data.positionInCompany,
          officeAddress: data.officeAddress,
          facebookPage: data.facebookPage,
          website: data.website,
          authorizedSignatory: data.authorizedSignatory,
          isStore: data.isStore,
          isOffice: data.isOffice,
          isFranchise: data.isFranchise,
          // Bank Details
          bankName1: data.bankName1,
          bankAddress1: data.bankAddress1,
          bankName2: data.bankName2,
          bankAddress2: data.bankAddress2,
          // Other Business
          otherBusinessName: data.otherBusinessName,
          otherBusinessAddress: data.otherBusinessAddress,
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
          // Personal Information
          homeAddress: data.homeAddress,
          facebookName: data.facebookName,
          // Business Information
          natureOfBusiness: data.natureOfBusiness,
          yearsInBusiness: data.yearsInBusiness,
          positionInCompany: data.positionInCompany,
          officeAddress: data.officeAddress,
          facebookPage: data.facebookPage,
          website: data.website,
          authorizedSignatory: data.authorizedSignatory,
          isStore: data.isStore,
          isOffice: data.isOffice,
          isFranchise: data.isFranchise,
          // Bank Details
          bankName1: data.bankName1,
          bankAddress1: data.bankAddress1,
          bankName2: data.bankName2,
          bankAddress2: data.bankAddress2,
          // Other Business
          otherBusinessName: data.otherBusinessName,
          otherBusinessAddress: data.otherBusinessAddress,
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
    } catch (error) {
      console.error("Error creating tenant:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
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
                <TenantStatusSelector form={form} />
                <BasicInfoSection form={form} isLoading={isLoading} />
                <ContactInfoSection form={form} isLoading={isLoading} />
                <BusinessInfoSection form={form} isLoading={isLoading} />
                <LeaseSetupSection
                  form={form}
                  isLoading={isLoading}
                  properties={properties}
                  selectedProperty={selectedProperty}
                  selectedUnitsData={selectedUnitsData}
                  onToggleUnit={toggleUnitSelection}
                  onUpdateUnitRent={updateUnitRent}
                  onUpdateFloorRate={updateFloorRate}
                />
                <TenantPreview 
                  form={form} 
                  selectedProperty={selectedProperty}
                  selectedUnitsData={selectedUnitsData}
                />

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