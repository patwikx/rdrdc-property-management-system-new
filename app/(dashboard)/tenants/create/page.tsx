/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Save, User, Info, CheckCircle, Activity, LayoutGrid, ArrowLeft, ArrowRight, Check } from "lucide-react"
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
import { motion, AnimatePresence } from "framer-motion"

const workflowSteps = [
  { step: 1, title: "Basic Profile", fields: ['status', 'bpCode', 'firstName', 'lastName', 'homeAddress', 'facebookName'] },
  { step: 2, title: "Contact Details", fields: ['email', 'phone', 'emergencyContactName', 'emergencyContactPhone'] },
  { step: 3, title: "Business Info", fields: ['company', 'businessName', 'natureOfBusiness', 'yearsInBusiness', 'positionInCompany', 'officeAddress', 'facebookPage', 'website', 'isStore', 'isOffice', 'isFranchise', 'bankName1', 'bankAddress1', 'bankName2', 'bankAddress2', 'otherBusinessName', 'otherBusinessAddress'] },
  { step: 4, title: "Lease Setup", fields: ['createLease', 'propertyId', 'selectedUnits', 'startDate', 'endDate', 'totalRentAmount', 'securityDeposit', 'leaseStatus'] },
]

export default function CreateTenantPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
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
      homeAddress: "",
      facebookName: "",
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
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
      bankName1: "",
      bankAddress1: "",
      bankName2: "",
      bankAddress2: "",
      otherBusinessName: "",
      otherBusinessAddress: "",
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

  const handleNext = async () => {
    const fields = workflowSteps[currentStep - 1].fields as (keyof TenantFormData)[]
    const isValid = await form.trigger(fields)
    
    if (isValid && currentStep < workflowSteps.length) {
      setCurrentStep(curr => curr + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(curr => curr - 1)
    }
  }

  async function onSubmit(data: TenantFormData) {
    // Double-check we're on the final step before submitting
    if (currentStep !== workflowSteps.length) {
      console.warn('Form submission blocked - not on final step')
      return
    }
    
    setIsLoading(true)
    
    try {
      if (data.createLease && data.propertyId && data.selectedUnits && data.selectedUnits.length > 0) {
        const result = await createTenantWithLeaseAction({
          // ... (map all fields as before)
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
          homeAddress: data.homeAddress,
          facebookName: data.facebookName,
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
          bankName1: data.bankName1,
          bankAddress1: data.bankAddress1,
          bankName2: data.bankName2,
          bankAddress2: data.bankAddress2,
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
          // ... (map all fields as before)
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
          homeAddress: data.homeAddress,
          facebookName: data.facebookName,
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
          bankName1: data.bankName1,
          bankAddress1: data.bankAddress1,
          bankName2: data.bankName2,
          bankAddress2: data.bankAddress2,
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Create New Tenant</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Step {currentStep} of {workflowSteps.length}: {workflowSteps[currentStep-1].title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tenants">
            <Button variant="outline" disabled={isLoading} className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form id="tenant-form" onSubmit={(e) => {
              e.preventDefault()
              if (currentStep === workflowSteps.length) {
                form.handleSubmit(onSubmit)(e)
              } else {
                handleNext()
              }
            }} className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {currentStep === 1 && (
                    <>
                      <TenantStatusSelector form={form} />
                      <BasicInfoSection form={form} isLoading={isLoading} />
                    </>
                  )}
                  {currentStep === 2 && (
                    <ContactInfoSection form={form} isLoading={isLoading} />
                  )}
                  {currentStep === 3 && (
                    <BusinessInfoSection form={form} isLoading={isLoading} />
                  )}
                  {currentStep === 4 && (
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
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1 || isLoading}
                  className="rounded-none h-10 px-6 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted"
                >
                  <ArrowLeft className="h-3 w-3 mr-2" />
                  Back
                </Button>

                {currentStep === workflowSteps.length ? (
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="rounded-none h-10 px-8 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-2" />
                        Create Tenant
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNext()
                    }}
                    className="rounded-none h-10 px-6 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Next
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

        {/* Sidebar Guide */}
        <div className="space-y-6">
          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Progress</h3>
            </div>
            <div className="space-y-0 relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
              {workflowSteps.map((step) => (
                <div key={step.step} className="flex items-center gap-4 relative py-2">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-none border text-xs font-mono z-10 transition-colors ${
                    currentStep >= step.step
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-muted-foreground border-border'
                  }`}>
                    {currentStep > step.step ? <Check className="h-3 w-3" /> : step.step}
                  </div>
                  <span className={`text-xs font-mono uppercase tracking-wide transition-colors ${
                    currentStep === step.step ? 'text-foreground font-bold' : 
                    currentStep > step.step ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-background p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Helpful Tips</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>Fill out all required fields marked with * to proceed.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                <span>You can review the lease details in the final step.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}