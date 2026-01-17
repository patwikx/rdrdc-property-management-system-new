import { Suspense } from "react"

import { getRWOs, getPropertiesForRWOFilter, getSpacesForRWO, getUsersForRWOAssignment } from "@/lib/actions/rwo-actions"
import { RWOSummary } from "@/components/rwo/rwo-summary"
import { RWOKanbanBoard } from "@/components/rwo/rwo-kanban-board"
import { RWOFilters } from "@/components/rwo/rwo-filters"
import { CreateRWODialog } from "@/components/rwo/create-rwo-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MaintenanceCategory, Priority } from "@prisma/client"

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
  const [rwoData, properties, spaces, users] = await Promise.all([
    getRWOs(filters),
    getPropertiesForRWOFilter(),
    getSpacesForRWO(),
    getUsersForRWOAssignment(),
  ])

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold uppercase tracking-tight">RWO Kanban Board</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Manage and track Repair Work Orders
          </p>
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
        <div className="flex-1 min-h-0 border border-border bg-background p-4 overflow-hidden">
           <RWOKanbanBoard requests={rwoData.requests} users={users} />
        </div>
      </Suspense>
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-[120px] rounded-none" />
      ))}
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="flex gap-4 border border-border bg-muted/5 p-1">
      <Skeleton className="h-9 w-[200px] rounded-none" />
      <Skeleton className="h-9 w-[160px] rounded-none" />
      <Skeleton className="h-9 w-[160px] rounded-none" />
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 border border-border bg-background p-4 h-full">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-full flex flex-col h-full">
          <Skeleton className="h-10 w-full mb-3 rounded-none" />
          <Skeleton className="flex-1 w-full rounded-none" />
        </div>
      ))}
    </div>
  )
}
