import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap, Droplets, Plus, Hash, Activity, FileText, Plug } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { CreateUnitUtilityForm } from "./create-unit-utility-form"
import { format } from "date-fns"

interface UnitUtilitiesProps {
  unit: UnitWithDetails
}

function getUtilityStyle(type: string) {
  switch (type) {
    case 'ELECTRICITY': return { border: 'border-l-yellow-500', icon: Plug, text: 'text-yellow-600', badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' }
    case 'WATER': return { border: 'border-l-blue-500', icon: Droplets, text: 'text-blue-600', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    case 'OTHERS': return { border: 'border-l-slate-500', icon: Zap, text: 'text-slate-600', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20' }
    default: return { border: 'border-l-muted', icon: Zap, text: 'text-muted-foreground', badge: 'bg-muted/10 text-muted-foreground border-border' }
  }
}

export function UnitUtilities({ unit }: UnitUtilitiesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleUtilityCreated = () => {
    setIsAddDialogOpen(false)
    window.location.reload()
  }

  if (unit.utilityAccounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Zap className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Utilities Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Register utility meters or accounts for this space
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <Plus className="h-3 w-3 mr-2" />
              Add Utility
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-border max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Add New Utility</DialogTitle>
            </DialogHeader>
            <CreateUnitUtilityForm
              unitId={unit.id}
              onSuccess={handleUtilityCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Space Utilities
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Total Connections: {unit.utilityAccounts.length}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              <Plus className="h-3 w-3 mr-2" />
              Add Utility
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-border max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Add New Utility</DialogTitle>
            </DialogHeader>
            <CreateUnitUtilityForm
              unitId={unit.id}
              onSuccess={handleUtilityCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {unit.utilityAccounts.map((utility) => {
          const styles = getUtilityStyle(utility.utilityType)
          const Icon = styles.icon
          
          return (
            <div key={utility.id} className={`group border border-border border-l-4 ${styles.border} bg-background hover:bg-muted/5 transition-all`}>
              <div className="p-4 border-b border-dashed border-border/50 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-none border border-border bg-background ${styles.text}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-0.5">Type</span>
                    <span className="font-bold text-sm">{utility.utilityType}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border-0 ${utility.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted/10 text-muted-foreground'} px-2 py-0.5`}>
                  {utility.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="h-3 w-3" /> Account
                  </span>
                  <span className="font-mono text-sm font-medium">{utility.accountNumber}</span>
                </div>
                
                {utility.meterNumber && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-3 w-3" /> Meter
                    </span>
                    <span className="font-mono text-sm">{utility.meterNumber}</span>
                  </div>
                )}

                {utility.billingId && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3 w-3" /> Billing ID
                    </span>
                    <span className="font-mono text-sm">{utility.billingId}</span>
                  </div>
                )}

                {utility.remarks && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground italic line-clamp-2">&quot;{utility.remarks}&quot;</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 border-t border-border/50 bg-muted/5 text-[10px] text-muted-foreground font-mono flex justify-between items-center">
                <span>Added {format(new Date(utility.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}