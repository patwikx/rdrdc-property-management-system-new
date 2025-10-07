"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, Search, X, Home, Users, Wrench, FileText, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUnits, getUnitStats, getPropertiesForFilter, type UnitWithDetails } from "@/lib/actions/units-actions"
import { UnitStatus } from "@prisma/client"
import { format } from "date-fns"

function getUnitStatusColor(status: UnitStatus) {
  switch (status) {
    case 'OCCUPIED': return 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
    case 'VACANT': return 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
    case 'MAINTENANCE': return 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'
    case 'RESERVED': return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
    default: return 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
  }
}

function UnitCard({ unit }: { unit: UnitWithDetails }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatFloorType = (floorType: string) => {
    return floorType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-4 w-4" />
              Space {unit.unitNumber}
            </CardTitle>
            <CardDescription className="text-sm">
              {unit.property.propertyName} • {unit.property.propertyCode}
            </CardDescription>
          </div>
          <Badge className={getUnitStatusColor(unit.status)}>
            {unit.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {unit.currentLease && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Tenant</span>
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {[unit.currentLease.tenant.firstName, unit.currentLease.tenant.lastName]
                  .filter(Boolean)
                  .join(' ') || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                {unit.currentLease.tenant.company} • {unit.currentLease.tenant.bpCode}
              </p>
              <p className="text-sm text-muted-foreground">
                Until {format(new Date(unit.currentLease.endDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Area</p>
            <p className="font-medium">{unit.totalArea.toLocaleString()} sqm</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly Rent</p>
            <p className="font-medium">{formatCurrency(unit.totalRent)}</p>
          </div>
        </div>

        {unit.propertyTitle && (
          <div className="text-sm">
            <p className="text-muted-foreground">Title No.</p>
            <p className="font-medium">{unit.propertyTitle.titleNo}</p>
          </div>
        )}

        {unit.unitFloors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Floor Configuration</span>
            </div>
            <div className="space-y-1">
              {unit.unitFloors.map((floor) => (
                <div key={floor.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatFloorType(floor.floorType)}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{floor.area.toLocaleString()} sqm</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(floor.rent)}</div>
                    <div className="text-muted-foreground">₱{floor.rate.toLocaleString()}/sqm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {unit._count.unitFloors}
            </span>
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {unit._count.maintenanceRequests}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {unit._count.documents}
            </span>
          </div>
          <span>Updated {format(new Date(unit.updatedAt), 'MMM dd')}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            Created {format(new Date(unit.createdAt), 'MMM dd, yyyy')}
          </span>
          <Link href={`/properties/${unit.property.id}/units/${unit.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function UnitsList({ 
  page, 
  search, 
  status,
  propertyId
}: { 
  page: number
  search: string
  status: UnitStatus | undefined
  propertyId: string | undefined
}) {
  const [units, setUnits] = useState<UnitWithDetails[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUnits() {
      setIsLoading(true)
      try {
        const result = await getUnits(page, 12, search || undefined, status, propertyId || undefined)
        setUnits(result.units)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (error) {
        console.error('Failed to load units:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUnits()
  }, [page, search, status, propertyId])

  if (isLoading) {
    return <UnitsLoading />
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No spaces found</h3>
        <p className="mt-2 text-muted-foreground">
          {search || status || propertyId ? 'Try adjusting your search criteria.' : 'No units have been created yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <UnitCard key={unit.id} unit={unit} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          search={search}
          status={status}
          propertyId={propertyId}
        />
      )}

      <div className="text-center text-sm text-muted-foreground">
        Showing {units.length} of {totalCount} spaces.
      </div>
    </div>
  )
}

function UnitsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-4 w-full" />
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
  propertyId,
  onSearchChange, 
  onStatusChange,
  onPropertyChange
}: {
  search: string
  status: UnitStatus | undefined
  propertyId: string | undefined
  onSearchChange: (value: string) => void
  onStatusChange: (value: UnitStatus | undefined) => void
  onPropertyChange: (value: string | undefined) => void
}) {
  const [properties, setProperties] = useState<Array<{id: string, propertyName: string, propertyCode: string}>>([])

  useEffect(() => {
    async function loadProperties() {
      try {
        const result = await getPropertiesForFilter()
        setProperties(result)
      } catch (error) {
        console.error('Failed to load properties:', error)
      }
    }
    loadProperties()
  }, [])

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search spaces..."
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
        value={propertyId || 'all'}
        onValueChange={(value) => onPropertyChange(value === 'all' ? undefined : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Properties" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Properties</SelectItem>
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.propertyName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value as UnitStatus)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Space status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value={UnitStatus.OCCUPIED}>Occupied</SelectItem>
          <SelectItem value={UnitStatus.VACANT}>Vacant</SelectItem>
          <SelectItem value={UnitStatus.MAINTENANCE}>Maintenance</SelectItem>
          <SelectItem value={UnitStatus.RESERVED}>Reserved</SelectItem>
        </SelectContent>
      </Select>

      {(search || status || propertyId) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onSearchChange('')
            onStatusChange(undefined)
            onPropertyChange(undefined)
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
  status,
  propertyId
}: {
  currentPage: number
  totalPages: number
  search: string
  status: UnitStatus | undefined
  propertyId: string | undefined
}) {
  const router = useRouter()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (propertyId) params.set('property', propertyId)
    
    const queryString = params.toString()
    return `/properties/units${queryString ? `?${queryString}` : ''}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page))
  }

  return (
    <div className="flex items-center justify-center space-x-2">
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
    </div>
  )
}

function StatsCards() {
  const [stats, setStats] = useState<{
    total: number
    occupied: number
    vacant: number
    maintenance: number
    reserved: number
    totalRentValue: number
    occupancyRate: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getUnitStats()
        setStats(result)
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

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
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spaces</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            All spaces
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupied</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.occupied}</div>
          <p className="text-xs text-muted-foreground">
            {stats.occupancyRate.toFixed(1)}% occupancy rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vacant</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.vacant}</div>
          <p className="text-xs text-muted-foreground">
            Available for lease
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(stats.totalRentValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            From occupied spaces
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UnitsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState<UnitStatus | undefined>(
    (searchParams.get('status') as UnitStatus) || undefined
  )
  const [propertyId, setPropertyId] = useState<string | undefined>(
    searchParams.get('property') || undefined
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (propertyId) params.set('property', propertyId)
    
    const queryString = params.toString()
    const newUrl = `/properties/units${queryString ? `?${queryString}` : ''}`
    
    router.replace(newUrl, { scroll: false })
  }, [page, search, status, propertyId, router])

  // Reset page when search or filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, propertyId])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleStatusChange = (value: UnitStatus | undefined) => {
    setStatus(value)
  }

  const handlePropertyChange = (value: string | undefined) => {
    setPropertyId(value)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Spaces</h2>
          <p className="text-muted-foreground">
            Manage all spaces across your properties
          </p>
        </div>
      </div>

      <StatsCards />

      <SearchAndFilter
        search={search}
        status={status}
        propertyId={propertyId}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPropertyChange={handlePropertyChange}
      />

      <UnitsList 
        page={page}
        search={search}
        status={status}
        propertyId={propertyId}
      />
    </div>
  )
}