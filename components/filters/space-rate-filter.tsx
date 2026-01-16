"use client"

import { useState, useEffect } from "react"
import { Filter, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SpaceRateFilterProps {
  minRate?: number
  maxRate?: number
  onFilterChange: (filters: {
    minRate?: number
    maxRate?: number
  }) => void
}

export function SpaceRateFilter({
  minRate,
  maxRate,
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
    onFilterChange({ minRate: min, maxRate: max })
    setIsOpen(false)
  }

  const handleClearRateFilter = () => {
    setLocalMinRate('')
    setLocalMaxRate('')
    onFilterChange({ minRate: undefined, maxRate: undefined })
    setIsOpen(false)
  }

  const hasRateFilter = minRate !== undefined || maxRate !== undefined

  // Format rate range for display - Requirement 3.3
  const getRateRangeDisplay = () => {
    if (minRate !== undefined && maxRate !== undefined) {
      return `₱${minRate.toLocaleString()} - ₱${maxRate.toLocaleString()}`
    }
    if (minRate !== undefined) {
      return `MIN: ₱${minRate.toLocaleString()}`
    }
    if (maxRate !== undefined) {
      return `MAX: ₱${maxRate.toLocaleString()}`
    }
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`rounded-none border-border h-10 font-mono text-xs uppercase tracking-wider ${hasRateFilter ? 'bg-primary/10 border-primary/50 text-primary' : 'hover:bg-muted'}`}
        >
          <Filter className="h-3 w-3 mr-2" />
          {hasRateFilter ? getRateRangeDisplay() : "Rate Range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-none border-border p-0" align="end">
        <div className="border-b border-border bg-muted/10 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Filter className="h-3 w-3" />
            Rate_Filter
          </span>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="minRate" className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Min Rate (₱)</Label>
              <Input
                id="minRate"
                type="number"
                placeholder="0"
                value={localMinRate}
                onChange={(e) => setLocalMinRate(e.target.value)}
                min={0}
                className="rounded-none font-mono text-xs border-border h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxRate" className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Max Rate (₱)</Label>
              <Input
                id="maxRate"
                type="number"
                placeholder="NO LIMIT"
                value={localMaxRate}
                onChange={(e) => setLocalMaxRate(e.target.value)}
                min={0}
                className="rounded-none font-mono text-xs border-border h-9"
              />
            </div>
          </div>
          <div className="flex justify-between pt-2 border-t border-dashed border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearRateFilter}
              disabled={!hasRateFilter && !localMinRate && !localMaxRate}
              className="rounded-none h-8 text-[10px] font-mono uppercase text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={handleApplyRateFilter} className="rounded-none h-8 text-[10px] font-mono uppercase bg-primary text-primary-foreground hover:bg-primary/90">
              <Check className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}