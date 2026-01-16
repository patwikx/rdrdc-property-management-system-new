"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, Plus, AlertCircle, Clock, CheckCircle, Activity, Search } from "lucide-react"
import { UnitWithDetails } from "@/lib/actions/unit-actions"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UnitMaintenanceProps {
  unit: UnitWithDetails
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'EMERGENCY': return { border: 'border-l-rose-600', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: AlertCircle }
    case 'HIGH': return { border: 'border-l-orange-500', badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: AlertCircle }
    case 'MEDIUM': return { border: 'border-l-blue-500', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Activity }
    case 'LOW': return { border: 'border-l-slate-500', badge: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: Wrench }
    default: return { border: 'border-l-muted', badge: 'bg-muted/10 text-muted-foreground border-border', icon: Wrench }
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'COMPLETED': return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
    case 'IN_PROGRESS': return 'text-blue-600 bg-blue-500/10 border-blue-500/20'
    case 'PENDING': return 'text-amber-600 bg-amber-500/10 border-amber-500/20'
    case 'CANCELLED': return 'text-slate-600 bg-slate-500/10 border-slate-500/20'
    default: return 'text-muted-foreground bg-muted/10 border-border'
  }
}

export function UnitMaintenance({ unit }: UnitMaintenanceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Calculate stats
  const totalRequests = unit.maintenanceRequests.length
  const pendingRequests = unit.maintenanceRequests.filter(r => r.status === 'PENDING').length
  const inProgressRequests = unit.maintenanceRequests.filter(r => r.status === 'IN_PROGRESS').length
  const completedRequests = unit.maintenanceRequests.filter(r => r.status === 'COMPLETED').length

  const filteredRequests = unit.maintenanceRequests.filter(request => {
    const matchesSearch = request.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          request.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (totalRequests === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-muted/5">
        <Wrench className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Repair Orders</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-6 font-mono">
          No maintenance or repair requests recorded
        </p>
        <Button className="rounded-none h-9 text-xs font-mono uppercase tracking-wider">
          <Plus className="h-3 w-3 mr-2" />
          Create Order
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 border border-border bg-background">
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Orders</span>
            <Wrench className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter">{totalRequests}</span>
            <span className="text-[10px] text-muted-foreground ml-2">All Time</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Pending</span>
            <Clock className="h-4 w-4 text-amber-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-amber-600">{pendingRequests}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Open</span>
          </div>
        </div>
        <div className="p-4 border-r border-border flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Active</span>
            <Activity className="h-4 w-4 text-blue-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">{inProgressRequests}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Working</span>
          </div>
        </div>
        <div className="p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Resolved</span>
            <CheckCircle className="h-4 w-4 text-emerald-600/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter text-emerald-600">{completedRequests}</span>
            <span className="text-[10px] text-muted-foreground ml-2">Closed</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border bg-muted/5 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="SEARCH ORDERS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-none border-border bg-background h-10 font-mono text-xs uppercase placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] rounded-none border-border bg-background h-10 font-mono text-xs uppercase">
              <SelectValue placeholder="STATUS: ALL" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all" className="font-mono text-xs uppercase">All Status</SelectItem>
              <SelectItem value="PENDING" className="font-mono text-xs uppercase">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS" className="font-mono text-xs uppercase">In Progress</SelectItem>
              <SelectItem value="COMPLETED" className="font-mono text-xs uppercase">Completed</SelectItem>
              <SelectItem value="CANCELLED" className="font-mono text-xs uppercase">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="rounded-none h-10 text-xs font-mono uppercase tracking-wider w-full sm:w-auto">
          <Plus className="h-3 w-3 mr-2" />
          New Order
        </Button>
      </div>

      {/* REQUESTS LIST */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const priorityStyle = getPriorityStyle(request.priority)
          const statusClass = getStatusStyle(request.status)

          return (
            <div key={request.id} className={`group border border-border border-l-4 ${priorityStyle.border} bg-background hover:bg-muted/5 transition-all`}>
              <div className="p-4 border-b border-dashed border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border-0 ${priorityStyle.badge}`}>
                    {request.priority} Priority
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">ID: #{request.id.slice(0, 8)}</span>
                </div>
                <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border-0 ${statusClass}`}>
                  {request.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold bg-muted px-1.5 py-0.5 rounded-none border border-border">
                      {request.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {request.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Created</span>
                  <span className="text-xs font-mono flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Resolved</span>
                  {request.completedAt ? (
                    <span className="text-xs font-mono flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      {format(new Date(request.completedAt), 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground italic">--</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {filteredRequests.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching work orders found</p>
          </div>
        )}
      </div>
    </div>
  )
}