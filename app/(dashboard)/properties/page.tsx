"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Building2, 
  Plus, 
  Search, 
  X, 
  ChevronRight, 
  MapPin, 
  Maximize, 
  DoorOpen, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProperties } from "@/lib/actions/property-actions"
import { PropertyType } from "@prisma/client"
import { cn } from "@/lib/utils"

function PropertyCard({ property }: { property: Awaited<ReturnType<typeof getProperties>>['properties'][0] }) {
  const occupiedUnits = property.units.filter(unit => unit.status === 'OCCUPIED').length
  const occupancyRate = property._count.units > 0 ? (occupiedUnits / property._count.units) * 100 : 0

  const getPropertyTypeStyle = (type: PropertyType) => {
    switch (type) {
      case 'COMMERCIAL': return 'border-blue-500/50 text-blue-600 bg-blue-500/10'
      case 'RESIDENTIAL': return 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10'
      case 'MIXED': return 'border-purple-500/50 text-purple-600 bg-purple-500/10'
      default: return 'border-border text-muted-foreground'
    }
  }

  // Determine health color based on occupancy
  const healthColor = occupancyRate >= 90 ? 'text-emerald-600' : occupancyRate >= 70 ? 'text-amber-600' : 'text-rose-600'
  const HealthIcon = occupancyRate >= 90 ? TrendingUp : AlertCircle

  return (
    <Card className="group rounded-none border border-border hover:border-primary/50 transition-all hover:shadow-none bg-background relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 p-16 bg-muted/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/5 transition-colors duration-500" />
      
      <CardHeader className="p-4 pb-3 border-b border-border/50 bg-muted/5 relative z-10 space-y-0">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1.5 flex-1">
            <Badge variant="outline" className={`rounded-none border text-[9px] font-mono tracking-widest uppercase ${getPropertyTypeStyle(property.propertyType)}`}>
              {property.propertyType}
            </Badge>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight text-foreground truncate" title={property.propertyName}>
                {property.propertyName}
              </CardTitle>
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 border border-border shrink-0">
            {property.propertyCode}
          </span>
        </div>
        <div className="flex items-start gap-1.5 pt-2 text-xs text-muted-foreground min-h-[2.5rem]">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p className="line-clamp-2 leading-relaxed">{property.address}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col flex-1 relative z-10">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
          <div className="p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground">
              <Maximize className="h-3 w-3" />
              <span>Area</span>
            </div>
            <p className="font-mono text-sm font-medium">
              {(property.leasableArea / 1000).toFixed(1)}k <span className="text-[10px] text-muted-foreground">sqm</span>
            </p>
          </div>
          <div className="p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground">
              <DoorOpen className="h-3 w-3" />
              <span>Units</span>
            </div>
            <p className="font-mono text-sm font-medium">
              {property._count.units} <span className="text-[10px] text-muted-foreground">total</span>
            </p>
          </div>
        </div>

        {/* Occupancy Status */}
        <div className="p-4 flex-1 flex flex-col justify-end">
          {property._count.units > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Occupancy</span>
                  <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${healthColor}`}>
                    <HealthIcon className="h-3.5 w-3.5" />
                    {occupancyRate.toFixed(0)}%
                  </div>
                </div>
                <div className="text-[10px] font-mono text-right text-muted-foreground">
                  <span className="text-foreground font-bold">{occupiedUnits}</span>/{property._count.units} Occupied
                </div>
              </div>
              
              <div className="w-full bg-muted/30 h-1 rounded-none overflow-hidden flex">
                <div 
                  className={cn("h-full transition-all rounded-none", 
                    occupancyRate >= 90 ? 'bg-emerald-500' : occupancyRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  )} 
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground font-mono uppercase tracking-widest opacity-50">
              No Units Configured
            </div>
          )}
        </div>

        <div className="p-4 pt-0">
          <Link href={`/properties/${property.id}`} className="block">
            <Button variant="outline" className="w-full rounded-none h-9 text-xs font-mono uppercase tracking-widest border-border hover:bg-foreground hover:text-background justify-between group/btn transition-all">
              View Details
              <ChevronRight className="h-3 w-3 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function PropertiesList({ 
  page, 
  search, 
  type 
}: { 
  page: number
  search: string
  type: PropertyType | undefined
}) {
  const [properties, setProperties] = useState<Awaited<ReturnType<typeof getProperties>>['properties']>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true)
      try {
        const result = await getProperties(page, 12, search || undefined, type)
        setProperties(result.properties)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (error) {
        console.error('Failed to load properties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProperties()
  }, [page, search, type])

  if (isLoading) {
    return <PropertiesLoading />
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Building2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Properties Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          {search || type ? 'Try adjusting your filters' : 'Get started by adding a property'}
        </p>
        <Link href="/properties/create">
          <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
            <Plus className="h-3 w-3 mr-2" />
            Create Property
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          search={search}
          type={type}
        />
      )}

      <div className="flex justify-between items-center border-t border-border pt-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
        <span>Displaying {properties.length} entries</span>
        <span>Total: {totalCount}</span>
      </div>
    </div>
  )
}

function PropertiesLoading() {
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
  type, 
  onSearchChange, 
  onTypeChange 
}: {
  search: string
  type: PropertyType | undefined
  onSearchChange: (value: string) => void
  onTypeChange: (value: PropertyType | undefined) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search properties..."
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

      <div className="flex gap-2">
        <Select
          value={type || 'all'}
          onValueChange={(value) => onTypeChange(value === 'all' ? undefined : value as PropertyType)}
        >
          <SelectTrigger className="w-[180px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
            <SelectValue placeholder="Type: All" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all" className="font-mono text-xs uppercase">All Types</SelectItem>
            <SelectItem value={PropertyType.COMMERCIAL} className="font-mono text-xs uppercase">Commercial</SelectItem>
            <SelectItem value={PropertyType.RESIDENTIAL} className="font-mono text-xs uppercase">Residential</SelectItem>
            <SelectItem value={PropertyType.MIXED} className="font-mono text-xs uppercase">Mixed Use</SelectItem>
          </SelectContent>
        </Select>

        {(search || type) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSearchChange('')
              onTypeChange(undefined)
            }}
            className="rounded-none border-border h-10 px-3 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function Pagination({ 
  currentPage, 
  totalPages, 
  search, 
  type 
}: {
  currentPage: number
  totalPages: number
  search: string
  type: PropertyType | undefined
}) {
  const router = useRouter()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    
    const queryString = params.toString()
    return `/properties${queryString ? `?${queryString}` : ''}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageUrl(page))
  }

  return (
    <div className="flex items-center justify-center space-x-1 py-4">
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
    </div>
  )
}

export default function PropertiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [type, setType] = useState<PropertyType | undefined>(
    (searchParams.get('type') as PropertyType) || undefined
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    
    const queryString = params.toString()
    const newUrl = `/properties${queryString ? `?${queryString}` : ''}`
    
    router.replace(newUrl, { scroll: false })
  }, [page, search, type, router])

  // Reset page when search or type changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type])

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleTypeChange = (value: PropertyType | undefined) => {
    setType(value)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 bg-background min-h-screen">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">Property List</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Portfolio Management System
          </p>
        </div>
        <Link href="/properties/create">
          <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3 w-3 mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      <SearchAndFilter
        search={search}
        type={type}
        onSearchChange={handleSearchChange}
        onTypeChange={handleTypeChange}
      />

      <PropertiesList 
        page={page}
        search={search}
        type={type}
      />
    </div>
  )
}