"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { X, Filter } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
      <div className="flex flex-wrap items-center gap-0 border border-border bg-muted/5 p-1">
        <div className="flex items-center px-3 py-2 text-muted-foreground border-r border-border/50">
          <Filter className="h-4 w-4" />
        </div>
        
        {/* Property Filter */}
        <div className="w-[200px] border-r border-border/50">
          <Select
            value={currentProperty || "all"}
            onValueChange={(value) => updateFilter("property", value)}
          >
            <SelectTrigger className="border-none shadow-none rounded-none h-9 focus:ring-0 bg-transparent">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="rounded-none font-mono">ALL PROPERTIES</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id} className="rounded-none font-mono">
                  {property.propertyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="w-[160px] border-r border-border/50">
          <Select
            value={currentPriority || "all"}
            onValueChange={(value) => updateFilter("priority", value)}
          >
            <SelectTrigger className="border-none shadow-none rounded-none h-9 focus:ring-0 bg-transparent">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="rounded-none font-mono">ALL PRIORITIES</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-none font-mono">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="w-[160px] border-r border-border/50">
          <Select
            value={currentCategory || "all"}
            onValueChange={(value) => updateFilter("category", value)}
          >
            <SelectTrigger className="border-none shadow-none rounded-none h-9 focus:ring-0 bg-transparent">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="rounded-none font-mono">ALL CATEGORIES</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-none font-mono">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="ml-auto rounded-none text-xs h-9 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            CLEAR
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {currentProperty && (
            <Badge variant="outline" className="gap-1 rounded-none border-border bg-background">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">PROPERTY:</span>
              <span className="font-mono font-bold text-xs">{properties.find(p => p.id === currentProperty)?.propertyName}</span>
              <button onClick={() => removeFilter("property")} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {currentPriority && (
            <Badge variant="outline" className="gap-1 rounded-none border-border bg-background">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">PRIORITY:</span>
              <span className="font-mono font-bold text-xs">{priorityOptions.find(p => p.value === currentPriority)?.label}</span>
              <button onClick={() => removeFilter("priority")} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {currentCategory && (
            <Badge variant="outline" className="gap-1 rounded-none border-border bg-background">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">CATEGORY:</span>
              <span className="font-mono font-bold text-xs">{categoryOptions.find(c => c.value === currentCategory)?.label}</span>
              <button onClick={() => removeFilter("category")} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
