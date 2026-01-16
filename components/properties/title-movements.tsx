import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Activity, Plus, MapPin, User, FileText, ArrowRight, AlertCircle, CheckCircle2, Truck, HelpCircle } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateMovementForm } from "./create-movement-form"
import { format } from "date-fns"


interface TitleMovementsProps {
  property: PropertyWithDetails
}

export function TitleMovements({ property }: TitleMovementsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleMovementCreated = () => {
    setIsAddDialogOpen(false)
    window.location.reload()
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'REQUESTED': return { border: 'border-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-500', icon: HelpCircle }
      case 'RELEASED': return { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500', icon: ArrowRight }
      case 'RETURNED': return { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500', icon: CheckCircle2 }
      case 'IN_TRANSIT': return { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-500', icon: Truck }
      case 'LOST': return { border: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-500', icon: AlertCircle }
      default: return { border: 'border-slate-500', text: 'text-slate-600', bg: 'bg-slate-500', icon: Activity }
    }
  }

  // Calculate stats
  const totalMovements = property.titleMovements.length
  const activeRequests = property.titleMovements.filter(m => m.status === 'REQUESTED' || m.status === 'IN_TRANSIT').length
  const released = property.titleMovements.filter(m => m.status === 'RELEASED').length
  const returned = property.titleMovements.filter(m => m.status === 'RETURNED').length

  if (property.titleMovements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Activity className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Movements Recorded</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Log title requests and transfers
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <Plus className="h-3 w-3 mr-2" />
              Log Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Record Title Movement</DialogTitle>
            </DialogHeader>
            <CreateMovementForm 
              propertyId={property.id}
              onSuccess={handleMovementCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Logs</span>
            <Activity className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter">{totalMovements}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Records</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active</span>
            <Truck className="h-4 w-4 text-orange-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-orange-600">{activeRequests}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Pending</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Released</span>
            <ArrowRight className="h-4 w-4 text-blue-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">{released}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Out</span>
          </div>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Returned</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{returned}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Completed</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Movement_Log
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Track title transfers and requests
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              <Plus className="h-3 w-3 mr-2" />
              Add Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Record Title Movement</DialogTitle>
            </DialogHeader>
            <CreateMovementForm 
              propertyId={property.id}
              onSuccess={handleMovementCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {property.titleMovements.slice(0, 10).map((movement) => {
          const styles = getStatusStyle(movement.status)
          const Icon = styles.icon
          
          return (
            <Card key={movement.id} className="group rounded-none border border-border hover:border-primary/50 transition-all hover:shadow-none bg-background overflow-hidden flex flex-col relative">
              {/* Status Line */}
              <div className={`h-1 w-full ${styles.bg}`} />
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-none border ${styles.border} bg-background`}>
                      <Icon className={`h-5 w-5 ${styles.text}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Date Requested</span>
                      <span className="font-mono font-bold text-sm tracking-tight">{format(new Date(movement.requestDate), 'yyyy-MM-dd')}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border ${styles.border} ${styles.text} bg-transparent`}>
                    {movement.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3 pt-3 border-t border-dashed border-border/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3 w-3" /> Purpose
                    </span>
                    <p className="text-xs font-medium line-clamp-2 leading-relaxed">{movement.purpose}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> Location
                      </span>
                      <p className="text-xs font-mono">{movement.location}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="h-3 w-3" /> Requested By
                      </span>
                      <p className="text-xs font-mono truncate" title={`${movement.user.firstName} ${movement.user.lastName}`}>
                        {movement.user.firstName} {movement.user.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                {movement.returnDate && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center text-xs font-mono text-emerald-600">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Returned</span>
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        {format(new Date(movement.returnDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      
      {property.titleMovements.length > 10 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
            View All Records
          </Button>
        </div>
      )}
    </div>
  )
}