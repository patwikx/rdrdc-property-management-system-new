"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Plus, Search, Building, Phone, Mail, Calendar, X } from "lucide-react"
import { getAllTenants, TenantWithDetails } from "@/lib/actions/tenant-actions"
import { TenantStatus, LeaseStatus } from "@prisma/client"
import { format } from "date-fns"
import Link from "next/link"

function getTenantStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600'
    case 'PENDING': return 'bg-yellow-600'
    case 'INACTIVE': return 'bg-gray-600'
    default: return 'bg-gray-600'
  }
}

function getLeaseStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-600'
    case 'PENDING': return 'bg-yellow-600'
    case 'TERMINATED': return 'bg-red-600'
    case 'EXPIRED': return 'bg-gray-600'
    default: return 'bg-gray-600'
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

  // Filter tenants based on search query and filters
  const filteredTenants = tenants.filter(tenant => {
    // Search filter
    const matchesSearch = !searchQuery || (
      tenant.bpCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Status filter
    const matchesStatus = filters.status === 'all' || tenant.status === filters.status

    // Active lease filter
    const activeLease = tenant.leases.find(lease => lease.status === 'ACTIVE')
    const matchesActiveLease = filters.hasActiveLease === 'all' || 
      (filters.hasActiveLease === 'yes' && activeLease) ||
      (filters.hasActiveLease === 'no' && !activeLease)

    // Lease status filter
    const matchesLeaseStatus = filters.leaseStatus === 'all' || 
      (activeLease && activeLease.status === filters.leaseStatus)

    return matchesSearch && matchesStatus && matchesActiveLease && matchesLeaseStatus
  })

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all') || searchQuery

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      leaseStatus: 'all',
      hasActiveLease: 'all'
    })
    setSearchQuery('')
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">
            Manage tenant information, leases, and relationships
          </p>
        </div>
        <Link href="/tenants/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as TenantStatus | 'all' }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.leaseStatus}
            onValueChange={(value) => setFilters(prev => ({ ...prev, leaseStatus: value as LeaseStatus | 'all' }))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Lease Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leases</SelectItem>
              <SelectItem value="ACTIVE">Active Lease</SelectItem>
              <SelectItem value="PENDING">Pending Lease</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.hasActiveLease}
            onValueChange={(value) => setFilters(prev => ({ ...prev, hasActiveLease: value as 'all' | 'yes' | 'no' }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Has Lease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              <SelectItem value="yes">With Lease</SelectItem>
              <SelectItem value="no">No Lease</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>{filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{tenants.filter(t => t.status === 'ACTIVE').length} active</span>
        </div>
      </div>

      {/* Tenants Grid */}
      {filteredTenants.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredTenants.map((tenant) => {
            const activeLease = tenant.leases.find(lease => lease.status === 'ACTIVE')
            const totalUnits = activeLease?.leaseUnits.length || 0
            
            return (
              <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {tenant.businessName}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {tenant.bpCode}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getTenantStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Business Info */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{tenant.company}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {tenant.businessName}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{tenant.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{tenant.phone}</span>
                    </div>
                  </div>

                  {/* Active Lease Info */}
                  {activeLease && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Active Lease</span>
                        </div>
                        <Badge className={getLeaseStatusColor(activeLease.status)} variant="outline">
                          {activeLease.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Units: {totalUnits}</div>
                        <div>Rent: ₱{activeLease.totalRentAmount.toLocaleString()}/month</div>
                        <div>Until: {format(new Date(activeLease.endDate), 'MMM dd, yyyy')}</div>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {tenant.leases.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Leases</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {tenant.documents.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Docs</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-orange-600">
                          {tenant.maintenanceRequests.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Requests</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          {tenant.pdcs.length}
                        </div>
                        <div className="text-xs text-muted-foreground">PDCs</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3">
                    <Link href={`/tenants/${tenant.id}`}>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchQuery ? 'No tenants found' : 'No tenants yet'}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first tenant'
            }
          </p>
          {!searchQuery && (
            <Link href="/tenants/create">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Tenant
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}