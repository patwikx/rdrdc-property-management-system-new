import { Suspense } from "react"
import { Wrench } from "lucide-react"

import { getRWOs, getPropertiesForRWOFilter, getSpacesForRWO } from "@/lib/actions/rwo-actions"
import { RWOSummary } from "@/components/rwo/rwo-summary"
import { RWOKanbanBoard } from "@/components/rwo/rwo-kanban-board"
import { RWOFilters } from "@/components/rwo/rwo-filters"
import { CreateRWODialog } from "@/components/rwo/create-rwo-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MaintenanceCategory, Priority } from "@prisma/client"

/**
 * RWO Kanban Page
 * Integrates all RWO components
 * Implements URL filter persistence
 * Requirements: 2.1, 5.1, 5.2, 5.3, 5.4
 */

interface RWOPageProps {
  searchParams: Promise<{
    property?: string
    priority?: string
    category?: string
  }>
}

export default async function RWOPage({ searchParams }: RWOPageProps) {
  const params = await searchParams
  
  // Parse filter params
  const filters = {
    propertyId: params.property || undefined,
    priority: params.priority as Priority | undefined,
    category: params.category as MaintenanceCategory | undefined,
  }

  // Fetch data in parallel
  const [rwoData, properties, spaces] = await Promise.all([
    getRWOs(filters),
    getPropertiesForRWOFilter(),
    getSpacesForRWO(),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">RWO Kanban Board</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track Repair Work Orders
            </p>
          </div>
        </div>
        
        <CreateRWODialog spaces={spaces} />
      </div>

      {/* Summary Cards */}
      <Suspense fallback={<SummarySkeleton />}>
        <RWOSummary summary={rwoData.summary} />
      </Suspense>

      {/* Filters */}
      <Suspense fallback={<FiltersSkeleton />}>
        <RWOFilters properties={properties} />
      </Suspense>

      {/* Kanban Board */}
      <Suspense fallback={<BoardSkeleton />}>
        <RWOKanbanBoard requests={rwoData.requests} />
      </Suspense>
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-lg" />
      ))}
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-[160px]" />
      <Skeleton className="h-10 w-[160px]" />
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-80 flex-shrink-0">
          <Skeleton className="h-10 w-full mb-3 rounded-t-lg" />
          <Skeleton className="h-[400px] w-full rounded-b-lg" />
        </div>
      ))}
    </div>
  )
}
