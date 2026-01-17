"use client"

import { useRouter } from "next/navigation"
import { CreateDocumentForm } from "@/components/documents/create-document-form"
import { FileUp, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <FileUp className="h-6 w-6 text-muted-foreground" />
            <span>Document Upload</span>
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">
            Add New Record to Repository
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-none h-9 text-xs uppercase tracking-wider border-border hover:bg-muted/10">
          <Link href="/documents">
            <ArrowLeft className="h-3 w-3 mr-2" />
            Back to Repository
          </Link>
        </Button>
      </div>

      {/* Create Form */}
      <div className="border border-border bg-background p-6">
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
      </div>
    </div>
  )
}