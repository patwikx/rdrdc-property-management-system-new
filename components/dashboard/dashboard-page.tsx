// app/dashboard/page.tsx
import { Suspense } from "react"
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Wrench
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardStats, getRecentActivities, getUpcomingTasks, getExpiringLeases, getOverduePayments } from "@/lib/actions/dashboard-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend 
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: { value: number; positive: boolean }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.value}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function DashboardStats() {
  const stats = await getDashboardStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Properties"
        value={stats.properties.total}
        icon={Building2}
        description={`${stats.properties.byType.COMMERCIAL} commercial, ${stats.properties.byType.RESIDENTIAL} residential`}
      />
      <StatCard
        title="Total Spaces"
        value={stats.units.total}
        icon={Building2}
        description={`${stats.units.occupancyRate}% occupied`}
      />
      <StatCard
        title="Active Tenants"
        value={stats.tenants.active}
        icon={Users}
        description={`${stats.tenants.pending} pending approval`}
      />
      <StatCard
        title="Total Rent Collected"
        value={`₱${stats.financial.totalRentCollected.toLocaleString()}`}
        icon={DollarSign}
        description={`${stats.financial.pendingPayments} pending payments`}
      />
    </div>
  )
}

async function FinancialOverview() {
  const stats = await getDashboardStats()

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>Payment and PDC status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pending Payments</span>
            </div>
            <Badge variant="outline">{stats.financial.pendingPayments}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Overdue Payments</span>
            </div>
            <Badge variant="destructive">{stats.financial.overduePayments}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Open PDCs</span>
            </div>
            <Badge variant="secondary">{stats.financial.pdcOpen}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm">Deposited PDCs</span>
            </div>
            <Badge variant="secondary">{stats.financial.pdcDeposited}</Badge>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/financial/payments">
            <Button variant="outline" size="sm" className="w-full">
              View All Payments
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

async function MaintenanceOverview() {
  const stats = await getDashboardStats()

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Maintenance Requests</CardTitle>
        <CardDescription>Current maintenance status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Emergency</span>
            </div>
            <Badge variant="destructive">{stats.maintenance.emergency}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Pending</span>
            </div>
            <Badge variant="outline">{stats.maintenance.pending}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              <span className="text-sm">In Progress</span>
            </div>
            <Badge variant="secondary">{stats.maintenance.inProgress}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-green-600" />
              <span className="text-sm">Completed</span>
            </div>
            <Badge className="bg-green-600">{stats.maintenance.completed}</Badge>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/maintenance/requests">
            <Button variant="outline" size="sm" className="w-full">
              View All Requests
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

async function TaxOverview() {
  const stats = await getDashboardStats()

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Tax Overview</CardTitle>
        <CardDescription>Property and unit taxes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Property Taxes</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due</span>
                <Badge variant="outline">{stats.taxes.propertyTaxesDue}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overdue</span>
                <Badge variant="destructive">{stats.taxes.propertyTaxesOverdue}</Badge>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Unit Taxes</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due</span>
                <Badge variant="outline">{stats.taxes.unitTaxesDue}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overdue</span>
                <Badge variant="destructive">{stats.taxes.unitTaxesOverdue}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/taxes">
            <Button variant="outline" size="sm" className="w-full">
              View Tax Reports
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

async function LeaseOverview() {
  const stats = await getDashboardStats()

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Lease Overview</CardTitle>
        <CardDescription>Active and expiring leases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm">Active Leases</span>
            </div>
            <Badge className="bg-green-600">{stats.leases.active}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Expiring Soon (30 days)</span>
            </div>
            <Badge variant="outline">{stats.leases.expiringSoon}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Expired Leases</span>
            </div>
            <Badge variant="secondary">{stats.leases.expired}</Badge>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/tenants/leases">
            <Button variant="outline" size="sm" className="w-full">
              View All Leases
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

async function RecentActivities() {
  const activities = await getRecentActivities(5)

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest system activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{activity.type}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/system/audit-logs">
            <Button variant="outline" size="sm" className="w-full">
              View All Activities
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

async function UpcomingTasksList() {
  const tasks = await getUpcomingTasks(5)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive'
      case 'HIGH': return 'default'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <CardDescription>Tasks due soon</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{task.title}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">{task.status}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/projects/tasks">
            <Button variant="outline" size="sm" className="w-full">
              View All Tasks
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

async function ExpiringLeasesList() {
  const leases = await getExpiringLeases(30)

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Expiring Leases</CardTitle>
        <CardDescription>Leases expiring in the next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No leases expiring soon
            </p>
          ) : (
            leases.slice(0, 5).map((lease) => (
              <div key={lease.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {lease.tenant.company || `${lease.tenant.firstName} ${lease.tenant.lastName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lease.leaseUnits.map(lu => lu.unit.unitNumber).join(', ')} - {lease.leaseUnits[0]?.unit.property.propertyName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {format(new Date(lease.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <Badge variant="outline">{lease.tenant.bpCode}</Badge>
              </div>
            ))
          )}
        </div>
        {leases.length > 0 && (
          <div className="mt-4">
            <Link href="/tenants/leases?filter=expiring">
              <Button variant="outline" size="sm" className="w-full">
                View All Expiring Leases
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function OverduePaymentsList() {
  const payments = await getOverduePayments()

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Overdue Payments</CardTitle>
        <CardDescription>Payments past due date</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No overdue payments
            </p>
          ) : (
            payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {payment.lease.tenant.company || `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Amount: ₱{payment.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-destructive">
                    Due: {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="mb-1">OVERDUE</Badge>
                  <p className="text-xs text-muted-foreground">{payment.lease.tenant.bpCode}</p>
                </div>
              </div>
            ))
          )}
        </div>
        {payments.length > 0 && (
          <div className="mt-4">
            <Link href="/financial/payments?filter=overdue">
              <Button variant="outline" size="sm" className="w-full">
                View All Overdue Payments
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-6">
        <Suspense fallback={<Skeleton className="h-[300px] col-span-2" />}>
          <FinancialOverview />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[300px] col-span-2" />}>
          <MaintenanceOverview />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[300px] col-span-2" />}>
          <TaxOverview />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[300px] col-span-2" />}>
          <LeaseOverview />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[400px] col-span-3" />}>
          <RecentActivities />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[400px] col-span-3" />}>
          <UpcomingTasksList />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[400px] col-span-3" />}>
          <ExpiringLeasesList />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[400px] col-span-3" />}>
          <OverduePaymentsList />
        </Suspense>
      </div>
    </div>
  )
}