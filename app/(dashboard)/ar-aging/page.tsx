"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {  
  AlertTriangle, 
  Search, 
  RefreshCw,
  Building2,
  DollarSign,
  FileText,
  Filter,
  X,
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
  // Matched tenant data from database
  tenantId?: string;
  firstNoticeDate?: Date | null;
  secondNoticeDate?: Date | null;
  finalNoticeDate?: Date | null;
}

interface ARAgingResponse {
  success: boolean;
  data: ARAgingTenant[];
  error?: string;
}

type TenantStatus = 'OK' | 'FOR NOTICE';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      return { status: "OK", color: "border-green-500 text-green-600 bg-green-500/10" }
    } else {
      return { status: "FOR NOTICE", color: "border-yellow-500 text-yellow-600 bg-yellow-500/10" }
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
            <Skeleton className="h-8 w-48 rounded-none" />
            <Skeleton className="h-4 w-64 mt-2 rounded-none" />
          </div>
          <Skeleton className="h-9 w-24 rounded-none" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border p-4 h-24">
              <Skeleton className="h-4 w-20 mb-2 rounded-none" />
              <Skeleton className="h-8 w-16 rounded-none" />
            </div>
          ))}
        </div>
        
        <div className="border border-border p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <Alert variant="destructive" className="rounded-none border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-mono text-xs uppercase">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-mono uppercase">AR Aging Report</h2>
          <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wide">
            Receivables analysis & aging buckets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-none h-9 text-xs font-mono uppercase tracking-wider border-border">
                <Filter className="h-3 w-3 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-none p-0 flex items-center justify-center font-mono text-[10px]">
                    !
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="rounded-none border-l border-border">
              <SheetHeader className="text-left border-b border-border pb-4">
                <SheetTitle className="uppercase font-bold tracking-widest text-sm">Filter Report</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  Configure view parameters
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="rounded-none font-mono text-xs border-border">
                      <SelectValue placeholder="ALL STATUSES" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-border">
                      <SelectItem value="all" className="font-mono text-xs">ALL STATUSES</SelectItem>
                      <SelectItem value="OK" className="font-mono text-xs">OK</SelectItem>
                      <SelectItem value="FOR NOTICE" className="font-mono text-xs">FOR NOTICE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Balance Range */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Balance Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="MIN"
                      value={filters.minBalance}
                      onChange={(e) => setFilters(prev => ({ ...prev, minBalance: e.target.value }))}
                      className="rounded-none font-mono text-xs border-border"
                    />
                    <Input
                      type="number"
                      placeholder="MAX"
                      value={filters.maxBalance}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxBalance: e.target.value }))}
                      className="rounded-none font-mono text-xs border-border"
                    />
                  </div>
                </div>

                {/* Months Overdue Range */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Months Overdue</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="MIN"
                      value={filters.minMonths}
                      onChange={(e) => setFilters(prev => ({ ...prev, minMonths: e.target.value }))}
                      className="rounded-none font-mono text-xs border-border"
                    />
                    <Input
                      type="number"
                      placeholder="MAX"
                      value={filters.maxMonths}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxMonths: e.target.value }))}
                      className="rounded-none font-mono text-xs border-border"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Quick Filters</label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start rounded-none h-8 text-xs font-mono uppercase border-border"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, minMonths: "4" }))
                        setIsFilterOpen(false)
                      }}
                    >
                      <AlertTriangle className="h-3 w-3 mr-2 text-red-600" />
                      Critical (&gt;4 Months)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start rounded-none h-8 text-xs font-mono uppercase border-border"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, status: "OK" }))
                        setIsFilterOpen(false)
                      }}
                    >
                      <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                      Current Only
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
                    className="w-full mt-4 rounded-none h-9 text-xs font-mono uppercase border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                  >
                    <X className="h-3 w-3 mr-2" />
                    Reset Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <Button onClick={fetchARAgingData} size="sm" className="rounded-none h-9 text-xs font-mono uppercase tracking-wider font-bold">
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Tenants</span>
            <Building2 className="h-4 w-4 text-blue-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold tracking-tighter text-blue-600">{totalTenants}</span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">Records</span>
          </div>
        </div>

        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Current</span>
            <CheckCircle className="h-4 w-4 text-emerald-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold tracking-tighter text-emerald-600">{okTenants}</span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">Up to Date</span>
          </div>
        </div>

        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Receivables</span>
            <DollarSign className="h-4 w-4 text-purple-600/50" />
          </div>
          <div>
            <span className="text-xl font-mono font-bold tracking-tighter text-purple-600">{formatCurrency(totalAmount)}</span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">Total</span>
          </div>
        </div>

        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Critical</span>
            <AlertTriangle className="h-4 w-4 text-rose-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-bold tracking-tighter text-rose-600">{criticalTenants}</span>
            <span className="text-[10px] text-muted-foreground ml-2 font-mono uppercase tracking-wide">&gt;4 Months</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 border border-border bg-muted/5 p-1">
        <div className="flex items-center px-3 py-2 text-muted-foreground border-r border-border/50">
          <Search className="h-4 w-4" />
        </div>
        <Input
          placeholder="SEARCH TENANT NAME OR CODE..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-none border-none shadow-none bg-transparent h-9 font-mono text-xs uppercase focus-visible:ring-0 placeholder:text-muted-foreground/50 flex-1"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-transparent rounded-none mr-2"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 rounded-none px-3 text-[10px] font-mono uppercase hover:text-destructive hover:bg-destructive/10 border-l border-border/50"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className="border border-border bg-background">
        <CardContent className="p-0">
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground opacity-20 mb-2" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No Records Found</h3>
              <p className="mt-1 text-[10px] font-mono text-muted-foreground/70">
                ADJUST FILTERS TO VIEW DATA
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border hover:bg-transparent">
                    <th className="h-9 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Tenant</th>
                    <th className="h-9 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Status</th>
                    <th className="h-9 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Rent</th>
                    <th className="h-9 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Deposit</th>
                    <th className="h-9 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Balance</th>
                    <th className="h-9 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Months</th>
                    <th className="h-9 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">1st Notice</th>
                    <th className="h-9 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">2nd Notice</th>
                    <th className="h-9 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">Final Notice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => {
                    const monthsOverdue = calculateMonthsOverdue(tenant.totalBalance, tenant.monthlyRent)
                    const { status, color } = getStatusInfo(monthsOverdue)

                    const formatNoticeDate = (date: Date | null | undefined) => {
                      if (!date) return "-"
                      return new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                    }

                    return (
                      <tr 
                        key={tenant.cardCode}
                        className="border-b border-border hover:bg-muted/5 transition-colors group"
                      >
                        <td className="px-4 py-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs uppercase">{tenant.cardName}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{tenant.cardCode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="outline" className={`rounded-none font-mono text-[10px] uppercase border ${color}`}>
                            {status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-mono text-muted-foreground">{formatCurrency(tenant.monthlyRent)}</td>
                        <td className="px-4 py-2 text-right text-xs font-mono text-muted-foreground">{formatCurrency(tenant.securityDeposit)}</td>
                        <td className="px-4 py-2 text-right">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {formatCurrency(tenant.totalBalance)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-mono font-medium">
                          {formatNumber(monthsOverdue)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-[10px] font-mono ${tenant.firstNoticeDate ? 'text-yellow-600 font-semibold' : 'text-muted-foreground'}`}>
                            {formatNoticeDate(tenant.firstNoticeDate)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-[10px] font-mono ${tenant.secondNoticeDate ? 'text-orange-600 font-semibold' : 'text-muted-foreground'}`}>
                            {formatNoticeDate(tenant.secondNoticeDate)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-[10px] font-mono ${tenant.finalNoticeDate ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                            {formatNoticeDate(tenant.finalNoticeDate)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  )
}


