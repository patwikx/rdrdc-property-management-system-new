import { Suspense } from "react"
import { getPropertiesForSelect, getUnitsForSelect, getTenantsForSelect } from "@/lib/actions/document-actions"
import { CreateDocumentPageSkeleton } from "@/components/documents/create-document-page-skeleton"
import { CreateDocumentClient } from "./create-document-client"
import { DocumentType } from "@prisma/client"


interface CreateDocumentPageProps {
  searchParams: Promise<{
    property?: string
    unit?: string
    tenant?: string
    type?: string
  }>
}

async function CreateDocumentContent({ searchParams }: CreateDocumentPageProps) {
  const params = await searchParams
  
  const [properties, units, tenants] = await Promise.all([
    getPropertiesForSelect(),
    getUnitsForSelect(),
    getTenantsForSelect()
  ])

  return (
    <CreateDocumentClient
      properties={properties}
      units={units}
      tenants={tenants}
      defaultPropertyId={params.property}
      defaultUnitId={params.unit}
      defaultTenantId={params.tenant}
      defaultType={params.type as DocumentType | undefined}
    />
  )
}

export default function CreateDocumentPage({ searchParams }: CreateDocumentPageProps) {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Suspense fallback={<CreateDocumentPageSkeleton />}>
        <CreateDocumentContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}