import { Suspense } from "react"
import { getDocuments } from "@/lib/actions/document-actions"
import { DocumentsClient } from "./documents-client"
import { DocumentsPageSkeleton } from "@/components/documents/documents-page-skeleton"
import { DocumentType } from "@prisma/client"


interface DocumentsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    type?: string
    property?: string
    unit?: string
    tenant?: string
  }>
}

async function DocumentsContent({ searchParams }: DocumentsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ""
  const documentType = (params.type as DocumentType) || ""
  const propertyId = params.property || ""
  const unitId = params.unit || ""
  const tenantId = params.tenant || ""

  const { documents, totalCount, totalPages } = await getDocuments(
    page,
    10,
    search,
    documentType,
    propertyId,
    unitId,
    tenantId
  )

  return (
    <DocumentsClient
      initialDocuments={documents}
      totalCount={totalCount}
      currentPage={page}
      totalPages={totalPages}
      initialSearch={search}
      initialType={documentType}
      initialPropertyId={propertyId}
      initialUnitId={unitId}
      initialTenantId={tenantId}
    />
  )
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Suspense fallback={<DocumentsPageSkeleton />}>
        <DocumentsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}