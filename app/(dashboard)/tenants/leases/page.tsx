"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FileCheck, Plus, Search, X, Calendar, Building, DollarSign, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLeases, getLeaseStats } from "@/lib/actions/lease-actions"
import { LeaseStatus } from "@prisma/client"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 border border-border bg-background">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/10 animate-pulse border-r border-border last:border-r-0" />
        ))}
      </div>
    )
  } 

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Leases</span>
          <FileCheck className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter">{stats.totalLeases}</span>
          <span className="text-xs text-muted-foreground ml-2">Records</span>
        </div>
      </div>

      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Active</span>
          <Building className="h-4 w-4 text-emerald-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{stats.activeLeases}</span>
          <span className="text-xs text-muted-foreground ml-2">Current</span>
        </div>
      </div>

      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Pending</span>
          <Calendar className="h-4 w-4 text-amber-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-amber-600">{stats.pendingLeases}</span>
          <span className="text-xs text-muted-foreground ml-2">Approvals</span>
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Revenue</span>
          <DollarSign className="h-4 w-4 text-blue-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">₱{(stats.totalRevenue / 1000).toFixed(1)}k</span>
          <span className="text-xs text-muted-foreground ml-2">Monthly</span>
        </div>
      </div>
    </div>
  )
}

function LeaseCard({ lease }: { lease: Awaited<ReturnType<typeof getLeases>>['leases'][0] }) {
  const tenantName = lease.tenant.firstName && lease.tenant.lastName 
    ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
    : lease.tenant.businessName || lease.tenant.company

  const getLeaseStatusColor = (status: LeaseStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'TERMINATED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      case 'EXPIRED': return 'bg-slate-500/10 text-slate-600 border-slate-500/20'
      default: return 'bg-muted/10 text-muted-foreground border-border'
    }
  }

  const getCardBorderColor = (status: LeaseStatus) => {
    switch (status) {
      case 'ACTIVE': return 'border-l-4 border-l-emerald-500'
      case 'PENDING': return 'border-l-4 border-l-amber-500'
      case 'TERMINATED': return 'border-l-4 border-l-rose-500'
      case 'EXPIRED': return 'border-l-4 border-l-slate-500'
      default: return 'border-l-4 border-l-muted'
    }
  }

  return (
    <div className={cn("border border-border bg-background p-5 flex flex-col gap-5 hover:border-primary/50 transition-colors group relative", getCardBorderColor(lease.status))}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono font-bold text-sm truncate" title={lease.id}>LEASE-{lease.id.slice(0, 8)}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider truncate max-w-[180px]" title={tenantName}>{tenantName}</span>
        </div>
        <Badge variant="outline" className={cn("rounded-none text-[10px] px-2 py-0.5 border-0 uppercase tracking-widest", getLeaseStatusColor(lease.status))}>
          {lease.status}
        </Badge>
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase text-muted-foreground tracking-widest">Duration</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {Math.ceil((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24))} DAYS
          </span>
        </div>
        <div className="text-xs font-mono bg-muted/5 border border-border p-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">START</span>
            <span>{format(new Date(lease.startDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-muted-foreground">END</span>
            <span>{format(new Date(lease.endDate), 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border p-3 bg-muted/5">
          <span className="text-[10px] uppercase text-muted-foreground tracking-widest block mb-1.5">Rent</span>
          <span className="font-mono text-sm font-bold block">₱{lease.totalRentAmount.toLocaleString()}</span>
        </div>
        <div className="border border-border p-3 bg-muted/5">
          <span className="text-[10px] uppercase text-muted-foreground tracking-widest block mb-1.5">Deposit</span>
          <span className="font-mono text-sm text-muted-foreground block">₱{lease.securityDeposit.toLocaleString()}</span>
        </div>
      </div>

      {/* Spaces */}
      <div className="space-y-3 pt-4 border-t border-dashed border-border/50 mt-auto">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase text-muted-foreground tracking-widest">Leased Spaces</span>
          <span className="text-[10px] font-mono bg-muted/20 px-1.5 py-0.5">{lease.leaseUnits.length} UNITS</span>
        </div>
        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-none">
          {lease.leaseUnits.slice(0, 3).map((lu) => (
            <div key={lu.id} className="flex justify-between items-center text-xs bg-background border border-border p-2 hover:bg-muted/10 transition-colors">
              <span className="font-mono font-bold text-primary">{lu.unit.unitNumber}</span>
              <span className="font-mono text-muted-foreground">₱{lu.rentAmount.toLocaleString()}</span>
            </div>
          ))}
          {lease.leaseUnits.length > 3 && (
            <div className="text-[10px] text-center text-muted-foreground italic pt-1">
              +{lease.leaseUnits.length - 3} more...
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border mt-2">
        <Link href={`/tenants/leases/${lease.id}`} className="w-full">
          <Button variant="outline" className="w-full rounded-none h-9 text-xs uppercase tracking-widest font-mono hover:bg-primary hover:text-primary-foreground border-border">
            View Contract
          </Button>
        </Link>
      </div>
    </div>
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
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[350px] bg-muted/10 border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  if (leases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border bg-muted/5">
        <FileCheck className="h-12 w-12 text-muted-foreground/30 mb-6" />
        <h3 className="text-xl font-bold uppercase tracking-widest text-muted-foreground">No Leases Found</h3>
        <p className="text-base text-muted-foreground mt-2 mb-8 font-mono">
          {search || status ? 'ADJUST_FILTERS' : 'DATABASE_EMPTY'}
        </p>
        <Link href="/tenants/leases/create">
          <Button className="rounded-none h-11 px-6 text-sm font-mono uppercase tracking-wider">
            <Plus className="h-4 w-4 mr-2" />
            Create Lease
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <div className="flex justify-between items-center text-xs text-muted-foreground font-mono uppercase tracking-wider border-t border-border pt-6">
        <span>Displaying {leases.length} Records</span>
        <span>Total: {totalCount}</span>
      </div>
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
    <div className="flex flex-col sm:flex-row gap-4 p-5 border border-border bg-muted/5 items-start sm:items-center justify-between">
      <div className="flex flex-1 gap-4 w-full">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="SEARCH LEASES..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-none border-border bg-background h-11 font-mono text-sm uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={status || 'all'}
            onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value as LeaseStatus)}
          >
            <SelectTrigger className="w-[180px] rounded-none border-border bg-background h-11 font-mono text-sm uppercase">
              <SelectValue placeholder="STATUS: ALL" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-sm uppercase">All Status</SelectItem>
              <SelectItem value={LeaseStatus.ACTIVE} className="font-mono text-sm uppercase">Active</SelectItem>
              <SelectItem value={LeaseStatus.PENDING} className="font-mono text-sm uppercase">Pending</SelectItem>
              <SelectItem value={LeaseStatus.TERMINATED} className="font-mono text-sm uppercase">Terminated</SelectItem>
              <SelectItem value={LeaseStatus.EXPIRED} className="font-mono text-sm uppercase">Expired</SelectItem>
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
              className="rounded-none h-11 border-border hover:bg-muted font-mono text-sm uppercase tracking-wider px-4"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
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
    <div className="flex items-center justify-center space-x-2 border-t border-border pt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider"
      >
        Previous
      </Button>

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
            className={`rounded-none h-9 w-9 text-xs font-mono ${pageNum === currentPage ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {pageNum}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider"
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

  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    
    const queryString = params.toString()
    const newUrl = `/tenants/leases${queryString ? `?${queryString}` : ''}`
    
    router.replace(newUrl, { scroll: false })
  }, [page, search, status, router])

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
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6 bg-background min-h-screen">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Lease Management</h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Contract Tracking & Administration
          </p>
        </div>
        <Link href="/tenants/leases/create">
          <Button className="rounded-none h-11 px-6 text-sm font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Lease
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