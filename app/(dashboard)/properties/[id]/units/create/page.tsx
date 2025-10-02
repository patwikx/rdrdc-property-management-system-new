"use client"

import { useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPropertyById, PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateUnitForm } from "@/components/properties/create-unit-form"

interface CreateUnitPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CreateUnitPage({ params }: CreateUnitPageProps) {
  const router = useRouter()
  const [property, setProperty] = useState<PropertyWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [propertyId, setPropertyId] = useState<string>("")

  useEffect(() => {
    async function fetchProperty() {
      try {
        const resolvedParams = await params
        const propertyData = await getPropertyById(resolvedParams.id)
        if (!propertyData) {
          notFound()
        }
        setProperty(propertyData)
        setPropertyId(resolvedParams.id)
      } catch (error) {
        console.error("Error fetching property:", error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [params])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!property) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Create New Unit</h1>
          <p className="text-muted-foreground">
            Add a new unit to {property.propertyName}
          </p>
        </div>
      </div>

      {/* Property Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Information</CardTitle>
          <CardDescription>
            Creating unit for this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Property Name:</span>
              <p className="font-semibold">{property.propertyName}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Location:</span>
              <p>{property.address}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Type:</span>
              <p className="capitalize">{property.propertyType.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Unit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Details</CardTitle>
          <CardDescription>
            Configure the unit information and floor details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUnitForm
            propertyId={property.id}
            propertyTitles={property.titles}
            onSuccess={() => {
              // Redirect back to property page
              router.push(`/properties/${propertyId}`)
            }}
            onCancel={() => {
              // Redirect back to property page
              router.push(`/properties/${propertyId}`)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}