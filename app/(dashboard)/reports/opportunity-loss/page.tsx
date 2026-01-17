import { Suspense } from "react"
import { getOpportunityLossReport, OpportunityLossFilters } from "@/lib/actions/comprehensive-reports-actions"
import { OpportunityLossClient } from "./opportunity-loss-client"
import { Skeleton } from "@/components/ui/skeleton"

interface PageProps {
  searchParams: Promise<{
    minDays?: string
    maxDays?: string
    propertyId?: string
  }>
}

async function OpportunityLossContent({ searchParams }: PageProps) {
  const params = await searchParams
  
  const filters: OpportunityLossFilters = {
    propertyId: params.propertyId,
    minVacantDays: params.minDays ? Number(params.minDays) : undefined,
    maxVacantDays: params.maxDays ? Number(params.maxDays) : undefined,
  }

  const result = await getOpportunityLossReport(filters)

  if (!result.success || !result.data) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono uppercase">
        Error loading report data: {result.error}
      </div>
    )
  }

  return (
    <OpportunityLossClient 
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
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 border border-border bg-background p-4">
             <Skeleton className="h-8 w-full mb-4 rounded-none" />
             {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full mb-2 rounded-none" />
             ))}
          </div>
          <div className="col-span-2 border border-border bg-background p-4">
             <Skeleton className="h-8 w-full mb-4 rounded-none" />
             {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2 rounded-none" />
             ))}
          </div>
       </div>
    </div>
  )
}

export default function OpportunityLossPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      <Suspense fallback={<ReportLoading />}>
        <OpportunityLossContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}