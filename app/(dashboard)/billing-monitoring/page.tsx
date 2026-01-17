import { Suspense } from "react"
import { Metadata } from "next"
import { UtilityType } from "@prisma/client"

import { Skeleton } from "@/components/ui/skeleton"
import { getUtilityBills, getPropertiesForFilter } from "@/lib/actions/utility-billing-actions"
import { UtilityBillingSummary } from "@/components/utilities/utility-billing-summary"
import { UtilityBillingFilters } from "@/components/utilities/utility-billing-filters"
import { UtilityBillingTable } from "@/components/utilities/utility-billing-table"

/**
 * Utilities Billing Monitoring Page
 * Requirements: 1.1, 5.1, 5.2, 5.3, 5.4
 */

export const metadata: Metadata = {
  title: "Billing Monitoring | RDRDC",
  description: "Monitor utility bills and payment deadlines across all spaces",
}

interface PageProps {
  searchParams: Promise<{
    property?: string
    utilityType?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }>
}

function UtilityBillingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border-r border-border h-24">
            <Skeleton className="h-4 w-1/3 mb-2 rounded-none" />
            <Skeleton className="h-8 w-1/2 rounded-none" />
          </div>
        ))}
      </div>

      {/* Filter Skeleton */}
      <div className="flex gap-4 border border-border bg-muted/5 p-1">
        <Skeleton className="h-9 w-[200px] rounded-none" />
        <Skeleton className="h-9 w-[160px] rounded-none" />
        <Skeleton className="h-9 w-[160px] rounded-none" />
      </div>

      {/* Table Skeleton */}
      <div className="border border-border">
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}

async function UtilityBillingContent({
  searchParams,
}: {
  searchParams: {
    property?: string
    utilityType?: string
    status?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }
}) {
  const [{ bills, summary }, properties] = await Promise.all([
    getUtilityBills({
      propertyId: searchParams.property || undefined,
      utilityType: searchParams.utilityType as UtilityType | undefined,
      status: (searchParams.status as 'all' | 'paid' | 'unpaid' | 'overdue') || 'all',
      sortBy: (searchParams.sortBy as 'dueDate' | 'amount' | 'space') || 'dueDate',
      sortOrder: (searchParams.sortOrder as 'asc' | 'desc') || 'asc',
      page: searchParams.page ? parseInt(searchParams.page) : 1,
    }),
    getPropertiesForFilter(),
  ])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <UtilityBillingSummary summary={summary} />

      {/* Filters and Table */}
      <div className="space-y-0">
        <UtilityBillingFilters properties={properties} />
        <UtilityBillingTable bills={bills} />
      </div>
    </div>
  )
}

export default async function UtilitiesBillingPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Billing Monitoring</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Track utility payments and deadlines across properties
          </p>
        </div>
      </div>

      <Suspense fallback={<UtilityBillingSkeleton />}>
        <UtilityBillingContent searchParams={params} />
      </Suspense>
    </div>
  )
}
