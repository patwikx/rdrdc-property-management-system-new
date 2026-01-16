"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, Search, X, Home, Users, Wrench, FileText, Layers, Star, Activity, ArrowRight, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUnits, getUnitStats, getPropertiesForFilter, type UnitWithDetails, type UnitSortBy, type SortOrder } from "@/lib/actions/units-actions"
import { SpaceRateFilter } from "@/components/filters/space-rate-filter"
import { UnitStatus } from "@prisma/client"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function getUnitStatusStyle(status: UnitStatus) {
  switch (status) {
    case 'OCCUPIED': return { border: 'border-l-blue-500', text: 'text-blue-600', bg: 'bg-blue-500/10' }
    case 'VACANT': return { border: 'border-l-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500/10' }
    case 'MAINTENANCE': return { border: 'border-l-rose-500', text: 'text-rose-600', bg: 'bg-rose-500/10' }
    case 'RESERVED': return { border: 'border-l-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' }
    default: return { border: 'border-l-muted', text: 'text-muted-foreground', bg: 'bg-muted/10' }
  }
}

function UnitCard({ unit, isHighestRate }: { unit: UnitWithDetails; isHighestRate?: boolean }) {
  const styles = getUnitStatusStyle(unit.status)

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
    <Card className={cn(
      `group rounded-none border border-border border-l-4 ${styles.border} hover:border-primary/50 transition-all hover:shadow-none bg-background relative overflow-hidden flex flex-col h-full`,
      isHighestRate && "ring-1 ring-yellow-500/50"
    )}>
      <CardHeader className="pb-2 pt-3 px-4 space-y-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold flex items-center gap-2 font-mono tracking-tight">
              SPACE {unit.unitNumber}
              {isHighestRate && (
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
              )}
            </CardTitle>
            <CardDescription className="text-xs font-mono truncate max-w-[180px] text-muted-foreground">
              {unit.property.propertyName}
            </CardDescription>
          </div>
          <Badge variant="outline" className={`rounded-none text-[10px] uppercase tracking-widest border-0 ${styles.bg} ${styles.text} px-2 py-0.5`}>
            {unit.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col">
        {unit.currentLease ? (
          <div className="p-3 bg-muted/10 border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Tenant</span>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-sm truncate">
                {[unit.currentLease.tenant.firstName, unit.currentLease.tenant.lastName]
                  .filter(Boolean)
                  .join(' ') || unit.currentLease.tenant.company || 'N/A'}
              </p>
              <div className="flex justify-between items-center pt-1">
                <p className="text-xs text-muted-foreground font-mono bg-background px-1.5 border border-border/50">
                  {unit.currentLease.tenant.bpCode}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Ends: {format(new Date(unit.currentLease.endDate), 'MMM dd')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/10 border border-dashed border-emerald-500/20 text-center py-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-widest font-bold">Available for Lease</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 py-2 border-t border-dashed border-border/50 mt-auto">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Area</p>
            <p className="font-mono text-sm font-medium">{unit.totalArea.toLocaleString()} sqm</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Monthly Rent</p>
            <p className={`font-mono text-sm font-medium ${isHighestRate ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
              {formatCurrency(unit.totalRent)}
            </p>
          </div>
        </div>

        {unit.unitFloors.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Layers className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Configuration</span>
            </div>
            <div className="space-y-1">
              {unit.unitFloors.slice(0, 2).map((floor) => (
                <div key={floor.id} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">{formatFloorType(floor.floorType)}</span>
                  <span>{floor.area.toLocaleString()} sqm</span>
                </div>
              ))}
              {unit.unitFloors.length > 2 && (
                <p className="text-[10px] text-muted-foreground italic">+{unit.unitFloors.length - 2} more floors</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-border">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5" title="Documents">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">{unit._count.documents}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Maintenance">
              <Wrench className="h-3.5 w-3.5" />
              <span className="text-xs font-mono">{unit._count.maintenanceRequests}</span>
            </div>
          </div>
          <Link href={`/properties/${unit.property.id}/units/${unit.id}`}>
            <Button variant="ghost" size="sm" className="h-7 rounded-none text-[10px] font-mono uppercase tracking-wider hover:bg-muted px-2">
              Details <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}


interface UnitsListProps {
  page: number
  search: string
  status: UnitStatus | undefined
  propertyId: string | undefined
  minRate: number | undefined
  maxRate: number | undefined
  sortBy: UnitSortBy
  sortOrder: SortOrder
}

function UnitsList({ 
  page, 
  search, 
  status,
  propertyId,
  minRate,
  maxRate,
  sortBy,
  sortOrder
}: UnitsListProps) {
  const [units, setUnits] = useState<UnitWithDetails[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [highestRateUnitId, setHighestRateUnitId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUnits() {
      setIsLoading(true)
      try {
        const result = await getUnits({
          page,
          limit: 12,
          search: search || undefined,
          status,
          propertyId: propertyId || undefined,
          minRate,
          maxRate,
          sortBy,
          sortOrder
        })
        setUnits(result.units)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        setHighestRateUnitId(result.highestRateUnitId)
      } catch (error) {
        console.error('Failed to load units:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUnits()
  }, [page, search, status, propertyId, minRate, maxRate, sortBy, sortOrder])

  if (isLoading) {
    return <UnitsLoading />
  }

  if (units.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Home className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground">No Spaces Found</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6 font-mono">
          Try adjusting your search criteria
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {units.map((unit) => (
          <UnitCard 
            key={unit.id} 
            unit={unit} 
            isHighestRate={unit.id === highestRateUnitId}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          search={search}
          status={status}
          propertyId={propertyId}
          minRate={minRate}
          maxRate={maxRate}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      )}

      <div className="flex justify-between items-center border-t border-border pt-4 text-xs text-muted-foreground font-mono uppercase tracking-widest">
        <span>Displaying {units.length} spaces</span>
        <span>Total Inventory: {totalCount}</span>
      </div>
    </div>
  )
}

function UnitsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border border-border bg-background h-[300px] animate-pulse p-4">
          <div className="h-6 w-1/3 bg-muted/20 mb-4" />
          <div className="h-4 w-2/3 bg-muted/20 mb-8" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted/10" />
            <div className="h-3 w-5/6 bg-muted/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchAndFilter({ 
  search, 
  status,
  propertyId,
  sortBy,
  sortOrder,
  minRate,
  maxRate,
  onSearchChange, 
  onStatusChange,
  onPropertyChange,
  onSortChange,
  onRateFilterChange,
  onClearFilters
}: {
  search: string
  status: UnitStatus | undefined
  propertyId: string | undefined
  sortBy: UnitSortBy
  sortOrder: SortOrder
  minRate?: number
  maxRate?: number
  onSearchChange: (value: string) => void
  onStatusChange: (value: UnitStatus | undefined) => void
  onPropertyChange: (value: string | undefined) => void
  onSortChange: (value: string) => void
  onRateFilterChange: (filters: { minRate?: number; maxRate?: number }) => void
  onClearFilters: () => void
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

  const currentSortValue = `${sortBy}-${sortOrder}`
  const hasAnyFilter = search || status || propertyId || minRate !== undefined || maxRate !== undefined || sortBy !== 'name' || sortOrder !== 'asc'

  return (
    <div className="flex flex-col xl:flex-row gap-4 p-4 border border-border bg-muted/5 items-start xl:items-center justify-between">
      <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="SEARCH SPACES..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={propertyId || 'all'}
            onValueChange={(value) => onPropertyChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id} className="font-mono text-xs uppercase">
                  {property.propertyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status || 'all'}
            onValueChange={(value) => onStatusChange(value === 'all' ? undefined : value as UnitStatus)}
          >
            <SelectTrigger className="w-full sm:w-[140px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Status</SelectItem>
              <SelectItem value={UnitStatus.OCCUPIED} className="font-mono text-xs uppercase">Occupied</SelectItem>
              <SelectItem value={UnitStatus.VACANT} className="font-mono text-xs uppercase">Vacant</SelectItem>
              <SelectItem value={UnitStatus.MAINTENANCE} className="font-mono text-xs uppercase">Maintenance</SelectItem>
              <SelectItem value={UnitStatus.RESERVED} className="font-mono text-xs uppercase">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-start xl:justify-end">
        <Select value={currentSortValue} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
            <ArrowUpDown className="h-3 w-3 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="name-asc" className="font-mono text-xs uppercase">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc" className="font-mono text-xs uppercase">Name (Z-A)</SelectItem>
            <SelectItem value="rate-desc" className="font-mono text-xs uppercase">Rate (High-Low)</SelectItem>
            <SelectItem value="rate-asc" className="font-mono text-xs uppercase">Rate (Low-High)</SelectItem>
            <SelectItem value="area-desc" className="font-mono text-xs uppercase">Area (Lg-Sm)</SelectItem>
            <SelectItem value="area-asc" className="font-mono text-xs uppercase">Area (Sm-Lg)</SelectItem>
          </SelectContent>
        </Select>

        <SpaceRateFilter
          minRate={minRate}
          maxRate={maxRate}
          onFilterChange={onRateFilterChange}
        />

        {hasAnyFilter && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="rounded-none h-10 border-border hover:bg-muted font-mono text-xs uppercase tracking-wider"
          >
            <X className="h-3 w-3 mr-2" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}


interface PaginationProps {
  currentPage: number
  totalPages: number
  search: string
  status: UnitStatus | undefined
  propertyId: string | undefined
  minRate: number | undefined
  maxRate: number | undefined
  sortBy: UnitSortBy
  sortOrder: SortOrder
}

function Pagination({ 
  currentPage, 
  totalPages, 
  search, 
  status,
  propertyId,
  minRate,
  maxRate,
  sortBy,
  sortOrder
}: PaginationProps) {
  const router = useRouter()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (propertyId) params.set('property', propertyId)
    if (minRate !== undefined) params.set('minRate', minRate.toString())
    if (maxRate !== undefined) params.set('maxRate', maxRate.toString())
    if (sortBy !== 'name') params.set('sortBy', sortBy)
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder)
    
    const queryString = params.toString()
    return `/properties/units${queryString ? `?${queryString}` : ''}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page))
  }

  return (
    <div className="flex items-center justify-center space-x-1 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-none h-8 px-2 font-mono text-xs border-border disabled:opacity-30"
      >
        PREV
      </Button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(pageNum)}
          className={cn(
            "rounded-none h-8 w-8 p-0 font-mono text-xs",
            pageNum === currentPage ? "bg-primary text-primary-foreground" : "border-border hover:bg-muted"
          )}
        >
          {pageNum}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-none h-8 px-2 font-mono text-xs border-border disabled:opacity-30"
      >
        NEXT
      </Button>
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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border bg-background h-24 animate-pulse p-4">
            <div className="h-4 w-1/3 bg-muted/20 mb-2" />
            <div className="h-8 w-1/2 bg-muted/20" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Spaces</span>
          <Home className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter">{stats.total}</span>
          <span className="text-[10px] text-muted-foreground ml-2">Units</span>
        </div>
      </div>
      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Occupied</span>
          <Users className="h-4 w-4 text-blue-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">{stats.occupied}</span>
          <span className="text-[10px] text-muted-foreground ml-2">{stats.occupancyRate.toFixed(1)}% Rate</span>
        </div>
      </div>
      <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Vacant</span>
          <Building2 className="h-4 w-4 text-emerald-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{stats.vacant}</span>
          <span className="text-[10px] text-muted-foreground ml-2">Available</span>
        </div>
      </div>
      <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
        <div className="flex justify-between items-start">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Revenue</span>
          <Activity className="h-4 w-4 text-blue-600/50" />
        </div>
        <div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">₱{(stats.totalRentValue / 1000).toFixed(1)}k</span>
          <span className="text-[10px] text-muted-foreground ml-2">Monthly</span>
        </div>
      </div>
    </div>
  )
}


export default function UnitsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Parse URL parameters
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState<UnitStatus | undefined>(
    (searchParams.get('status') as UnitStatus) || undefined
  )
  const [propertyId, setPropertyId] = useState<string | undefined>(
    searchParams.get('property') || undefined
  )
  const [minRate, setMinRate] = useState<number | undefined>(
    searchParams.get('minRate') ? parseFloat(searchParams.get('minRate')!) : undefined
  )
  const [maxRate, setMaxRate] = useState<number | undefined>(
    searchParams.get('maxRate') ? parseFloat(searchParams.get('maxRate')!) : undefined
  )
  const [sortBy, setSortBy] = useState<UnitSortBy>(
    (searchParams.get('sortBy') as UnitSortBy) || 'name'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'asc'
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (propertyId) params.set('property', propertyId)
    if (minRate !== undefined) params.set('minRate', minRate.toString())
    if (maxRate !== undefined) params.set('maxRate', maxRate.toString())
    if (sortBy !== 'name') params.set('sortBy', sortBy)
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder)
    
    const queryString = params.toString()
    const newUrl = `/properties/units${queryString ? `?${queryString}` : ''}`
    
    router.replace(newUrl, { scroll: false })
  }, [page, search, status, propertyId, minRate, maxRate, sortBy, sortOrder, router])

  // Reset page when search or filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, propertyId, minRate, maxRate, sortBy, sortOrder])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleStatusChange = (value: UnitStatus | undefined) => {
    setStatus(value)
  }

  const handlePropertyChange = (value: string | undefined) => {
    setPropertyId(value)
  }

  const handleRateFilterChange = (filters: {
    minRate?: number
    maxRate?: number
  }) => {
    if (filters.minRate !== undefined || filters.minRate === undefined) {
      setMinRate(filters.minRate)
    }
    if (filters.maxRate !== undefined || filters.maxRate === undefined) {
      setMaxRate(filters.maxRate)
    }
  }

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [UnitSortBy, SortOrder]
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const handleClearAllFilters = () => {
    setSearch('')
    setStatus(undefined)
    setPropertyId(undefined)
    setMinRate(undefined)
    setMaxRate(undefined)
    setSortBy('name')
    setSortOrder('asc')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Space Inventory</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Manage all spaces across your properties
          </p>
        </div>
      </div>

      <StatsCards />

      <SearchAndFilter
        search={search}
        status={status}
        propertyId={propertyId}
        sortBy={sortBy}
        sortOrder={sortOrder}
        minRate={minRate}
        maxRate={maxRate}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPropertyChange={handlePropertyChange}
        onSortChange={handleSortChange}
        onRateFilterChange={handleRateFilterChange}
        onClearFilters={handleClearAllFilters}
      />

      <UnitsList 
        page={page}
        search={search}
        status={status}
        propertyId={propertyId}
        minRate={minRate}
        maxRate={maxRate}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}