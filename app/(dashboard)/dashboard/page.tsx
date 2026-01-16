// app/dashboard/page.tsx
import { Suspense } from "react"
import { getDashboardStats, getUpcomingTasks, getExpiringLeases, getUpcomingTenantAnniversaries } from "@/lib/actions/dashboard-actions"

import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { ManagementConsole } from "@/components/dashboard/management-console"
import { PropertyHealth } from "@/components/dashboard/property-health"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

// Data Fetching Wrappers
async function StatusSection() {
  const stats = await getDashboardStats()
  return <DashboardMetrics stats={stats} />
}

async function ConsoleSection() {
  const [tasks, leases, anniversaries] = await Promise.all([
    getUpcomingTasks(15),
    getExpiringLeases(15),
    getUpcomingTenantAnniversaries(30)
  ])
  
  return <ManagementConsole tasks={tasks} leases={leases} anniversaries={anniversaries} />
}

async function PropertySection() {
  const stats = await getDashboardStats()
  return <PropertyHealth stats={stats} />
}

export default function DashboardPage() {
  return (
    <div className="flex-1 p-0 bg-background min-h-screen font-mono">
      <div className="border-b border-border p-6">
        <DashboardHeader />
      </div>

      <div className="p-6 space-y-6">
        {/* TOP ROW: Dashboard Metrics (KPIs) */}
        <Suspense fallback={<div className="h-32 bg-muted/20 animate-pulse border border-border" />}>
          <StatusSection />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* MAIN COLUMN (8/12): Management Console */}
          <div className="xl:col-span-8">
            <Suspense fallback={<div className="h-[600px] w-full bg-muted/10 animate-pulse border border-border" />}>
              <ConsoleSection />
            </Suspense>
          </div>

          {/* SIDEBAR COLUMN (4/12): Property Health */}
          <div className="xl:col-span-4 space-y-6">
            <Suspense fallback={<div className="h-64 bg-muted/10 animate-pulse border border-border" />}>
              <PropertySection />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}