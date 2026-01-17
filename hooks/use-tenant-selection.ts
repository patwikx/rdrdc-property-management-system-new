import { useState, useCallback } from 'react'

interface UseTenantSelectionReturn {
  selectedTenantIds: Set<string>
  selectAll: boolean
  toggleTenant: (tenantId: string) => void
  toggleSelectAll: (visibleTenantIds: string[]) => void
  clearSelection: () => void
  getSelectedCount: () => number
  getSelectedIds: () => string[]
}

export function useTenantSelection(): UseTenantSelectionReturn {
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const toggleTenant = useCallback((tenantId: string) => {
    setSelectedTenantIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId)
        setSelectAll(false)
      } else {
        newSet.add(tenantId)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback((visibleTenantIds: string[]) => {
    setSelectAll((prev) => {
      const newSelectAll = !prev
      if (newSelectAll) {
        // Select all visible tenants
        setSelectedTenantIds(new Set(visibleTenantIds))
      } else {
        // Deselect all
        setSelectedTenantIds(new Set())
      }
      return newSelectAll
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTenantIds(new Set())
    setSelectAll(false)
  }, [])

  const getSelectedCount = useCallback(() => {
    return selectedTenantIds.size
  }, [selectedTenantIds])

  const getSelectedIds = useCallback(() => {
    return Array.from(selectedTenantIds)
  }, [selectedTenantIds])

  return {
    selectedTenantIds,
    selectAll,
    toggleTenant,
    toggleSelectAll,
    clearSelection,
    getSelectedCount,
    getSelectedIds,
  }
}
