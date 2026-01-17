"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Save, Activity, Info, CheckCircle, Check, TrendingUp } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { createLease, getAvailableUnits, AvailableUnit } from "@/lib/actions/lease-actions"
import { getAllTenants } from "@/lib/actions/tenant-actions"
import { LeaseDetailsStep } from "@/components/lease-form/lease-details-step"
import { SpaceSelectionStep } from "@/components/lease-form/space-selection-step"
import { RateIncreaseStep } from "@/components/lease-form/rate-increase-step"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { z } from "zod"

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
  standardIncreasePercentage: z.number().min(0, "Percentage must be positive").max(100, "Percentage cannot exceed 100"),
  increaseIntervalYears: z.number().min(1, "Interval must be at least 1 year").max(10, "Interval cannot exceed 10 years"),
  autoIncreaseEnabled: z.boolean()
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
})

type LeaseFormData = z.infer<typeof LeaseFormSchema>

const workflowSteps = [
  { step: 1, title: "Lease Details", fields: ['tenantId', 'startDate', 'endDate', 'securityDeposit'] },
  { step: 2, title: "Space Selection", fields: [] }, // No form fields, just selection
  { step: 3, title: "Rate Increases", fields: ['standardIncreasePercentage', 'increaseIntervalYears', 'autoIncreaseEnabled'] },
]

export default function CreateLeasePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
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
      const matchesSearch = searchQuery === "" || 
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.property.propertyName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesProperty = selectedProperty === "all" || 
        unit.property.id === selectedProperty

      const matchesMinArea = minArea === "" || 
        unit.totalArea >= parseFloat(minArea)
      const matchesMaxArea = maxArea === "" || 
        unit.totalArea <= parseFloat(maxArea)

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

  const calculateProjectedRent = () => {
    const currentRent = calculateTotalRent()
    const increasePercentage = form.watch('standardIncreasePercentage') || 0
    const intervalYears = form.watch('increaseIntervalYears') || 3
    const autoIncreaseEnabled = form.watch('autoIncreaseEnabled')
    
    if (!autoIncreaseEnabled || increasePercentage === 0) {
      return null
    }
    
    const projectedRent = currentRent * (1 + increasePercentage / 100)
    return {
      rent: projectedRent,
      years: intervalYears
    }
  }

  const handleNext = async () => {
    const fields = workflowSteps[currentStep - 1].fields as (keyof LeaseFormData)[]
    
    // For step 2 (space selection), validate that at least one unit is selected
    if (currentStep === 2) {
      if (selectedUnitsData.length === 0) {
        toast.error("Please select at least one space")
        return
      }
      setCurrentStep(curr => curr + 1)
      return
    }
    
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

  async function onSubmit(data: LeaseFormData) {
    if (currentStep !== workflowSteps.length) {
      console.warn('Form submission blocked - not on final step')
      return
    }

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
          <div className="h-8 bg-muted/20 w-1/3" />
          <div className="h-4 bg-muted/20 w-1/2" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted/10 border border-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Create New Lease</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Step {currentStep} of {workflowSteps.length}: {workflowSteps[currentStep-1].title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tenants/leases">
            <Button variant="outline" disabled={isSaving} className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form id="lease-form" onSubmit={(e) => {
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
                    <LeaseDetailsStep
                      form={form}
                      tenants={tenants}
                      openTenantSelect={openTenantSelect}
                      setOpenTenantSelect={setOpenTenantSelect}
                    />
                  )}
                  {currentStep === 2 && (
                    <SpaceSelectionStep
                      units={units}
                      filteredUnits={filteredUnits}
                      selectedUnitsData={selectedUnitsData}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedProperty={selectedProperty}
                      setSelectedProperty={setSelectedProperty}
                      minArea={minArea}
                      setMinArea={setMinArea}
                      properties={properties}
                      openPropertySelect={openPropertySelect}
                      setOpenPropertySelect={setOpenPropertySelect}
                      hasActiveFilters={hasActiveFilters}
                      clearFilters={clearFilters}
                      toggleUnitSelection={toggleUnitSelection}
                      updateUnitRent={updateUnitRent}
                      updateFloorRate={updateFloorRate}
                      handleRemoveUnit={handleRemoveUnit}
                    />
                  )}
                  {currentStep === 3 && (
                    <RateIncreaseStep form={form} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1 || isSaving}
                  className="rounded-none h-10 px-6 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted"
                >
                  <ArrowLeft className="h-3 w-3 mr-2" />
                  Back
                </Button>

                {currentStep === workflowSteps.length ? (
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="rounded-none h-10 px-8 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-2" />
                        Create Lease
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
              <h3 className="text-xs font-bold uppercase tracking-widest">Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground uppercase">Spaces Selected</span>
                <span className="font-bold">{selectedUnitsData.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground uppercase">Monthly Rent</span>
                <span className="font-bold">₱{calculateTotalRent().toLocaleString()}</span>
              </div>
              {calculateProjectedRent() && (
                <>
                  <div className="border-t border-dashed border-border pt-3 mt-3">
                    <div className="flex items-center gap-1 mb-2">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Rate Projection</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-muted-foreground uppercase">After {calculateProjectedRent()?.years} Years</span>
                      <span className="font-bold text-blue-600">₱{calculateProjectedRent()?.rent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono mt-1">
                      <span className="text-muted-foreground">Increase</span>
                      <span className="text-emerald-600 font-bold">+₱{((calculateProjectedRent()?.rent || 0) - calculateTotalRent()).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </>
              )}
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
                <span>You can customize rent for each selected space.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
