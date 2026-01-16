"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MaintenanceCategory, Priority } from "@prisma/client"

/**
 * RWO Filters Component
 * Add property, priority, and category filters
 * Requirements: 2.9
 */

interface PropertyOption {
  id: string
  propertyName: string
}

interface RWOFiltersProps {
  properties: PropertyOption[]
}

const categoryOptions = [
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "APPLIANCE", label: "Appliance" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "OTHER", label: "Other" },
]

const priorityOptions = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
]

export function RWOFilters({ properties }: RWOFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentProperty = searchParams.get("property") || ""
  const currentPriority = searchParams.get("priority") || ""
  const currentCategory = searchParams.get("category") || ""

  const hasFilters = currentProperty || currentPriority || currentCategory

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("?")
  }

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Property Filter */}
        <div className="w-[200px]">
          <Select
            value={currentProperty || "all"}
            onValueChange={(value) => updateFilter("property", value)}
          >
            <SelectTrigger>
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
        </div>

        {/* Priority Filter */}
        <div className="w-[160px]">
          <Select
            value={currentPriority || "all"}
            onValueChange={(value) => updateFilter("priority", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="w-[160px]">
          <Select
            value={currentCategory || "all"}
            onValueChange={(value) => updateFilter("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {currentProperty && (
            <Badge variant="secondary" className="gap-1">
              Property: {properties.find(p => p.id === currentProperty)?.propertyName}
              <button
                onClick={() => removeFilter("property")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {currentPriority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {priorityOptions.find(p => p.value === currentPriority)?.label}
              <button
                onClick={() => removeFilter("priority")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {currentCategory && (
            <Badge variant="secondary" className="gap-1">
              Category: {categoryOptions.find(c => c.value === currentCategory)?.label}
              <button
                onClick={() => removeFilter("category")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
