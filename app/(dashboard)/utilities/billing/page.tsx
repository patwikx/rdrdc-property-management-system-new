import { Suspense } from "react"
import { Metadata } from "next"
import { UtilityType } from "@prisma/client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  title: "RD Realty Group - Utilities Billing",
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="h-3 w-[80px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Utility Bills</CardTitle>
              <CardDescription>
                Track payment deadlines and manage utility bills across all spaces
              </CardDescription>
            </div>
          </div>
          <UtilityBillingFilters properties={properties} />
        </CardHeader>
        <CardContent>
          <UtilityBillingTable bills={bills} />
        </CardContent>
      </Card>
    </div>
  )
}

export default async function UtilitiesBillingPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Utilities Billing</h2>
      </div>

      <Suspense fallback={<UtilityBillingSkeleton />}>
        <UtilityBillingContent searchParams={params} />
      </Suspense>
    </div>
  )
}
