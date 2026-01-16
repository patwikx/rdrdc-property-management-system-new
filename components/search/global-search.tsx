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
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-64 xl:justify-start xl:px-4 xl:py-2 rounded-none border-border bg-background hover:bg-muted/10 font-mono text-muted-foreground transition-all"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-3" />
        <span className="hidden xl:inline-flex text-xs uppercase tracking-widest">Search_Database...</span>
        <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-5 select-none items-center gap-1 bg-muted/20 px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="QUERY_DATABASE..."
          value={query}
          onValueChange={setQuery}
          className="font-mono text-xs uppercase tracking-wider rounded-none border-none focus:ring-0"
        />
        <CommandList className="rounded-none border-t border-border bg-background">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-3 text-xs font-mono text-muted-foreground uppercase tracking-widest">Scanning...</span>
            </div>
          )}
          
          {!isLoading && query && results.length === 0 && (
            <CommandEmpty className="py-8 font-mono text-xs text-muted-foreground uppercase tracking-widest">No_Data_Found</CommandEmpty>
          )}

          {!isLoading && groupedResults.map(([type, items]) => {
            const typeLabel = getResultTypeLabel(type as SearchResultType)
            
            return (
              <CommandGroup key={type} heading={typeLabel.toUpperCase()} className="font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground/70">
                {items.map((result) => {
                  const ResultIcon = getResultIcon(result.type)
                  return (
                    <CommandItem
                      key={result.id}
                      value={`${result.title} ${result.subtitle || ''}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3 px-3 py-3 rounded-none aria-selected:bg-primary/10 aria-selected:text-primary group border-l-2 border-transparent aria-selected:border-primary transition-colors cursor-pointer"
                    >
                      <ResultIcon className="h-4 w-4 text-muted-foreground group-aria-selected:text-primary" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm tracking-tight">{result.title}</span>
                          <Badge variant="outline" className="text-[9px] rounded-none border-border h-4 px-1 font-normal text-muted-foreground">
                            {getResultTypeLabel(result.type).toUpperCase()}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground group-aria-selected:text-primary/70 font-mono">{result.subtitle}</p>
                        )}
                        {/* Additional context based on type */}
                        {'propertyCode' in result && (
                          <p className="text-[10px] text-muted-foreground/50 font-mono">CODE: {result.propertyCode}</p>
                        )}
                        {'bpCode' in result && (
                          <p className="text-[10px] text-muted-foreground/50 font-mono">BP: {result.bpCode}</p>
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