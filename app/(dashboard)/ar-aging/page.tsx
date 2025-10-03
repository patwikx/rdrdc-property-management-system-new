"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Loader2, 
  AlertTriangle, 
  Search, 
  RefreshCw,
  Building2,
  DollarSign,
  FileText,
  Filter,
  X,
  TrendingUp,
  CheckCircle
} from "lucide-react"

interface ARAgingTenant {
  cardCode: string;
  cardName: string;
  totalBalance: number;
  currentAmount: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  over90Days: number;
  monthlyRent: number;
  securityDeposit: number;
}

interface ARAgingResponse {
  success: boolean;
  data: ARAgingTenant[];
  error?: string;
}

type TenantStatus = 'OK' | '1ST NOTICE' | '2ND NOTICE' | '3RD NOTICE' | 'EVICTION' | 'DEMAND LETTER';

interface FilterState {
  status: string
  minBalance: string
  maxBalance: string
  minMonths: string
  maxMonths: string
}

export default function ARAgingPage() {
  const [tenants, setTenants] = useState<ARAgingTenant[]>([])
  const [filteredTenants, setFilteredTenants] = useState<ARAgingTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    minBalance: "",
    maxBalance: "",
    minMonths: "",
    maxMonths: "",
  })

  useEffect(() => {
    fetchARAgingData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, searchQuery, tenants])

  const applyFilters = () => {
    let filtered = [...tenants]

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        tenant =>
          tenant.cardName.toLowerCase().includes(query) ||
          tenant.cardCode.toLowerCase().includes(query)
      )
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(tenant => {
        const monthsOverdue = calculateMonthsOverdue(tenant.totalBalance, tenant.monthlyRent)
        const { status } = getStatusInfo(monthsOverdue)
        return status === filters.status
      })
    }

    if (filters.minBalance) {
      const min = parseFloat(filters.minBalance)
      filtered = filtered.filter(tenant => tenant.totalBalance >= min)
    }
    if (filters.maxBalance) {
      const max = parseFloat(filters.maxBalance)
      filtered = filtered.filter(tenant => tenant.totalBalance <= max)
    }

    if (filters.minMonths) {
      const min = parseFloat(filters.minMonths)
      filtered = filtered.filter(tenant => {
        const months = calculateMonthsOverdue(tenant.totalBalance, tenant.monthlyRent)
        return months >= min
      })
    }
    if (filters.maxMonths) {
      const max = parseFloat(filters.maxMonths)
      filtered = filtered.filter(tenant => {
        const months = calculateMonthsOverdue(tenant.totalBalance, tenant.monthlyRent)
        return months <= max
      })
    }

    setFilteredTenants(filtered)
  }

  const clearFilters = () => {
    setFilters({
      status: "all",
      minBalance: "",
      maxBalance: "",
      minMonths: "",
      maxMonths: "",
    })
    setSearchQuery("")
  }

  const hasActiveFilters = 
    filters.status !== "all" ||
    filters.minBalance !== "" ||
    filters.maxBalance !== "" ||
    filters.minMonths !== "" ||
    filters.maxMonths !== "" ||
    searchQuery !== ""

  const fetchARAgingData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/ar-aging")
      const result: ARAgingResponse = await response.json()

      if (result.success) {
        setTenants(result.data)
        setFilteredTenants(result.data)
      } else {
        setError(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthsOverdue = (totalBalance: number, monthlyRent: number): number => {
    if (monthlyRent === 0) return 0
    return totalBalance / monthlyRent
  }

  const getStatusInfo = (monthsOverdue: number): { status: TenantStatus; color: string } => {
    if (monthsOverdue < 1) {
      return { status: "OK", color: "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600" }
    } else if (monthsOverdue >= 1 && monthsOverdue < 2) {
      return { status: "1ST NOTICE", color: "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600" }
    } else if (monthsOverdue >= 2 && monthsOverdue < 3) {
      return { status: "2ND NOTICE", color: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600" }
    } else if (monthsOverdue >= 3 && monthsOverdue < 4) {
      return { status: "3RD NOTICE", color: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" }
    } else if (monthsOverdue >= 4 && monthsOverdue < 6) {
      return { status: "EVICTION", color: "bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700" }
    } else {
      return { status: "DEMAND LETTER", color: "bg-red-800 hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-800" }
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const totalTenants = filteredTenants.length
  const criticalTenants = filteredTenants.filter(t => {
    const months = calculateMonthsOverdue(t.totalBalance, t.monthlyRent)
    return months >= 4
  }).length
  const okTenants = filteredTenants.filter(t => {
    const months = calculateMonthsOverdue(t.totalBalance, t.monthlyRent)
    return months < 1
  }).length
  const totalAmount = filteredTenants.reduce((sum, t) => sum + t.totalBalance, 0)

  if (loading) {
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
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AR Aging Report</h2>
          <p className="text-muted-foreground">
            Manage and track tenant receivables and payment status
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
                <SheetTitle>Filter AR Aging Report</SheetTitle>
                <SheetDescription>
                  Apply filters to narrow down the tenant receivables data
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6 ml-4 mr-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="OK">OK</SelectItem>
                      <SelectItem value="1ST NOTICE">1ST NOTICE</SelectItem>
                      <SelectItem value="2ND NOTICE">2ND NOTICE</SelectItem>
                      <SelectItem value="3RD NOTICE">3RD NOTICE</SelectItem>
                      <SelectItem value="EVICTION">EVICTION</SelectItem>
                      <SelectItem value="DEMAND LETTER">DEMAND LETTER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Balance Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Balance Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min balance"
                      value={filters.minBalance}
                      onChange={(e) => setFilters(prev => ({ ...prev, minBalance: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max balance"
                      value={filters.maxBalance}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxBalance: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Months Overdue Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Months Overdue Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min months"
                      value={filters.minMonths}
                      onChange={(e) => setFilters(prev => ({ ...prev, minMonths: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max months"
                      value={filters.maxMonths}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxMonths: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Actions</label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, status: "EVICTION" }))
                        setIsFilterOpen(false)
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                      Critical Tenants Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, status: "OK" }))
                        setIsFilterOpen(false)
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Current Tenants Only
                    </Button>
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearFilters()
                      setIsFilterOpen(false)
                    }}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Button onClick={fetchARAgingData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              All tenants tracked
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tenants</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-600/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{okTenants}</div>
            <p className="text-xs text-muted-foreground">
              No outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-600/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding receivables
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Tenants</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-600/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalTenants}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
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
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data Table */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Tenant Receivables</span>
              </CardTitle>
              <CardDescription>
                {filteredTenants.length} of {tenants.length} tenants shown
              </CardDescription>
            </div>
            {filteredTenants.length > 0 && (
              <Badge variant="outline">
                <TrendingUp className="h-3 w-3 mr-1" />
                {formatCurrency(totalAmount)} Total
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tenants found</h3>
              <p className="mt-2 text-muted-foreground">
                {hasActiveFilters ? "Try adjusting your filters." : "No tenant data available."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tenant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Monthly Rent</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Security Deposit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Balance</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">1-30 Days</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">31-60 Days</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">61-90 Days</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Over 90</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Months Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => {
                    const monthsOverdue = calculateMonthsOverdue(tenant.totalBalance, tenant.monthlyRent)
                    const { status, color } = getStatusInfo(monthsOverdue)

                    return (
                      <tr 
                        key={tenant.cardCode}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{tenant.cardName}</div>
                              <div className="text-xs text-muted-foreground">{tenant.cardCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${color} text-xs`}>{status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(tenant.monthlyRent)}</td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(tenant.securityDeposit)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-red-600 dark:text-red-400 text-sm">
                            {formatCurrency(tenant.totalBalance)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(tenant.days1To30)}</td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(tenant.days31To60)}</td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(tenant.days61To90)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm ${tenant.over90Days > 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}`}>
                            {formatCurrency(tenant.over90Days)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {formatNumber(monthsOverdue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

