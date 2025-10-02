"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, Plus, Search, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProperties } from "@/lib/actions/property-actions"
import { PropertyType } from "@prisma/client"
import { format } from "date-fns"

function PropertyCard({ property }: { property: Awaited<ReturnType<typeof getProperties>>['properties'][0] }) {
  const occupiedUnits = property.units.filter(unit => unit.status === 'OCCUPIED').length
  const occupancyRate = property._count.units > 0 ? (occupiedUnits / property._count.units) * 100 : 0

  const getPropertyTypeColor = (type: PropertyType) => {
    switch (type) {
      case 'COMMERCIAL': return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
      case 'RESIDENTIAL': return 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
      case 'MIXED': return 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
      default: return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{property.propertyName}</CardTitle>
            <CardDescription className="text-sm">
              Code: {property.propertyCode}
            </CardDescription>
          </div>
          <Badge className={getPropertyTypeColor(property.propertyType)}>
            {property.propertyType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="line-clamp-2">{property.address}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Leasable Area</p>
            <p className="font-medium">{property.leasableArea.toLocaleString()} sqm</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Units</p>
            <p className="font-medium">{property._count.units}</p>
          </div>
        </div>

        {property._count.units > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Occupancy Rate</span>
              <span className="font-medium">{occupancyRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all" 
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{occupiedUnits} occupied</span>
              <span>{property._count.units - occupiedUnits} vacant</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Created {format(new Date(property.createdAt), 'MMM dd, yyyy')}
          </span>
          <Link href={`/properties/${property.id}`}>
            <Button variant="outline" size="sm">
              View Details
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
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
        <p className="mt-2 text-muted-foreground">
          {search || type ? 'Try adjusting your search criteria.' : 'Get started by creating your first property.'}
        </p>
        <Link href="/properties/create">
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Property
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      <div className="text-center text-sm text-muted-foreground">
        Showing {properties.length} of {totalCount} properties
      </div>
    </div>
  )
}

function PropertiesLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-2 w-full" />
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
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search properties..."
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
        value={type || 'all'}
        onValueChange={(value) => onTypeChange(value === 'all' ? undefined : value as PropertyType)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Property type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value={PropertyType.COMMERCIAL}>Commercial</SelectItem>
          <SelectItem value={PropertyType.RESIDENTIAL}>Residential</SelectItem>
          <SelectItem value={PropertyType.MIXED}>Mixed Use</SelectItem>
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
          <p className="text-muted-foreground">
            Manage your property portfolio
          </p>
        </div>
        <Link href="/properties/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Property
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