"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FileCheck, Plus, Search, X, Calendar, Building, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLeases, getLeaseStats } from "@/lib/actions/lease-actions"
import { LeaseStatus } from "@prisma/client"
import { format } from "date-fns"


function LeaseStatsCards() {
  const [stats, setStats] = useState({
    totalLeases: 0,
    activeLeases: 0,
    pendingLeases: 0,
    terminatedLeases: 0,
    expiredLeases: 0,
    totalRevenue: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const leaseStats = await getLeaseStats()
        setStats(leaseStats)
      } catch (error) {
        console.error('Failed to load lease stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  } 
 return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leases</CardTitle>
          <FileCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeases}</div>
          <p className="text-xs text-muted-foreground">All lease agreements</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeLeases}</div>
          <p className="text-xs text-muted-foreground">Currently active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Leases</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingLeases}</div>
          <p className="text-xs text-muted-foreground">Awaiting activation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₱{stats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From active leases</p>
        </CardContent>
      </Card>
    </div>
  )
}

function LeaseCard({ lease }: { lease: Awaited<ReturnType<typeof getLeases>>['leases'][0] }) {
  const tenantName = lease.tenant.firstName && lease.tenant.lastName 
    ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
    : lease.tenant.businessName || lease.tenant.company

  const getLeaseStatusColor = (status: LeaseStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-600'
      case 'PENDING': return 'bg-yellow-600'
      case 'TERMINATED': return 'bg-red-600'
      case 'EXPIRED': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const isExpiringSoon = () => {
    const today = new Date()
    const endDate = new Date(lease.endDate)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && lease.status === 'ACTIVE'
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{tenantName}</CardTitle>
            <CardDescription className="text-sm">
              {lease.tenant.bpCode} • {lease.tenant.company}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getLeaseStatusColor(lease.status)}>
              {lease.status}
            </Badge>
            {isExpiringSoon() && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Expiring Soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Monthly Rent</p>
            <p className="font-medium">₱{lease.totalRentAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Security Deposit</p>
            <p className="font-medium">₱{lease.securityDeposit.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lease Period</span>
            <span className="font-medium">
              {format(new Date(lease.startDate), 'MMM dd, yyyy')} - {format(new Date(lease.endDate), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {lease.leaseUnits.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Leased Units ({lease.leaseUnits.length})</p>
            <div className="space-y-1">
              {lease.leaseUnits.slice(0, 2).map((leaseUnit) => (
                <div key={leaseUnit.id} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                  <span>{leaseUnit.unit.unitNumber} - {leaseUnit.unit.property.propertyName}</span>
                  <span className="font-medium">₱{leaseUnit.rentAmount.toLocaleString()}</span>
                </div>
              ))}
              {lease.leaseUnits.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{lease.leaseUnits.length - 2} more units
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Created {format(new Date(lease.createdAt), 'MMM dd, yyyy')}
          </span>
          <Link href={`/tenants/leases/${lease.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function LeasesList({ 
  page, 
  search, 
  status 
}: { 
  page: number
  search: string
  status: LeaseStatus | undefined
}) {
  const [leases, setLeases] = useState<Awaited<ReturnType<typeof getLeases>>['leases']>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadLeases() {
      setIsLoading(true)
      try {
        const result = await getLeases(page, 12, search || undefined, status)
        setLeases(result.leases)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (error) {
        console.error('Failed to load leases:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeases()
  }, [page, search, status])

  if (isLoading) {
    return <LeasesLoading />
  }

  if (leases.length === 0) {
    return (
      <div className="text-center py-12">
        <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No leases found</h3>
        <p className="mt-2 text-muted-foreground">
          {search || status ? 'Try adjusting your search criteria.' : 'Get started by creating your first lease.'}
        </p>
        <Link href="/tenants/leases/create">
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Lease
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {leases.map((lease) => (
          <LeaseCard key={lease.id} lease={lease} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          search={search}
          status={status}
        />
      )}

      <div className="text-center text-sm text-muted-foreground">
        Showing {leases.length} of {totalCount} leases
      </div>
    </div>
  )
}

function LeasesLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SearchAndFilter({ 
  search, 
  status, 
  onSearchChange, 
  onStatusChange 
}: {
  search: string
  status: LeaseStatus | undefined
  onSearchChange: (value: string) => void
  onStatusChange: (value: LeaseStatus | undefined) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leases..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select
        value={status || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value as LeaseStatus)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value={LeaseStatus.ACTIVE}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <span>Active</span>
            </div>
          </SelectItem>
          <SelectItem value={LeaseStatus.PENDING}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-600" />
              <span>Pending</span>
            </div>
          </SelectItem>
          <SelectItem value={LeaseStatus.TERMINATED}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span>Terminated</span>
            </div>
          </SelectItem>
          <SelectItem value={LeaseStatus.EXPIRED}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
              <span>Expired</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {(search || status) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSearchChange('')
            onStatusChange(undefined)
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  )
}

function Pagination({ 
  currentPage, 
  totalPages, 
  search, 
  status 
}: {
  currentPage: number
  totalPages: number
  search: string
  status: LeaseStatus | undefined
}) {
  const router = useRouter()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    
    const queryString = params.toString()
    return `/tenants/leases${queryString ? `?${queryString}` : ''}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page))
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(pageNum)}
        >
          {pageNum}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
}

export default function LeasesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState<LeaseStatus | undefined>(
    (searchParams.get('status') as LeaseStatus) || undefined
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    
    const queryString = params.toString()
    const newUrl = `/tenants/leases${queryString ? `?${queryString}` : ''}`
    
    router.replace(newUrl, { scroll: false })
  }, [page, search, status, router])

  // Reset page when search or status changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleStatusChange = (value: LeaseStatus | undefined) => {
    setStatus(value)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Lease Management</h2>
          <p className="text-muted-foreground">
            Manage tenant lease agreements and contracts
          </p>
        </div>
        <Link href="/tenants/leases/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Lease
          </Button>
        </Link>
      </div>

      <LeaseStatsCards />

      <SearchAndFilter
        search={search}
        status={status}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      <LeasesList 
        page={page}
        search={search}
        status={status}
      />
    </div>
  )
}