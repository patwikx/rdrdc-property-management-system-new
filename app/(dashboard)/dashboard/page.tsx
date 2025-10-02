// app/dashboard/page.tsx
import { Suspense } from "react"
import { getDashboardStats, getRecentActivities, getUpcomingTasks, getExpiringLeases, getOverduePayments } from "@/lib/actions/dashboard-actions"

import { OccupancyChart, PropertyTypeChart } from "@/components/dashboard/dashboard-charts"
import { FinancialOverview } from "@/components/dashboard/financial-overview"
import { MaintenanceOverview } from "@/components/dashboard/maintenance-overview"
import { DashboardStatsCards } from "@/components/dashboard/stat-cards"
import { TaxOverview } from "@/components/dashboard/tax-overview"
import { LeaseOverview } from "@/components/dashboard/lease-overview"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { UpcomingTasks } from "@/components/dashboard/upcoming-task"
import { ExpiringLeases } from "@/components/dashboard/expiring-leases"
import { OverduePayments } from "@/components/dashboard/overdue-payments"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton"


async function DashboardStats() {
  const stats = await getDashboardStats()
  return <DashboardStatsCards stats={stats} />
}

async function ChartsSection() {
  const stats = await getDashboardStats()
  return (
    <>
      <OccupancyChart stats={stats} />
      <PropertyTypeChart stats={stats} />
    </>
  )
}

async function FinancialSection() {
  const stats = await getDashboardStats()
  return <FinancialOverview stats={stats} />
}

async function MaintenanceSection() {
  const stats = await getDashboardStats()
  return <MaintenanceOverview stats={stats} />
}

async function TaxSection() {
  const stats = await getDashboardStats()
  return <TaxOverview stats={stats} />
}

async function LeaseSection() {
  const stats = await getDashboardStats()
  return <LeaseOverview stats={stats} />
}

async function ActivitiesSection() {
  const activities = await getRecentActivities(5)
  return <RecentActivities activities={activities} />
}

async function TasksSection() {
  const tasks = await getUpcomingTasks(5)
  return <UpcomingTasks tasks={tasks} />
}

async function LeasesListSection() {
  const leases = await getExpiringLeases(30)
  return <ExpiringLeases leases={leases} />
}

async function PaymentsListSection() {
  const payments = await getOverduePayments()
  return <OverduePayments payments={payments} />
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <DashboardHeader />

      <Suspense fallback={<LoadingSkeleton type="stats" />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-6">
        <Suspense fallback={<LoadingSkeleton type="chart" />}>
          <ChartsSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="card" cols={2} />}>
          <FinancialSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="card" cols={2} />}>
          <MaintenanceSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="card" cols={2} />}>
          <TaxSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="card" cols={2} />}>
          <LeaseSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="list" cols={3} />}>
          <ActivitiesSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="list" cols={3} />}>
          <TasksSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="list" cols={3} />}>
          <LeasesListSection />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton type="list" cols={3} />}>
          <PaymentsListSection />
        </Suspense>
      </div>
    </div>
  )
}