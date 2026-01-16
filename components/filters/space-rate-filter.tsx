"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { UnitSortBy, SortOrder } from "@/lib/actions/units-actions"

export interface SpaceRateFilterProps {
  minRate?: number
  maxRate?: number
  sortBy?: UnitSortBy
  sortOrder?: SortOrder
  onFilterChange: (filters: {
    minRate?: number
    maxRate?: number
    sortBy?: UnitSortBy
    sortOrder?: SortOrder
  }) => void
}

export function SpaceRateFilter({
  minRate,
  maxRate,
  sortBy = 'name',
  sortOrder = 'asc',
  onFilterChange,
}: SpaceRateFilterProps) {
  const [localMinRate, setLocalMinRate] = useState<string>(minRate?.toString() || '')
  const [localMaxRate, setLocalMaxRate] = useState<string>(maxRate?.toString() || '')
  const [isOpen, setIsOpen] = useState(false)

  // Sync local state with props
  useEffect(() => {
    setLocalMinRate(minRate?.toString() || '')
    setLocalMaxRate(maxRate?.toString() || '')
  }, [minRate, maxRate])

  const handleApplyRateFilter = () => {
    const min = localMinRate ? parseFloat(localMinRate) : undefined
    const max = localMaxRate ? parseFloat(localMaxRate) : undefined
    onFilterChange({ minRate: min, maxRate: max, sortBy, sortOrder })
    setIsOpen(false)
  }

  const handleClearRateFilter = () => {
    setLocalMinRate('')
    setLocalMaxRate('')
    onFilterChange({ minRate: undefined, maxRate: undefined, sortBy, sortOrder })
    setIsOpen(false)
  }

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-') as [UnitSortBy, SortOrder]
    onFilterChange({ minRate, maxRate, sortBy: newSortBy, sortOrder: newSortOrder })
  }

  const hasRateFilter = minRate !== undefined || maxRate !== undefined
  const currentSortValue = `${sortBy}-${sortOrder}`

  // Format rate range for display - Requirement 3.3
  const getRateRangeDisplay = () => {
    if (minRate !== undefined && maxRate !== undefined) {
      return `₱${minRate.toLocaleString()} - ₱${maxRate.toLocaleString()}`
    }
    if (minRate !== undefined) {
      return `Min: ₱${minRate.toLocaleString()}`
    }
    if (maxRate !== undefined) {
      return `Max: ₱${maxRate.toLocaleString()}`
    }
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sort by Rate - Requirement 3.1 */}
      <Select value={currentSortValue} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="rate-desc">Rate (High to Low)</SelectItem>
          <SelectItem value="rate-asc">Rate (Low to High)</SelectItem>
          <SelectItem value="area-desc">Area (Large to Small)</SelectItem>
          <SelectItem value="area-asc">Area (Small to Large)</SelectItem>
          <SelectItem value="status-asc">Status (A-Z)</SelectItem>
          <SelectItem value="status-desc">Status (Z-A)</SelectItem>
        </SelectContent>
      </Select>

      {/* Rate Range Filter - Requirement 3.2 */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={hasRateFilter ? "default" : "outline"} 
            size="sm"
            className="gap-2"
          >
            Rate Range
            {hasRateFilter && (
              <span className="text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded">
                {getRateRangeDisplay()}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Rate Range Filter</h4>
              <p className="text-sm text-muted-foreground">
                Filter spaces by monthly rent range
              </p>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minRate">Minimum Rate (₱)</Label>
                <Input
                  id="minRate"
                  type="number"
                  placeholder="0"
                  value={localMinRate}
                  onChange={(e) => setLocalMinRate(e.target.value)}
                  min={0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxRate">Maximum Rate (₱)</Label>
                <Input
                  id="maxRate"
                  type="number"
                  placeholder="No limit"
                  value={localMaxRate}
                  onChange={(e) => setLocalMaxRate(e.target.value)}
                  min={0}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearRateFilter}
                disabled={!hasRateFilter && !localMinRate && !localMaxRate}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button size="sm" onClick={handleApplyRateFilter}>
                Apply Filter
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear rate filter button when active - Requirement 3.4 */}
      {hasRateFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearRateFilter}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
