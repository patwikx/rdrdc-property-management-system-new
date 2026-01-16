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
import { X, ArrowUpDown } from "lucide-react"

/**
 * UtilityBillingFilters Component
 * Provides filtering and sorting options for utility bills
 * Requirements: 1.6, 1.9
 */

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
    <div className="flex flex-wrap items-center gap-3">
      {/* Property Filter */}
      <Select
        value={currentProperty}
        onValueChange={(value) => updateFilters({ property: value })}
      >
        <SelectTrigger className="w-[180px]">
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

      {/* Utility Type Filter */}
      <Select
        value={currentUtilityType}
        onValueChange={(value) => updateFilters({ utilityType: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="ELECTRICITY">Electricity</SelectItem>
          <SelectItem value="WATER">Water</SelectItem>
          <SelectItem value="OTHERS">Others</SelectItem>
        </SelectContent>
      </Select>

      {/* Payment Status Filter */}
      <Select
        value={currentStatus}
        onValueChange={(value) => updateFilters({ status: value })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="unpaid">Unpaid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Options */}
      <div className="flex items-center gap-2 ml-auto">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select
          value={currentSortBy}
          onValueChange={(value) => updateFilters({ sortBy: value })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="space">Space</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentSortOrder}
          onValueChange={(value) => updateFilters({ sortOrder: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 px-2"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
