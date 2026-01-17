"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, ArrowUpDown, Filter } from "lucide-react"

interface Property {
  id: string
  propertyName: string
}

interface UtilityBillingFiltersProps {
  properties: Property[]
}

export function UtilityBillingFilters({ properties }: UtilityBillingFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentProperty = searchParams.get("property") || ""
  const currentUtilityType = searchParams.get("utilityType") || ""
  const currentStatus = searchParams.get("status") || "all"
  const currentSortBy = searchParams.get("sortBy") || "dueDate"
  const currentSortOrder = searchParams.get("sortOrder") || "asc"

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change
    params.delete("page")

    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  const clearFilters = useCallback(() => {
    router.push("?")
  }, [router])

  const hasActiveFilters = currentProperty || currentUtilityType || currentStatus !== "all"

  return (
    <div className="flex flex-col xl:flex-row gap-4 p-1 border border-border bg-muted/5 items-start xl:items-center justify-between">
      <div className="flex flex-1 flex-col sm:flex-row gap-0 w-full">
        <div className="flex items-center px-3 py-2 text-muted-foreground border-r border-border/50">
          <Filter className="h-4 w-4" />
        </div>

        {/* Property Filter */}
        <div className="w-full sm:w-[200px] border-r border-border/50">
          <Select
            value={currentProperty}
            onValueChange={(value) => updateFilters({ property: value })}
          >
            <SelectTrigger className="w-full rounded-none border-none shadow-none bg-transparent h-9 font-mono text-xs uppercase focus:ring-0">
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
        </div>

        {/* Utility Type Filter */}
        <div className="w-full sm:w-[160px] border-r border-border/50">
          <Select
            value={currentUtilityType}
            onValueChange={(value) => updateFilters({ utilityType: value })}
          >
            <SelectTrigger className="w-full rounded-none border-none shadow-none bg-transparent h-9 font-mono text-xs uppercase focus:ring-0">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Types</SelectItem>
              <SelectItem value="ELECTRICITY" className="font-mono text-xs uppercase">Electricity</SelectItem>
              <SelectItem value="WATER" className="font-mono text-xs uppercase">Water</SelectItem>
              <SelectItem value="OTHERS" className="font-mono text-xs uppercase">Others</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment Status Filter */}
        <div className="w-full sm:w-[140px] border-r border-border/50">
          <Select
            value={currentStatus}
            onValueChange={(value) => updateFilters({ status: value })}
          >
            <SelectTrigger className="w-full rounded-none border-none shadow-none bg-transparent h-9 font-mono text-xs uppercase focus:ring-0">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Status</SelectItem>
              <SelectItem value="paid" className="font-mono text-xs uppercase">Paid</SelectItem>
              <SelectItem value="unpaid" className="font-mono text-xs uppercase">Unpaid</SelectItem>
              <SelectItem value="overdue" className="font-mono text-xs uppercase">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto px-2">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select
          value={currentSortBy}
          onValueChange={(value) => updateFilters({ sortBy: value })}
        >
          <SelectTrigger className="w-[130px] rounded-none border-border bg-background h-8 font-mono text-xs uppercase">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="dueDate" className="font-mono text-xs uppercase">Due Date</SelectItem>
            <SelectItem value="amount" className="font-mono text-xs uppercase">Amount</SelectItem>
            <SelectItem value="space" className="font-mono text-xs uppercase">Space</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentSortOrder}
          onValueChange={(value) => updateFilters({ sortOrder: value })}
        >
          <SelectTrigger className="w-[120px] rounded-none border-border bg-background h-8 font-mono text-xs uppercase">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="asc" className="font-mono text-xs uppercase">Ascending</SelectItem>
            <SelectItem value="desc" className="font-mono text-xs uppercase">Descending</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 text-xs uppercase font-mono hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
