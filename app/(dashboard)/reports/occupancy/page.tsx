"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DateRangePicker } from "@/components/ui/date-picker"
import { 
  Building, 
  Download, 
  Filter, 
  TrendingDown,
  TrendingUp,
  CheckCircle,
  BarChart3,
  X,
  RefreshCw,
  Home,
  Calendar,
  Target
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  getOccupancyReport,
  getOpportunityLossReport,
  getPropertyPerformanceReport,
  getOccupancyStats,
  type OccupancyReportData,
  type OpportunityLossData,
  type PropertyPerformanceData
} from "@/lib/actions/occupancy-reports-actions"
import { PropertyType } from "@prisma/client"
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/utils/export-utils"

interface OccupancyFilters {
  startDate: Date | undefined
  endDate: Date | undefined
  propertyId: string
  propertyType: PropertyType | "all"
}

interface OccupancyStats {
  totalProperties: number
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  maintenanceUnits: number
  reservedUnits: number
  overallOccupancyRate: number
  totalLeasableArea: number
  occupiedArea: number
  areaOccupancyRate: number
  totalPotentialRevenue: number
  totalActualRevenue: number
  totalOpportunityLoss: number
  opportunityLossPercentage: number
  averageRentPerSqm: number
  bestPerformingProperty: string
  worstPerformingProperty: string
}


