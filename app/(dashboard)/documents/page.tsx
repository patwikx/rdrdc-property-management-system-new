import { Suspense } from "react"
import { getDocuments, getDocumentStats } from "@/lib/actions/document-actions"
import { DocumentsClient } from "./documents-client"
import { DocumentsPageSkeleton } from "@/components/documents/documents-page-skeleton"
import { DocumentsStats } from "@/components/documents/documents-stats"
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

  const [
    { documents, totalCount, totalPages },
    stats
  ] = await Promise.all([
    getDocuments(
      page,
      10,
      search,
      documentType,
      propertyId,
      unitId,
      tenantId
    ),
    getDocumentStats()
  ])

  return (
    <div className="space-y-6">
      <DocumentsStats stats={stats} />
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
    </div>
  )
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 max-w-[1920px] mx-auto">
      <Suspense fallback={<DocumentsPageSkeleton />}>
        <DocumentsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}