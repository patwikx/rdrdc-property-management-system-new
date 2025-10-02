"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { Edit, Trash2, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { UnitSchema, UnitFormData } from "@/lib/validations/unit-schema"
import { getUnitById, updateUnitWithFloorsAction } from "@/lib/actions/unit-server-actions"
import { UnitTabs } from "@/components/units/unit-tabs"
import { UnitOverview } from "@/components/units/unit-overview"
import { UnitTenant } from "@/components/units/unit-tenant"
import { UnitHistory } from "@/components/units/unit-history"
import { UnitTaxes } from "@/components/units/unit-taxes"
import { UnitUtilities } from "@/components/units/unit-utilities"
import { UnitMaintenance } from "@/components/units/unit-maintenance"
import { UnitDocuments } from "@/components/units/unit-documents"
import { UnitEditForm } from "@/components/units/unit-edit-form"
import { toast } from "sonner"

interface UnitPageProps {
  params: Promise<{
    id: string
    unitId: string
  }>
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OCCUPIED': return 'bg-green-600'
    case 'VACANT': return 'bg-gray-600'
    case 'MAINTENANCE': return 'bg-yellow-600'
    case 'RESERVED': return 'bg-blue-600'
    default: return 'bg-gray-600'
  }
}

interface FloorConfig {
  id?: string
  floorType: string
  area: number
  ratePerSqm: number
  floorRent: number
}

export default function UnitPage({ params }: UnitPageProps) {
  const [unit, setUnit] = useState<UnitWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [propertyId, setPropertyId] = useState<string>("")
  const [unitId, setUnitId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")
  const [floors, setFloors] = useState<FloorConfig[]>([])

  const form = useForm<UnitFormData>({
    resolver: zodResolver(UnitSchema),
    defaultValues: {
      propertyId: "",
      unitNumber: "",
      totalArea: 0,
      totalRent: 0,
      status: "VACANT" as const,
      propertyTitleId: "",
    },
  })

  useEffect(() => {
    async function fetchUnit() {
      try {
        const resolvedParams = await params
        const unitData = await getUnitById(resolvedParams.unitId)
        if (!unitData) {
          notFound()
        }
        setUnit(unitData)
        setPropertyId(resolvedParams.id)
        setUnitId(resolvedParams.unitId)
        
        // Set form values
        form.reset({
          propertyId: unitData.property.id,
          unitNumber: unitData.unitNumber,
          totalArea: unitData.totalArea,
          totalRent: unitData.totalRent,
          status: unitData.status,
          propertyTitleId: unitData.propertyTitle?.id || "",
        })
      } catch (error) {
        console.error("Error fetching unit:", error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnit()
  }, [params, form])

  async function onSubmit(data: UnitFormData) {
    if (!unit) return
    
    setIsSaving(true)
    
    try {
      const result = await updateUnitWithFloorsAction(unit.id, data, floors)
      
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
        toast.success("Unit updated successfully")
        setIsEditing(false)
        // Reload unit data
        const updatedUnit = await getUnitById(unitId)
        if (updatedUnit) {
          setUnit(updatedUnit)
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!unit) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight">Unit {unit.unitNumber}</h2>
              <Badge className={getStatusColor(unit.status)}>
                {unit.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {unit.property.propertyName} • {unit.property.address}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Unit Tabs */}
      <UnitTabs unit={unit} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Edit Form or Tab Content */}
      <div className="mt-6">
        {isEditing ? (
          <UnitEditForm 
            unit={unit} 
            form={form} 
            isSaving={isSaving} 
            onFloorsChange={setFloors}
          />
        ) : (
          <>
            {activeTab === 'overview' && <UnitOverview unit={unit} />}
            {activeTab === 'tenant' && <UnitTenant unit={unit} />}
            {activeTab === 'history' && <UnitHistory unit={unit} />}
            {activeTab === 'taxes' && <UnitTaxes unit={unit} />}
            {activeTab === 'utilities' && <UnitUtilities unit={unit} />}
            {activeTab === 'maintenance' && <UnitMaintenance unit={unit} />}
            {activeTab === 'documents' && <UnitDocuments unit={unit} />}
          </>
        )}
      </div>
    </div>
  )
}