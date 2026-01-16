import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap, Plus, Search, Building, Hash, Activity, X } from "lucide-react"
import { PropertyWithDetails } from "@/lib/actions/property-actions"
import { CreateUtilityForm } from "./create-utility-form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PropertyUtilitiesProps {
  property: PropertyWithDetails
}

export function PropertyUtilities({ property }: PropertyUtilitiesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const handleUtilityCreated = () => {
    setIsAddDialogOpen(false)
    window.location.reload()
  }

  const getUtilityTypeStyle = (type: string) => {
    switch (type) {
      case 'ELECTRICITY': return { border: 'border-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-500', icon: Zap }
      case 'WATER': return { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500', icon: Activity }
      case 'OTHERS': return { border: 'border-slate-500', text: 'text-slate-600', bg: 'bg-slate-500', icon: Building }
      default: return { border: 'border-muted', text: 'text-muted-foreground', bg: 'bg-muted', icon: Building }
    }
  }

  // Filter utilities
  const filteredUtilities = property.utilities.filter(utility => {
    const matchesSearch = searchTerm === "" || 
      utility.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utility.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (utility.meterNumber && utility.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = typeFilter === "all" || utility.utilityType === typeFilter

    return matchesSearch && matchesType
  })

  const utilityTypes = ["ELECTRICITY", "WATER", "OTHERS"]

  if (property.utilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Zap className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Utilities Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          Register utility connections
        </p>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
              <Plus className="h-3 w-3 mr-2" />
              Add Utility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Add New Utility</DialogTitle>
            </DialogHeader>
            <CreateUtilityForm 
              propertyId={property.id}
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-none" />
            Property Utilities
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            Total Connections: {property.utilities.length}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none h-8 text-xs font-mono uppercase tracking-wider border-border hover:bg-muted">
              <Plus className="h-3 w-3 mr-2" />
              Add Utility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-none border-border">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-wide">Add New Utility</DialogTitle>
            </DialogHeader>
            <CreateUtilityForm 
              propertyId={property.id}
              onSuccess={handleUtilityCreated}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search utilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="Type: All" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Types</SelectItem>
              {utilityTypes.map(type => (
                <SelectItem key={type} value={type} className="font-mono text-xs uppercase">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || typeFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
              }}
              className="rounded-none border-border h-10 px-3 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {(searchTerm || typeFilter !== "all") && (
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
          Found {filteredUtilities.length} matching connections
        </div>
      )}

      {/* Utilities Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUtilities.map((utility) => {
          const styles = getUtilityTypeStyle(utility.utilityType)
          const Icon = styles.icon
          
          return (
            <Card key={utility.id} className="group rounded-none border border-border hover:border-primary/50 transition-all hover:shadow-none bg-background overflow-hidden flex flex-col relative">
              {/* Status Line */}
              <div className={`h-1 w-full ${styles.bg}`} />
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-none border ${styles.border} bg-background`}>
                      <Icon className={`h-5 w-5 ${styles.text}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Provider</span>
                      <span className="font-bold text-sm tracking-tight">{utility.provider}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border ${utility.isActive ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10' : 'border-border text-muted-foreground bg-muted/10'}`}>
                    {utility.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-3 border-t border-dashed border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="h-3 w-3" /> Account
                    </span>
                    <span className="text-xs font-mono font-medium">{utility.accountNumber}</span>
                  </div>
                  
                  {utility.meterNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3 w-3" /> Meter
                      </span>
                      <span className="text-xs font-mono font-medium">{utility.meterNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredUtilities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching utilities found</p>
        </div>
      )}
    </div>
  )
}