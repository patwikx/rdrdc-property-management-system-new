"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateDocumentForm } from "@/components/documents/create-document-form"
import { FileText } from "lucide-react"

import { DocumentType } from "@prisma/client"

interface Property {
  id: string
  propertyName: string
  propertyCode: string
}

interface Unit {
  id: string
  unitNumber: string
  property: {
    propertyName: string
  }
}

interface Tenant {
  id: string
  firstName: string | null
  lastName: string | null
  bpCode: string
  company: string
}

interface CreateDocumentClientProps {
  properties: Property[]
  units: Unit[]
  tenants: Tenant[]
  defaultPropertyId?: string
  defaultUnitId?: string
  defaultTenantId?: string
  defaultType?: DocumentType
}

export function CreateDocumentClient({
  properties,
  units,
  tenants,
  defaultPropertyId,
  defaultUnitId,
  defaultTenantId,
  defaultType
}: CreateDocumentClientProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/documents")
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
              <FileText className="h-8 w-8" />
              <span>Upload Document</span>
            </h1>
            <p className="text-muted-foreground">
              Upload and categorize a new document for your property management system
            </p>
          </div>
        </div>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
          <CardDescription>
            Fill in the details below to upload and categorize your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDocumentForm
            properties={properties}
            units={units}
            tenants={tenants}
            defaultPropertyId={defaultPropertyId}
            defaultUnitId={defaultUnitId}
            defaultTenantId={defaultTenantId}
            defaultType={defaultType}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </>
  )
}