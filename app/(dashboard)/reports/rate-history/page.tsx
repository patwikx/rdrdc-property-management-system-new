import { Suspense } from "react"
import { getRateChangeHistoryReport, RateChangeHistoryFilters } from "@/lib/actions/comprehensive-reports-actions"
import { RateHistoryClient } from "./rate-history-client"
import { Skeleton } from "@/components/ui/skeleton"

interface PageProps {
  searchParams: Promise<{
    tenantId?: string
    leaseId?: string
    unitId?: string
    autoApplied?: string
  }>
}

async function RateHistoryContent({ searchParams }: PageProps) {
  const params = await searchParams
  
  const filters: RateChangeHistoryFilters = {
    tenantId: params.tenantId,
    leaseId: params.leaseId,
    unitId: params.unitId,
    isAutoApplied: params.autoApplied === 'true' ? true : params.autoApplied === 'false' ? false : undefined,
  }

  const result = await getRateChangeHistoryReport(filters)

  if (!result.success || !result.data) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono uppercase">
        Error loading report data: {result.error}
      </div>
    )
  }

  return (
    <RateHistoryClient 
      initialData={result.data} 
      filters={filters} 
    />
  )
}

function ReportLoading() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center pb-6 border-b border-border">
          <div className="space-y-2">
             <Skeleton className="h-8 w-48 rounded-none" />
             <Skeleton className="h-4 w-64 rounded-none" />
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
             <Skeleton key={i} className="h-24 w-full rounded-none" />
          ))}
       </div>
       <div className="border border-border bg-background p-4">
          <Skeleton className="h-8 w-full mb-4 rounded-none" />
          {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-12 w-full mb-2 rounded-none" />
          ))}
       </div>
    </div>
  )
}

export default function RateHistoryPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      <Suspense fallback={<ReportLoading />}>
        <RateHistoryContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}