function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function OccupancyReportsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [stats, setStats] = useState<OccupancyStats | null>(null)
  const [occupancyData, setOccupancyData] = useState<OccupancyReportData[]>([])
  const [opportunityLossData, setOpportunityLossData] = useState<OpportunityLossData[]>([])
  const [performanceData, setPerformanceData] = useState<PropertyPerformanceData[]>([])
  
  const [filters, setFilters] = useState<OccupancyFilters>({
    startDate: undefined,
    endDate: undefined,
    propertyId: "",
    propertyType: "all",
  })

  const hasActiveFilters = 
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.propertyId !== "" ||
    filters.propertyType !== "all"

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [statsResult, occupancyResult, performanceResult] = await Promise.all([
        getOccupancyStats(),
        getOccupancyReport(),
        getPropertyPerformanceReport(),
      ])

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      if (occupancyResult.success && occupancyResult.data) {
        setOccupancyData(occupancyResult.data)
      }

      if (performanceResult.success && performanceResult.data) {
        setPerformanceData(performanceResult.data)
      }
    } catch (error) {
      console.error("Error fetching occupancy data:", error)
      toast.error("Failed to load occupancy reports")
    } finally {
      setIsLoading(false)
    }
  } 
 const applyFilters = async () => {
    setIsLoading(true)
    try {
      const startDate = filters.startDate
      const endDate = filters.endDate
      const propertyType = filters.propertyType !== "all" ? filters.propertyType : undefined
      const propertyId = filters.propertyId || undefined

      const [occupancyResult, performanceResult, opportunityResult] = await Promise.all([
        getOccupancyReport(startDate, endDate, propertyId, propertyType),
        getPropertyPerformanceReport(startDate, endDate),
        startDate && endDate ? getOpportunityLossReport(startDate, endDate, propertyId) : Promise.resolve({ success: true, data: [] }),
      ])

      if (occupancyResult.success && occupancyResult.data) {
        setOccupancyData(occupancyResult.data)
      }

      if (performanceResult.success && performanceResult.data) {
        setPerformanceData(performanceResult.data)
      }

      if (opportunityResult.success && opportunityResult.data) {
        setOpportunityLossData(opportunityResult.data)
      }

      setIsFilterOpen(false)
      toast.success("Filters applied successfully")
    } catch (error) {
      console.error("Error applying filters:", error)
      toast.error("Failed to apply filters")
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      propertyId: "",
      propertyType: "all",
    })
    fetchAllData()
  }

  const exportOccupancyReport = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "property.propertyCode", label: "Property Code" },
      { key: "property.propertyName", label: "Property Name" },
      { key: "property.propertyType", label: "Type" },
      { key: "occupancy.totalUnits", label: "Total Units", type: "number" },
      { key: "occupancy.occupiedUnits", label: "Occupied", type: "number" },
      { key: "occupancy.vacantUnits", label: "Vacant", type: "number" },
      { key: "occupancy.occupancyRate", label: "Occupancy Rate", type: "percentage" },
      { key: "revenue.potentialRevenue", label: "Potential Revenue", type: "currency" },
      { key: "revenue.actualRevenue", label: "Actual Revenue", type: "currency" },
      { key: "revenue.opportunityLoss", label: "Opportunity Loss", type: "currency" },
    ]

    if (format === "csv") {
      exportToCSV(occupancyData, columns, "occupancy_report")
    } else {
      exportToPDF(occupancyData, columns, "Occupancy Report", "occupancy_report")
    }
  }

  const exportOpportunityLoss = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "property.propertyCode", label: "Property Code" },
      { key: "property.propertyName", label: "Property Name" },
      { key: "period.totalDays", label: "Period Days", type: "number" },
      { key: "loss.vacantDays", label: "Vacant Days", type: "number" },
      { key: "loss.maintenanceDays", label: "Maintenance Days", type: "number" },
      { key: "loss.totalOpportunityLoss", label: "Total Loss", type: "currency" },
    ]

    if (format === "csv") {
      exportToCSV(opportunityLossData, columns, "opportunity_loss_report")
    } else {
      exportToPDF(opportunityLossData, columns, "Opportunity Loss Report", "opportunity_loss_report")
    }
  }

  const exportPerformanceReport = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "property.propertyCode", label: "Property Code" },
      { key: "property.propertyName", label: "Property Name" },
      { key: "performance.occupancyRate", label: "Occupancy Rate", type: "percentage" },
      { key: "performance.totalRevenue", label: "Total Revenue", type: "currency" },
      { key: "performance.opportunityLoss", label: "Opportunity Loss", type: "currency" },
      { key: "performance.averageRentPerSqm", label: "Rent per sqm", type: "currency" },
      { key: "ranking.occupancyRank", label: "Occupancy Rank", type: "number" },
      { key: "ranking.revenueRank", label: "Revenue Rank", type: "number" },
    ]

    if (format === "csv") {
      exportToCSV(performanceData, columns, "property_performance_report")
    } else {
      exportToPDF(performanceData, columns, "Property Performance Report", "property_performance_report")
    }
  } 
 if (isLoading && !stats) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
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
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Occupancy Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive occupancy analysis and opportunity loss tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Occupancy Reports</SheetTitle>
                <SheetDescription>
                  Apply filters to customize your occupancy analysis
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6 mr-4 ml-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Period</label>
                  <DateRangePicker
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    onStartDateChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                    onEndDateChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                    startPlaceholder="Start date"
                    endPlaceholder="End date"
                    
                  />
                </div>

                {/* Property Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, propertyType: value as PropertyType | "all" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Property Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Property Types</SelectItem>
                      <SelectItem value={PropertyType.COMMERCIAL}>Commercial</SelectItem>
                      <SelectItem value={PropertyType.RESIDENTIAL}>Residential</SelectItem>
                      <SelectItem value={PropertyType.MIXED}>Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={applyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button onClick={fetchAllData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>  
    {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Occupancy</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-600/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.overallOccupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.occupiedUnits} of {stats.totalUnits} units
              </p>
              <Progress value={stats.overallOccupancyRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opportunity Loss</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-600/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(stats.totalOpportunityLoss)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.opportunityLossPercentage}% of potential revenue
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Area Occupancy</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.areaOccupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                {(stats.occupiedArea / 1000).toFixed(1)}k of {(stats.totalLeasableArea / 1000).toFixed(1)}k sqm
              </p>
              <Progress value={stats.areaOccupancyRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Efficiency</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {((stats.totalActualRevenue / stats.totalPotentialRevenue) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalActualRevenue)} actual revenue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy Details</TabsTrigger>
          <TabsTrigger value="opportunity">Opportunity Loss</TabsTrigger>
          <TabsTrigger value="performance">Performance Ranking</TabsTrigger>
        </TabsList>        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Unit Status Distribution</span>
                </CardTitle>
                <CardDescription>Current status across all properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Occupied</span>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-600">
                          {stats.occupiedUnits}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {((stats.occupiedUnits / stats.totalUnits) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vacant</span>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-600">
                          {stats.vacantUnits}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {((stats.vacantUnits / stats.totalUnits) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Maintenance</span>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-red-600">
                          {stats.maintenanceUnits}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {((stats.maintenanceUnits / stats.totalUnits) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reserved</span>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-600">
                          {stats.reservedUnits}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {((stats.reservedUnits / stats.totalUnits) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Performance Highlights</span>
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Best Performing</span>
                      <span className="font-semibold text-green-600">{stats.bestPerformingProperty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Needs Attention</span>
                      <span className="font-semibold text-red-600">{stats.worstPerformingProperty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Rent per sqm</span>
                      <span className="font-semibold">{formatCurrency(stats.averageRentPerSqm)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Properties</span>
                      <span className="font-semibold">{stats.totalProperties}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>   
     <TabsContent value="occupancy" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Property Occupancy Report</span>
                  </CardTitle>
                  <CardDescription>
                    {occupancyData.length} properties analyzed
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportOccupancyReport("csv")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportOccupancyReport("pdf")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {occupancyData.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your filters or check back later.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {occupancyData.map((property) => (
                    <Card key={property.property.id} className="border-l-4 border-l-blue-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{property.property.propertyName}</CardTitle>
                            <CardDescription>
                              {property.property.propertyCode} • {property.property.propertyType} • {property.property.address}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {property.occupancy.occupancyRate}%
                            </div>
                            <div className="text-xs text-muted-foreground">Occupancy Rate</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          {/* Unit Statistics */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Unit Distribution</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Total Units</span>
                                <span className="font-medium">{property.occupancy.totalUnits}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center space-x-2">
                                  <div className="h-2 w-2 rounded-full bg-green-600" />
                                  <span>Occupied</span>
                                </span>
                                <span className="font-medium">{property.occupancy.occupiedUnits}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center space-x-2">
                                  <div className="h-2 w-2 rounded-full bg-yellow-600" />
                                  <span>Vacant</span>
                                </span>
                                <span className="font-medium">{property.occupancy.vacantUnits}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center space-x-2">
                                  <div className="h-2 w-2 rounded-full bg-red-600" />
                                  <span>Maintenance</span>
                                </span>
                                <span className="font-medium">{property.occupancy.maintenanceUnits}</span>
                              </div>
                            </div>
                          </div>

                          {/* Area Statistics */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Area Analysis</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Total Area</span>
                                <span className="font-medium">{property.area.totalArea.toLocaleString()} sqm</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Occupied Area</span>
                                <span className="font-medium">{property.area.occupiedArea.toLocaleString()} sqm</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Area Occupancy</span>
                                <span className="font-medium text-blue-600">{property.area.areaOccupancyRate}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Revenue Statistics */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Revenue Impact</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Potential Revenue</span>
                                <span className="font-medium">{formatCurrency(property.revenue.potentialRevenue)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Actual Revenue</span>
                                <span className="font-medium text-green-600">{formatCurrency(property.revenue.actualRevenue)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Opportunity Loss</span>
                                <span className="font-medium text-red-600">{formatCurrency(property.revenue.opportunityLoss)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Loss Percentage</span>
                                <span className="font-medium text-red-600">{property.revenue.opportunityLossPercentage}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <Progress value={property.occupancy.occupancyRate} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0%</span>
                            <span>{property.occupancy.occupancyRate}% Occupied</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent> 
       <TabsContent value="opportunity" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5" />
                    <span>Opportunity Loss Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    {opportunityLossData.length > 0 ? `${opportunityLossData.length} properties analyzed` : "Select date range to analyze opportunity loss"}
                  </CardDescription>
                </div>
                {opportunityLossData.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportOpportunityLoss("csv")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportOpportunityLoss("pdf")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {opportunityLossData.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Select Analysis Period</h3>
                  <p className="mt-2 text-muted-foreground">
                    Use the filters to select a date range for opportunity loss analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {opportunityLossData.map((property) => (
                    <Card key={property.property.id} className="border-l-4 border-l-red-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{property.property.propertyName}</CardTitle>
                            <CardDescription>
                              {property.property.propertyCode} • {format(property.period.startDate, "MMM dd")} - {format(property.period.endDate, "MMM dd, yyyy")} ({property.period.totalDays} days)
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {formatCurrency(property.loss.totalOpportunityLoss)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Loss</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          {/* Lost Days */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Lost Days Analysis</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Vacant Days</span>
                                <span className="font-medium text-yellow-600">{property.loss.vacantDays}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Maintenance Days</span>
                                <span className="font-medium text-red-600">{property.loss.maintenanceDays}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Total Lost Days</span>
                                <span className="font-medium">{property.loss.totalLostDays}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Loss Percentage</span>
                                <span className="font-medium text-red-600">
                                  {((property.loss.totalLostDays / property.period.totalDays) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Financial Impact */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Financial Impact</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Daily Potential</span>
                                <span className="font-medium">{formatCurrency(property.loss.dailyPotentialRevenue)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Vacancy Loss</span>
                                <span className="font-medium text-yellow-600">{formatCurrency(property.loss.vacancyLoss)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Maintenance Loss</span>
                                <span className="font-medium text-red-600">{formatCurrency(property.loss.maintenanceLoss)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Unit Breakdown */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Unit Impact</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Total Units</span>
                                <span className="font-medium">{property.units.length}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Units with Loss</span>
                                <span className="font-medium text-red-600">
                                  {property.units.filter(unit => unit.unitOpportunityLoss > 0).length}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Avg Loss per Unit</span>
                                <span className="font-medium">
                                  {formatCurrency(property.loss.totalOpportunityLoss / property.units.length)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Period Utilization</span>
                            <span>{((property.period.totalDays - property.loss.totalLostDays) / property.period.totalDays * 100).toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={((property.period.totalDays - property.loss.totalLostDays) / property.period.totalDays) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>        
        <TabsContent value="performance" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Property Performance Ranking</span>
                  </CardTitle>
                  <CardDescription>
                    {performanceData.length} properties ranked by performance metrics
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPerformanceReport("csv")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPerformanceReport("pdf")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {performanceData.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No performance data</h3>
                  <p className="mt-2 text-muted-foreground">
                    Performance data will appear here once properties are analyzed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Property</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Occupancy</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Opportunity Loss</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Rent/sqm</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Rankings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((property) => (
                        <tr key={property.property.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                                <Building className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{property.property.propertyName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {property.property.propertyCode} • {property.property.propertyType}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium">{property.performance.occupancyRate}%</div>
                            <div className="text-xs text-muted-foreground">
                              Area: {property.performance.areaOccupancyRate}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(property.performance.totalRevenue)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              of {formatCurrency(property.performance.potentialRevenue)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium text-red-600">
                              {formatCurrency(property.performance.opportunityLoss)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {property.performance.opportunityLossPercentage}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium">
                              {formatCurrency(property.performance.averageRentPerSqm)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  property.ranking.occupancyRank <= 3 ? 'border-green-600 text-green-600' : 
                                  property.ranking.occupancyRank <= 6 ? 'border-yellow-600 text-yellow-600' : 
                                  'border-red-600 text-red-600'
                                }`}
                              >
                                #{property.ranking.occupancyRank} Occ
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  property.ranking.revenueRank <= 3 ? 'border-green-600 text-green-600' : 
                                  property.ranking.revenueRank <= 6 ? 'border-yellow-600 text-yellow-600' : 
                                  'border-red-600 text-red-600'
                                }`}
                              >
                                #{property.ranking.revenueRank} Rev
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  property.ranking.efficiencyRank <= 3 ? 'border-green-600 text-green-600' : 
                                  property.ranking.efficiencyRank <= 6 ? 'border-yellow-600 text-yellow-600' : 
                                  'border-red-600 text-red-600'
                                }`}
                              >
                                #{property.ranking.efficiencyRank} Eff
                              </Badge>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}