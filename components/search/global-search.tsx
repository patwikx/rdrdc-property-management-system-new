"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Building2, Users, Home, FileText, Receipt, Loader2 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { searchAllRecords, type SearchResult, type SearchResultType } from "@/lib/actions/search"

const getResultIcon = (type: SearchResultType) => {
  switch (type) {
    case 'property':
      return Building2
    case 'tenant':
      return Users
    case 'unit':
      return Home
    case 'property-title':
      return FileText
    case 'document':
      return Receipt
    default:
      return FileText
  }
}

const getResultTypeLabel = (type: SearchResultType): string => {
  switch (type) {
    case 'property':
      return 'Property'
    case 'tenant':
      return 'Tenant'
    case 'unit':
      return 'Unit'
    case 'property-title':
      return 'Title'
    case 'document':
      return 'Document'
    default:
      return 'Item'
  }
}

const getResultTypeBadgeVariant = (type: SearchResultType): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case 'property':
      return 'default'
    case 'tenant':
      return 'secondary'
    case 'unit':
      return 'outline'
    case 'property-title':
      return 'secondary'
    case 'document':
      return 'outline'
    default:
      return 'outline'
  }
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  // Debounced search
  React.useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim() && query.length >= 2) {
        setIsLoading(true)
        try {
          const searchResults = await searchAllRecords(query)
          setResults(searchResults)
        } catch (error) {
          console.error('Search error:', error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery("")
    setResults([])
    router.push(result.url)
  }

  const groupedResults = React.useMemo(() => {
    const groups: Record<SearchResultType, SearchResult[]> = {
      'property': [],
      'tenant': [],
      'unit': [],
      'property-title': [],
      'document': []
    }

    results.forEach(result => {
      groups[result.type].push(result)
    })

    return Object.entries(groups).filter(([, items]) => items.length > 0)
  }, [results])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search everything...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search properties, tenants, units, titles, documents..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          )}
          
          {!isLoading && query && results.length === 0 && (
            <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
          )}

          {!isLoading && groupedResults.map(([type, items]) => {
            const typeLabel = getResultTypeLabel(type as SearchResultType)
            
            return (
              <CommandGroup key={type} heading={`${typeLabel}s`}>
                {items.map((result) => {
                  const ResultIcon = getResultIcon(result.type)
                  return (
                    <CommandItem
                      key={result.id}
                      value={`${result.title} ${result.subtitle || ''}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 px-3 py-3"
                    >
                      <ResultIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.title}</span>
                          <Badge variant={getResultTypeBadgeVariant(result.type)} className="text-xs">
                            {getResultTypeLabel(result.type)}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                        )}
                        {/* Additional context based on type */}
                        {'propertyCode' in result && (
                          <p className="text-xs text-muted-foreground">Code: {result.propertyCode}</p>
                        )}
                        {'bpCode' in result && (
                          <p className="text-xs text-muted-foreground">BP: {result.bpCode}</p>
                        )}
                        {'titleNo' in result && (
                          <p className="text-xs text-muted-foreground">Title: {result.titleNo}</p>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
}