"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Save, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertySchema, PropertyFormData } from "@/lib/validations/property-schema"
import { getPropertyById, updateProperty, deleteProperty, PropertyWithDetails } from "@/lib/actions/property-actions"
import { PropertyType } from "@prisma/client"
import { toast } from "sonner"

// Import our new components
import { PropertyOverview } from "@/components/properties/property-overview"
import { PropertyTabs } from "@/components/properties/property-tabs"
import { PropertyUnits } from "@/components/properties/property-units"
import { PropertyTitles } from "@/components/properties/property-titles"
import { RealPropertyTax } from "@/components/properties/real-property-tax"
import { PropertyDocuments } from "@/components/properties/property-documents"
import { PropertyUtilities } from "@/components/properties/property-utilities"
import { TitleMovements } from "@/components/properties/title-movements"
import { PropertySidebar } from "@/components/properties/property-sidebar"

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

  if (!property) {
    return null
  }

  const getPropertyTypeColor = (type: PropertyType) => {
    switch (type) {
      case 'COMMERCIAL': return 'bg-blue-600'
      case 'RESIDENTIAL': return 'bg-green-600'
      case 'MIXED': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight">{property.propertyName}</h2>
              <Badge className={getPropertyTypeColor(property.propertyType)}>
                {property.propertyType}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {property.propertyCode} • {property.address}
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
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
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

      {/* Property Tabs */}
      <PropertyTabs property={property} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <PropertyOverview property={property} />
            </div>
            <div>
              <PropertySidebar 
                property={property}
                isEditing={isEditing}
                isSaving={isSaving}
                form={form}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                getPropertyTypeColor={getPropertyTypeColor}
              />
            </div>
          </div>
        )}

        {activeTab === 'units' && <PropertyUnits property={property} />}
        {activeTab === 'titles' && <PropertyTitles property={property} />}
        {activeTab === 'taxes' && <RealPropertyTax property={property} />}
        {activeTab === 'documents' && <PropertyDocuments property={property} />}
        {activeTab === 'utilities' && <PropertyUtilities property={property} />}
        {activeTab === 'movements' && <TitleMovements property={property} />}
      </div>
    </div>
  )
}