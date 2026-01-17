"use client"

import { useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import { Edit, Trash2, Save, X, Building, Home, Ruler, DollarSign, Activity } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { UnitSchema, UnitFormData } from "@/lib/validations/unit-schema"
import { getUnitById, updateUnitWithFloorsAction, deleteUnitAction } from "@/lib/actions/unit-server-actions"
import { UnitTabs } from "@/components/units/unit-tabs"
import { UnitOverview } from "@/components/units/unit-overview"
import { UnitHistory } from "@/components/units/unit-history"
import { UnitTaxes } from "@/components/units/unit-taxes"
import { UnitUtilities } from "@/components/units/unit-utilities"
import { UnitMaintenance } from "@/components/units/unit-maintenance"
import { UnitDocuments } from "@/components/units/unit-documents"
import { UnitEditForm } from "@/components/units/unit-edit-form"
import { toast } from "sonner"
import { format } from "date-fns"

interface UnitPageProps {
  params: Promise<{
    id: string
    unitId: string
  }>
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'OCCUPIED': return { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500/10' }
    case 'VACANT': return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500/10' }
    case 'MAINTENANCE': return { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-500/10' }
    case 'RESERVED': return { border: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' }
    default: return { border: 'border-muted', text: 'text-muted-foreground', bg: 'bg-muted/10' }
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
  const router = useRouter()
  const [unit, setUnit] = useState<UnitWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
        const updatedUnit = await getUnitById(unitId)
        if (updatedUnit) {
          setUnit(updatedUnit)
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!unit) return
    
    setIsDeleting(true)
    
    try {
      const result = await deleteUnitAction(unit.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Unit deleted successfully")
        router.push(`/properties/${propertyId}`)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted/20 w-1/3" />
          <div className="h-4 bg-muted/20 w-1/2" />
          <div className="grid gap-4 md:grid-cols-4 h-24 bg-muted/10 border border-border" />
        </div>
      </div>
    )
  }

  if (!unit) return null

  const statusStyle = getStatusStyle(unit.status)
  
  // Calculate current lease
  const currentLease = unit.leaseUnits.find(lu => lu.lease.status === 'ACTIVE')?.lease

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-mono uppercase flex items-center gap-3">
              Unit {unit.unitNumber}
              <Badge variant="outline" className={`rounded-none text-xs uppercase tracking-widest border ${statusStyle.border} ${statusStyle.text} bg-transparent`}>
                {unit.status}
              </Badge>
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono">
              <Building className="h-3 w-3" />
              <span className="uppercase tracking-wide">{unit.property.propertyName}</span>
              <span className="text-border">|</span>
              <span>{unit.property.address}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Unit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      disabled={isDeleting}
                      className="rounded-none h-9 text-xs font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-700"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-none border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-mono uppercase tracking-wide">Delete Unit {unit.unitNumber}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        This action cannot be undone. This will permanently delete the unit and all associated data including floors, taxes, utilities, and maintenance records.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-none border-border font-mono uppercase text-xs tracking-wider">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="rounded-none bg-rose-600 hover:bg-rose-700 font-mono uppercase text-xs tracking-wider"
                      >
                        Delete Unit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border"
                >
                  <X className="h-3 w-3 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={isSaving}
                  className="rounded-none h-9 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSaving ? "Saving..." : <><Save className="h-3 w-3 mr-2" /> Save Changes</>}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Current Rate</span>
              <DollarSign className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter">
                ₱{unit.totalRent.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">/ month</span>
            </div>
          </div>
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Area</span>
              <Ruler className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div>
              <span className="text-2xl font-mono font-medium tracking-tighter">
                {unit.totalArea.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground ml-2">sqm</span>
            </div>
          </div>
          <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Status</span>
              <Activity className={`h-4 w-4 ${statusStyle.text}`} />
            </div>
            <div>
              <span className={`text-xl font-mono font-medium tracking-tighter ${statusStyle.text}`}>
                {unit.status}
              </span>
            </div>
          </div>
          <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Tenant</span>
              <Home className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div>
              <span className="text-lg font-mono font-medium tracking-tight truncate block" title={currentLease?.tenant.company || "Vacant"}>
                {currentLease 
                  ? (currentLease.tenant.company || `${currentLease.tenant.firstName} ${currentLease.tenant.lastName}`)
                  : "VACANT"}
              </span>
              {currentLease && (
                <span className="text-[10px] text-muted-foreground">
                  Ends {format(new Date(currentLease.endDate), 'MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="mt-8">
        {!isEditing && <UnitTabs unit={unit} activeTab={activeTab} setActiveTab={setActiveTab} />}

        <div className="mt-6 border border-border bg-background p-6 min-h-[400px]">
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
              {activeTab === 'history' && <UnitHistory unit={unit} />}
              {activeTab === 'taxes' && <UnitTaxes unit={unit} />}
              {activeTab === 'utilities' && <UnitUtilities unit={unit} />}
              {activeTab === 'maintenance' && <UnitMaintenance unit={unit} />}
              {activeTab === 'documents' && <UnitDocuments unit={unit} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}