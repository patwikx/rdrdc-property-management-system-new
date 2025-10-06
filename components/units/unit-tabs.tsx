import { Home, User, History, Receipt, Wrench, FileText, Zap } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"

interface UnitTabsProps {
  unit: UnitWithDetails
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function UnitTabs({ unit, activeTab, setActiveTab }: UnitTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'tenant', label: 'Current Tenant', icon: User },
    { id: 'history', label: `History (${unit.leaseUnits.length})`, icon: History },
    { id: 'taxes', label: `Space Real Property Tax (${unit.unitTaxes.length})`, icon: Receipt },
    { id: 'utilities', label: `Utilities (${unit.utilityAccounts.length})`, icon: Zap },
    { id: 'maintenance', label: `Maintenance (${unit.maintenanceRequests.length})`, icon: Wrench },
    { id: 'documents', label: `Documents (${unit.documents.length})`, icon: FileText },
  ]

  return (
    <div className="border-b">
      <nav className="flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
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