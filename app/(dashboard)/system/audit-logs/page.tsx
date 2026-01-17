import { Suspense } from "react"

export const dynamic = 'force-dynamic'
import { getAuditLogs, getAuditLogStats } from "@/lib/actions/audit-log-actions"
import { AuditLogsClient } from "./audit-logs-client"
import { Skeleton } from "@/components/ui/skeleton"

async function AuditLogsContent() {
  const [logsResult, statsResult] = await Promise.all([
    getAuditLogs({ page: 1, pageSize: 20, sortOrder: 'desc' }),
    getAuditLogStats()
  ])

  if (!logsResult.success || !logsResult.data || !statsResult.success || !statsResult.data) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive text-sm font-mono uppercase">
        Error loading audit logs: {logsResult.error || statsResult.error}
      </div>
    )
  }

  return (
    <AuditLogsClient 
      initialData={logsResult.data} 
      initialStats={statsResult.data} 
    />
  )
}

function AuditLoading() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center pb-6 border-b border-border">
          <div className="space-y-2">
             <Skeleton className="h-8 w-48 rounded-none" />
             <Skeleton className="h-4 w-64 rounded-none" />
          </div>
          <Skeleton className="h-8 w-32 rounded-none" />
       </div>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
             <Skeleton key={i} className="h-24 w-full rounded-none" />
          ))}
       </div>
       <div className="border border-border bg-background p-4">
          <div className="flex gap-2 mb-4">
             <Skeleton className="h-8 w-full rounded-none" />
             <Skeleton className="h-8 w-32 rounded-none" />
             <Skeleton className="h-8 w-32 rounded-none" />
          </div>
          {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-12 w-full mb-2 rounded-none" />
          ))}
       </div>
    </div>
  )
}

export default function AuditLogsPage() {
  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      <Suspense fallback={<AuditLoading />}>
        <AuditLogsContent />
      </Suspense>
    </div>
  )
}