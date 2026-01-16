"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Save, Trash2, Building2, MapPin, Maximize, ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertySchema, PropertyFormData } from "@/lib/validations/property-schema"
import { getPropertyById, updateProperty, deleteProperty, PropertyWithDetails } from "@/lib/actions/property-actions"
import { PropertyType } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

// Import our components
import { PropertyOverview } from "@/components/properties/property-overview"
import { PropertyTabs } from "@/components/properties/property-tabs"
import { PropertyUnits } from "@/components/properties/property-units"
import { PropertyTitles } from "@/components/properties/property-titles"
import { RealPropertyTax } from "@/components/properties/real-property-tax"
import { PropertyDocuments } from "@/components/properties/property-documents"
import { PropertyUtilities } from "@/components/properties/property-utilities"
import { TitleMovements } from "@/components/properties/title-movements"

interface PropertyPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const router = useRouter()
  const [property, setProperty] = useState<PropertyWithDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [propertyId, setPropertyId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(PropertySchema),
    defaultValues: {
      propertyCode: "",
      propertyName: "",
      leasableArea: 0,
      address: "",
      propertyType: PropertyType.COMMERCIAL,
      totalUnits: 0,
    },
  })

  useEffect(() => {
    async function initializeParams() {
      const resolvedParams = await params
      setPropertyId(resolvedParams.id)
    }
    
    initializeParams()
  }, [params])

  useEffect(() => {
    if (!propertyId) return

    async function loadProperty() {
      try {
        const propertyData = await getPropertyById(propertyId)
        if (!propertyData) {
          toast.error("Property not found")
          router.push("/properties")
          return
        }
        
        setProperty(propertyData)
        form.reset({
          propertyCode: propertyData.propertyCode,
          propertyName: propertyData.propertyName,
          leasableArea: propertyData.leasableArea,
          address: propertyData.address,
          propertyType: propertyData.propertyType,
          totalUnits: propertyData.totalUnits || 0,
        })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to load property")
        router.push("/properties")
      } finally {
        setIsLoading(false)
      }
    }

    loadProperty()
  }, [propertyId, router, form])

  async function onSubmit(data: PropertyFormData) {
    if (!property) return
    
    setSaving(true)
    
    try {
      const result = await updateProperty({ ...data, id: property.id })
      
      if (result.error) {
        toast.error(result.error)
        if (result.details) {
          Object.entries(result.details).forEach(([field, error]) => {
            if (error && typeof error === 'object' && '_errors' in error) {
              const messages = (error as { _errors: string[] })._errors
              if (messages && messages.length > 0) {
                form.setError(field as keyof PropertyFormData, {
                  message: messages[0],
                })
              }
            }
          })
        }
      } else {
        toast.success("Property updated successfully")
        setIsEditing(false)
        // Reload property data
        const updatedProperty = await getPropertyById(propertyId)
        if (updatedProperty) {
          setProperty(updatedProperty)
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!property) return
    
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const result = await deleteProperty(property.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Property deleted successfully")
        router.push("/properties")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete property")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-8 pt-6 space-y-6">
        <div className="h-32 bg-muted/10 animate-pulse border border-border" />
        <div className="h-[500px] bg-muted/5 animate-pulse border border-border" />
      </div>
    )
  }

  if (!property) {
    return null
  }

  const getPropertyTypeColor = (type: PropertyType) => {
    switch (type) {
      case 'COMMERCIAL': return 'text-blue-600 bg-blue-500/10 border-blue-500/20'
      case 'RESIDENTIAL': return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
      case 'MIXED': return 'text-purple-600 bg-purple-500/10 border-purple-500/20'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  const occupiedUnits = property.units.filter(u => u.status === 'OCCUPIED').length
  const vacantUnits = property.units.filter(u => u.status === 'VACANT').length
  const maintenanceUnits = property.units.filter(u => u.status === 'MAINTENANCE').length
  const reservedUnits = property.units.filter(u => u.status === 'RESERVED').length
  const occupancyRate = property._count.units > 0 ? (occupiedUnits / property._count.units) * 100 : 0
  const totalMonthlyRevenue = property.units.reduce((sum, unit) => sum + (unit.totalRent || 0), 0)

  return (
    <div className="flex-1 p-0 bg-background min-h-screen font-mono">
      {/* ... (Header remains the same) ... */}
      <div className="border-b border-border p-6 bg-muted/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-none border-border">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight uppercase">{property.propertyName}</h2>
              <Badge variant="outline" className={`rounded-none border px-2 py-0.5 text-[10px] uppercase tracking-widest ${getPropertyTypeColor(property.propertyType)}`}>
                {property.propertyType}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="font-mono bg-muted/20 px-1.5 border border-border/50">{property.propertyCode}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {property.address}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" className="rounded-none h-9 text-xs uppercase tracking-wide border-border hover:bg-muted" onClick={() => setIsEditing(true)}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Edit_Data
              </Button>
              <Button 
                variant="destructive" 
                className="rounded-none h-9 text-xs uppercase tracking-wide bg-rose-600 hover:bg-rose-700"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "DELETING..." : <><Trash2 className="h-3.5 w-3.5 mr-2" /> DELETE</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="rounded-none h-9 text-xs uppercase tracking-wide" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="rounded-none h-9 text-xs uppercase tracking-wide bg-primary" onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving ? "SAVING..." : <><Save className="h-3.5 w-3.5 mr-2" /> SAVE_CHANGES</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-border bg-background">
        <div className="p-4 border-r border-border flex items-center justify-between group hover:bg-muted/5 transition-colors">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Leasable Area</p>
            <p className="text-xl font-bold tracking-tight">{property.leasableArea.toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">sqm</span></p>
          </div>
          <Maximize className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
        </div>
        
        {/* Space Allocation Block */}
        <div className="p-4 border-r border-border flex flex-col justify-center gap-1 group hover:bg-muted/5 transition-colors min-w-[200px]">
          <div className="flex justify-between items-center mb-1">
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Space Allocation</p>
             <span className="text-[10px] font-bold text-foreground">{property._count.units} Units</span>
          </div>
          <div className="flex h-1.5 w-full bg-muted/20 rounded-none overflow-hidden">
             <div className="bg-emerald-500 h-full" style={{ width: `${(occupiedUnits / (property._count.units || 1)) * 100}%` }} />
             <div className="bg-amber-500 h-full" style={{ width: `${(vacantUnits / (property._count.units || 1)) * 100}%` }} />
             <div className="bg-rose-500 h-full" style={{ width: `${(maintenanceUnits / (property._count.units || 1)) * 100}%` }} />
             <div className="bg-blue-500 h-full" style={{ width: `${(reservedUnits / (property._count.units || 1)) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-1">
             <span>{occupiedUnits} OCC</span>
             <span>{vacantUnits} VAC</span>
             <span>{maintenanceUnits + reservedUnits} OTH</span>
          </div>
        </div>

        <div className="p-4 border-r border-border flex items-center justify-between group hover:bg-muted/5 transition-colors">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Occupancy</p>
            <p className="text-xl font-bold tracking-tight text-emerald-600">{occupancyRate.toFixed(1)}%</p>
          </div>
          <div className="h-10 w-10 relative">
             <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path className="text-muted/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                <path className="text-emerald-500" strokeDasharray={`${occupancyRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
             </svg>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between group hover:bg-muted/5 transition-colors">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Monthly Revenue</p>
            <p className="text-xl font-bold tracking-tight text-blue-600">₱{(totalMonthlyRevenue / 1000).toFixed(1)}k</p>
          </div>
          <Building2 className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
        </div>
      </div>

      <div className="p-6">
        <PropertyTabs property={property} activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'overview' && (
            <PropertyOverview 
              property={property}
              isEditing={isEditing}
              isSaving={isSaving}
              form={form}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'units' && <PropertyUnits property={property} />}
          {activeTab === 'titles' && <PropertyTitles property={property} />}
          {activeTab === 'taxes' && <RealPropertyTax property={property} />}
          {activeTab === 'documents' && <PropertyDocuments property={property} />}
          {activeTab === 'utilities' && <PropertyUtilities property={property} />}
          {activeTab === 'movements' && <TitleMovements property={property} />}
        </div>
      </div>
    </div>
  )
}