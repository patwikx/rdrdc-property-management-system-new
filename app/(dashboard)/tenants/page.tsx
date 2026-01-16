"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Plus, Search, Building, Phone, Mail, X, Briefcase, ChevronRight, Upload } from "lucide-react"
import { getAllTenants, TenantWithDetails } from "@/lib/actions/tenant-actions"
import { TenantStatus, LeaseStatus } from "@prisma/client"
import { format } from "date-fns"
import Link from "next/link"

function getTenantStatusStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { border: 'border-l-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    case 'PENDING': return { border: 'border-l-amber-500', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
    case 'INACTIVE': return { border: 'border-l-slate-500', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }
    default: return { border: 'border-l-muted', badge: 'bg-muted/10 text-muted-foreground border-border' }
  }
}

interface TenantFilters {
  status: TenantStatus | 'all'
  leaseStatus: LeaseStatus | 'all'
  hasActiveLease: 'all' | 'yes' | 'no'
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<TenantFilters>({
    status: 'all',
    leaseStatus: 'all',
    hasActiveLease: 'all'
  })

  useEffect(() => {
    async function fetchTenants() {
      try {
        const tenantsData = await getAllTenants()
        setTenants(tenantsData)
      } catch (error) {
        console.error("Error fetching tenants:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenants()
  }, [])

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = !searchQuery || (
      tenant.bpCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const matchesStatus = filters.status === 'all' || tenant.status === filters.status

    const activeLease = tenant.leases.find(lease => lease.status === 'ACTIVE')
    const matchesActiveLease = filters.hasActiveLease === 'all' || 
      (filters.hasActiveLease === 'yes' && activeLease) ||
      (filters.hasActiveLease === 'no' && !activeLease)

    const matchesLeaseStatus = filters.leaseStatus === 'all' || 
      (activeLease && activeLease.status === filters.leaseStatus)

    return matchesSearch && matchesStatus && matchesActiveLease && matchesLeaseStatus
  })

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all') || searchQuery

  const clearAllFilters = () => {
    setFilters({ status: 'all', leaseStatus: 'all', hasActiveLease: 'all' })
    setSearchQuery('')
  }

  // Stats
  const totalTenants = tenants.length
  const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length
  const pendingTenants = tenants.filter(t => t.status === 'PENDING').length
  const inactiveTenants = tenants.filter(t => t.status === 'INACTIVE').length

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted/20 w-1/3" />
          <div className="grid gap-4 md:grid-cols-4 h-24 bg-muted/10 border border-border" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted/10 border border-border" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Tenant Directory</h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Partner Relationship Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tenants/import">
            <Button variant="outline" className="rounded-none h-10 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </Link>
          <Link href="/tenants/create">
            <Button className="rounded-none h-10 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Tenants</span>
            <User className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter">{totalTenants}</span>
            <span className="text-xs text-muted-foreground ml-2">Records</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Active</span>
            <Building className="h-4 w-4 text-emerald-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{activeTenants}</span>
            <span className="text-xs text-muted-foreground ml-2">Current</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Pending</span>
            <Briefcase className="h-4 w-4 text-amber-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-amber-600">{pendingTenants}</span>
            <span className="text-xs text-muted-foreground ml-2">Onboarding</span>
          </div>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Inactive</span>
            <X className="h-4 w-4 text-slate-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-slate-600">{inactiveTenants}</span>
            <span className="text-xs text-muted-foreground ml-2">Archived</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as TenantStatus | 'all' }))}
            >
              <SelectTrigger className="w-[140px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="all" className="font-mono text-xs uppercase">All Status</SelectItem>
                <SelectItem value="ACTIVE" className="font-mono text-xs uppercase">Active</SelectItem>
                <SelectItem value="INACTIVE" className="font-mono text-xs uppercase">Inactive</SelectItem>
                <SelectItem value="PENDING" className="font-mono text-xs uppercase">Pending</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="rounded-none h-10 border-border hover:bg-muted font-mono text-xs uppercase tracking-wider"
              >
                <X className="h-3 w-3 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tenant Grid */}
      {filteredTenants.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTenants.map((tenant) => {
            const activeLease = tenant.leases.find(lease => lease.status === 'ACTIVE')
            const statusStyle = getTenantStatusStyle(tenant.status)
            
            return (
              <div key={tenant.id} className={`group border border-border border-l-4 ${statusStyle.border} bg-background hover:border-primary/50 transition-all flex flex-col`}>
                {/* Header */}
                <div className="p-4 border-b border-dashed border-border/50 flex justify-between items-start">
                  <div className="flex flex-col w-full pr-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Business Name</span>
                    <h3 className="font-bold text-base truncate w-full" title={tenant.businessName}>
                      {tenant.businessName}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground mt-1 bg-muted/30 px-1 w-fit">
                      {tenant.bpCode}
                    </span>
                  </div>
                  <Badge variant="outline" className={`rounded-none text-xs uppercase tracking-widest border-0 ${statusStyle.badge} px-1.5 py-0.5`}>
                    {tenant.status}
                  </Badge>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{tenant.company}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{tenant.firstName} {tenant.lastName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-mono text-xs">{tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-mono text-xs">{tenant.phone}</span>
                    </div>
                  </div>

                  {activeLease && (
                    <div className="pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Active Lease</span>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-mono text-emerald-600 font-medium">₱{activeLease.totalRentAmount.toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs">Ends {format(new Date(activeLease.endDate), 'MMM yyyy')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Metrics */}
                <div className="grid grid-cols-4 divide-x divide-border border-t border-border bg-muted/5">
                  <div className="p-2 text-center">
                    <div className="text-xs font-mono font-bold">{tenant.leases.length}</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Leases</div>
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-xs font-mono font-bold">{tenant.documents.length}</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Docs</div>
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-xs font-mono font-bold">{tenant.maintenanceRequests.length}</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Reqs</div>
                  </div>
                  <Link href={`/tenants/${tenant.id}`} className="flex items-center justify-center hover:bg-muted/20 transition-colors">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
          <User className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground">No Tenants Found</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6 font-mono">
            {searchQuery ? 'Adjust your filters' : 'Database is empty'}
          </p>
          {!searchQuery && (
            <Link href="/tenants/create">
              <Button className="rounded-none h-10 text-xs font-mono uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}