"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Download, 
  Filter, 
  Building,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  getLeaseManagementReport,
  getLeaseExpirationReport,
  getMultiUnitLeaseReport,
  getLeasingStats,
  type LeaseReportData,
  type LeaseExpirationData,
  type MultiUnitLeaseData
} from "@/lib/actions/leasing-reports-actions"
import { LeaseStatus } from "@prisma/client"
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/utils/export-utils"

interface LeasingFilters {
  startDate: string
  endDate: string
  status: LeaseStatus | "all"
  propertyId: string
  expirationDays: number
}

interface LeasingStats {
  totalLeases: number
  activeLeases: number
  expiredLeases: number
  pendingLeases: number
  terminatedLeases: number
  expiringSoon: number
  multiUnitLeases: number
  totalRentValue: number
  averageLeaseLength: number
  occupancyRate: number
}

function getLeaseStatusColor(status: LeaseStatus) {
  switch (status) {
    case "ACTIVE": return "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
    case "PENDING": return "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
    case "TERMINATED": return "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
    case "EXPIRED": return "bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
    default: return "bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function LeasingReportsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [stats, setStats] = useState<LeasingStats | null>(null)
  const [leaseData, setLeaseData] = useState<LeaseReportData[]>([])
  const [expirationData, setExpirationData] = useState<LeaseExpirationData[]>([])
  const [multiUnitData, setMultiUnitData] = useState<MultiUnitLeaseData[]>([])
  
  const [filters, setFilters] = useState<LeasingFilters>({
    startDate: "",
    endDate: "",
    status: "all",
    propertyId: "",
    expirationDays: 90,
  })

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== "" && value !== "all" && value !== 90
  )

  useEffect(() => {
    fetchAllData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [statsResult, leaseResult, expirationResult, multiUnitResult] = await Promise.all([
        getLeasingStats(),
        getLeaseManagementReport(),
        getLeaseExpirationReport(filters.expirationDays),
        getMultiUnitLeaseReport(),
      ])

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      if (leaseResult.success && leaseResult.data) {
        setLeaseData(leaseResult.data)
      }

      if (expirationResult.success && expirationResult.data) {
        setExpirationData(expirationResult.data)
      }

      if (multiUnitResult.success && multiUnitResult.data) {
        setMultiUnitData(multiUnitResult.data)
      }
    } catch (error) {
      console.error("Error fetching leasing data:", error)
      toast.error("Failed to load leasing reports")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = async () => {
    setIsLoading(true)
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : undefined
      const endDate = filters.endDate ? new Date(filters.endDate) : undefined
      const status = filters.status !== "all" ? filters.status : undefined
      const propertyId = filters.propertyId || undefined

      const [leaseResult, expirationResult] = await Promise.all([
        getLeaseManagementReport(startDate, endDate, status, propertyId),
        getLeaseExpirationReport(filters.expirationDays),
      ])

      if (leaseResult.success && leaseResult.data) {
        setLeaseData(leaseResult.data)
      }

      if (expirationResult.success && expirationResult.data) {
        setExpirationData(expirationResult.data)
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
      startDate: "",
      endDate: "",
      status: "all",
      propertyId: "",
      expirationDays: 90,
    })
    fetchAllData()
  }

  const exportLeaseManagement = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "tenant.bpCode", label: "BP Code" },
      { key: "tenant.businessName", label: "Business Name" },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "totalRentAmount", label: "Total Rent", type: "currency" },
      { key: "securityDeposit", label: "Security Deposit", type: "currency" },
      { key: "status", label: "Status" },
      { key: "units.length", label: "Unit Count", type: "number" },
    ]

    const exportData = leaseData.map(lease => ({
      ...lease,
      "units.length": lease.units.length,
    }))

    if (format === "csv") {
      exportToCSV(exportData, columns, "lease_management_report")
    } else {
      exportToPDF(exportData, columns, "Lease Management Report", "lease_management_report")
    }
  }

  const exportLeaseExpiration = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "tenant.bpCode", label: "BP Code" },
      { key: "tenant.businessName", label: "Business Name" },
      { key: "endDate", label: "Expiration Date", type: "date" },
      { key: "daysUntilExpiry", label: "Days Until Expiry", type: "number" },
      { key: "totalRentAmount", label: "Monthly Rent", type: "currency" },
      { key: "units.length", label: "Unit Count", type: "number" },
    ]

    const exportData = expirationData.map(lease => ({
      ...lease,
      "units.length": lease.units.length,
    }))

    if (format === "csv") {
      exportToCSV(exportData, columns, "lease_expiration_report")
    } else {
      exportToPDF(exportData, columns, "Lease Expiration Report", "lease_expiration_report")
    }
  }

  const exportMultiUnit = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "tenant.bpCode", label: "BP Code" },
      { key: "tenant.businessName", label: "Business Name" },
      { key: "unitCount", label: "Unit Count", type: "number" },
      { key: "totalArea", label: "Total Area (sqm)", type: "number" },
      { key: "totalRentAmount", label: "Total Rent", type: "currency" },
      { key: "averageRentPerSqm", label: "Rent per sqm", type: "currency" },
      { key: "status", label: "Status" },
    ]

    if (format === "csv") {
      exportToCSV(multiUnitData, columns, "multi_unit_lease_report")
    } else {
      exportToPDF(multiUnitData, columns, "Multi-Unit Lease Report", "multi_unit_lease_report")
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
          <h2 className="text-3xl font-bold tracking-tight">Leasing Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive lease management and analysis reports
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
                <SheetTitle>Filter Leasing Reports</SheetTitle>
                <SheetDescription>
                  Apply filters to customize your leasing reports
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lease Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as LeaseStatus | "all" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value={LeaseStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={LeaseStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={LeaseStatus.EXPIRED}>Expired</SelectItem>
                      <SelectItem value={LeaseStatus.TERMINATED}>Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiration Days */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiration Alert (Days)</label>
                  <Input
                    type="number"
                    value={filters.expirationDays}
                    onChange={(e) => setFilters(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 90 }))}
                    placeholder="90"
                  />
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
              <CardTitle className="text-sm font-medium">Total Leases</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalLeases}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeLeases} active leases
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-600/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">
                Within 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rent Value</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-600/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.totalRentValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly active rent
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center">
                <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                Current occupancy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="management">Lease Management</TabsTrigger>
          <TabsTrigger value="expiration">Expiration Report</TabsTrigger>
          <TabsTrigger value="multi-unit">Multi-Unit Leases</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Lease Status Distribution</span>
                </CardTitle>
                <CardDescription>Current status of all leases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active</span>
                      <Badge className="bg-green-600">
                        {stats.activeLeases}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <Badge className="bg-yellow-600">
                        {stats.pendingLeases}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expired</span>
                      <Badge className="bg-gray-600">
                        {stats.expiredLeases}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Terminated</span>
                      <Badge className="bg-red-600">
                        {stats.terminatedLeases}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Lease Metrics</span>
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Multi-Unit Leases</span>
                      <span className="font-semibold">{stats.multiUnitLeases}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Lease Length</span>
                      <span className="font-semibold">{stats.averageLeaseLength} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Occupancy Rate</span>
                      <span className="font-semibold">{stats.occupancyRate}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Lease Management Report</span>
                  </CardTitle>
                  <CardDescription>
                    {leaseData.length} leases found
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportLeaseManagement("csv")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportLeaseManagement("pdf")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leaseData.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No leases found</h3>
                  <p className="mt-2 text-muted-foreground">
                    Try adjusting your filters or check back later.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Period</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Rent Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaseData.map((lease) => (
                        <tr key={lease.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                                <Users className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{lease.tenant.businessName}</div>
                                <div className="text-xs text-muted-foreground">{lease.tenant.bpCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div>{format(lease.startDate, "MMM dd, yyyy")}</div>
                              <div className="text-xs text-muted-foreground">
                                to {format(lease.endDate, "MMM dd, yyyy")}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${getLeaseStatusColor(lease.status)} text-xs`}>
                              {lease.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold text-sm">
                              {formatCurrency(lease.totalRentAmount)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium">{lease.units.length}</span>
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

        <TabsContent value="expiration" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Lease Expiration Report</span>
                  </CardTitle>
                  <CardDescription>
                    {expirationData.length} leases expiring within {filters.expirationDays} days
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportLeaseExpiration("csv")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportLeaseExpiration("pdf")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {expirationData.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                  <h3 className="mt-4 text-lg font-semibold">No expiring leases</h3>
                  <p className="mt-2 text-muted-foreground">
                    All leases are current within the selected timeframe.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Expiration Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Days Left</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Monthly Rent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expirationData.map((lease) => (
                        <tr key={lease.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                                <Users className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{lease.tenant.businessName}</div>
                                <div className="text-xs text-muted-foreground">{lease.tenant.bpCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              {format(lease.endDate, "MMM dd, yyyy")}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              className={`text-xs ${
                                lease.isExpired 
                                  ? "bg-red-600" 
                                  : lease.isExpiringSoon 
                                    ? "bg-orange-600" 
                                    : "bg-yellow-600"
                              }`}
                            >
                              {lease.isExpired ? "Expired" : lease.isExpiringSoon ? "Expiring Soon" : "Upcoming"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-medium ${
                              lease.daysUntilExpiry < 0 ? "text-red-600" : 
                              lease.daysUntilExpiry <= 30 ? "text-orange-600" : 
                              "text-muted-foreground"
                            }`}>
                              {lease.daysUntilExpiry < 0 ? `${Math.abs(lease.daysUntilExpiry)} days ago` : `${lease.daysUntilExpiry} days`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold text-sm">
                              {formatCurrency(lease.totalRentAmount)}
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

        <TabsContent value="multi-unit" className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Multi-Unit Lease Report</span>
                  </CardTitle>
                  <CardDescription>
                    {multiUnitData.length} tenants with multiple units
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportMultiUnit("csv")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportMultiUnit("pdf")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {multiUnitData.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No multi-unit leases</h3>
                  <p className="mt-2 text-muted-foreground">
                    All current leases are for single units only.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Units</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Area</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Rent</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Rent/sqm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiUnitData.map((lease) => (
                        <tr key={lease.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                                <Users className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{lease.tenant.businessName}</div>
                                <div className="text-xs text-muted-foreground">{lease.tenant.bpCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${getLeaseStatusColor(lease.status)} text-xs`}>
                              {lease.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium">{lease.unitCount}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm">{lease.totalArea.toLocaleString()} sqm</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold text-sm">
                              {formatCurrency(lease.totalRentAmount)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm">
                              {formatCurrency(lease.averageRentPerSqm)}
                            </span>
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