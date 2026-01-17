import { Suspense } from "react"
import { Metadata } from "next"
import { Skeleton } from "@/components/ui/skeleton"
import { getPDCs, getTenants } from "@/lib/actions/pdc-actions"
import { PDCStats } from "./components/pdc-stats"
import { PDCForm } from "./components/pdc-form"
import { PDCTable } from "./components/pdc-table"

export const metadata: Metadata = {
  title: "PDC Monitoring | RDRDC",
  description: "Manage post-dated checks and credit collection",
}

function PDCTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border-r border-border h-24">
            <Skeleton className="h-4 w-1/3 mb-2 rounded-none" />
            <Skeleton className="h-8 w-1/2 rounded-none" />
          </div>
        ))}
      </div>
      <div className="border border-border bg-background">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/5">
          <Skeleton className="h-6 w-[200px] rounded-none" />
          <Skeleton className="h-9 w-[120px] rounded-none" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}

async function PDCContent() {
  const [pdcs, tenants] = await Promise.all([
    getPDCs(),
    getTenants()
  ])

  return (
    <div className="space-y-6">
      <PDCStats pdcs={pdcs} />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Check Registry</h3>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
              Post-dated checks master list
            </p>
          </div>
          <PDCForm tenants={tenants} />
        </div>
        <div className="border border-border bg-background">
          <PDCTable pdcs={pdcs} tenants={tenants} />
        </div>
      </div>
    </div>
  )
}

export default function CreditCollectionPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">PDC Monitoring</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Track and manage post-dated check collections
          </p>
        </div>
      </div>
      
      <Suspense fallback={<PDCTableSkeleton />}>
        <PDCContent />
      </Suspense>
    </div>
  )
}