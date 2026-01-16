import { Home, History, Receipt, Wrench, FileText, Zap } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { cn } from "@/lib/utils"

interface UnitTabsProps {
  unit: UnitWithDetails
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function UnitTabs({ unit, activeTab, setActiveTab }: UnitTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'history', label: `History (${unit.leaseUnits.length})`, icon: History },
    { id: 'taxes', label: `Taxes (${unit.unitTaxes.length})`, icon: Receipt },
    { id: 'utilities', label: `Utilities (${unit.utilityAccounts.length})`, icon: Zap },
    { id: 'maintenance', label: `Repair Work Orders (${unit.maintenanceRequests.length})`, icon: Wrench },
    { id: 'documents', label: `Documents (${unit.documents.length})`, icon: FileText },
  ]

  return (
    <div className="border-b w-full overflow-x-auto">
      <nav className="flex space-x-6 min-w-full px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}