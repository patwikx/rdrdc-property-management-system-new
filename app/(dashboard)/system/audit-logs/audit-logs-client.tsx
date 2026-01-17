"use client"

import { useState, useEffect } from "react"
import { 
  AuditLogListResult, 
  AuditLogStats, 
  AuditLogFilters, 
  getAuditLogs,
  getAuditLogStats,
  getEntityTypes,
  getAuditActions,
  getAuditLogUsers,
  exportAuditLogs
} from "@/lib/actions/audit-log-actions"
import { AuditAction, EntityType } from "@prisma/client"
import { 
  Search, 
  Calendar, 
  User, 
  Activity, 
  ShieldAlert, 
  FileJson, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AuditLogsClientProps {
  initialData: AuditLogListResult
  initialStats: AuditLogStats
}

export function AuditLogsClient({ initialData, initialStats }: AuditLogsClientProps) {
  const [logs, setLogs] = useState<AuditLogListResult>(initialData)
  const [stats, setStats] = useState<AuditLogStats>(initialStats)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    pageSize: 20,
    sortOrder: 'desc',
    sortBy: 'createdAt'
  })
  
  // Filter Options State
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([])
  const [actions, setActions] = useState<AuditAction[]>([])
  const [users, setUsers] = useState<Array<{ id: string, firstName: string, lastName: string }>>([])

  // Load filter options on mount
  useEffect(() => {
    const loadOptions = async () => {
      const [typesRes, actionsRes, usersRes] = await Promise.all([
        getEntityTypes(),
        getAuditActions(),
        getAuditLogUsers()
      ])
      
      if (typesRes.success && typesRes.data) setEntityTypes(typesRes.data)
      if (actionsRes.success && actionsRes.data) setActions(actionsRes.data)
      if (usersRes.success && usersRes.data) setUsers(usersRes.data)
    }
    loadOptions()
  }, [])

  // Refresh data when filters change
  useEffect(() => {
    const refreshData = async () => {
      setIsLoading(true)
      try {
        const [logsRes, statsRes] = await Promise.all([
          getAuditLogs(filters),
          getAuditLogStats({ 
            startDate: filters.startDate, 
            endDate: filters.endDate,
            entityType: Array.isArray(filters.entityType) ? filters.entityType[0] : filters.entityType
          })
        ])

        if (logsRes.success && logsRes.data) setLogs(logsRes.data)
        if (statsRes.success && statsRes.data) setStats(statsRes.data)
      } catch {
        toast.error("Failed to refresh audit logs")
      } finally {
        setIsLoading(false)
      }
    }

    refreshData()
  }, [filters])

  const handleFilterChange = (key: keyof AuditLogFilters, value: AuditLogFilters[keyof AuditLogFilters]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })) // Reset to page 1 on filter change
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleExport = async () => {
    try {
      const result = await exportAuditLogs(filters)
      if (result.success && result.data) {
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
          JSON.stringify(result.data, null, 2)
        )}`
        const link = document.createElement("a")
        link.href = jsonString
        link.download = `audit-logs-${new Date().toISOString()}.json`
        link.click()
        toast.success("Audit logs exported successfully")
      } else {
        toast.error("Failed to export logs")
      }
    } catch {
      toast.error("Export failed")
    }
  }

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return "border-emerald-500 text-emerald-600 bg-emerald-500/10"
      case 'UPDATE': return "border-blue-500 text-blue-600 bg-blue-500/10"
      case 'DELETE': return "border-rose-500 text-rose-600 bg-rose-500/10"
      case 'LOGIN': return "border-purple-500 text-purple-600 bg-purple-500/10"
      case 'LOGOUT': return "border-gray-500 text-gray-600 bg-gray-500/10"
      default: return "border-amber-500 text-amber-600 bg-amber-500/10"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-6 w-6" />
              System Audit Logs
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">
              Security & Activity Monitoring Console
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="rounded-none h-8 text-xs font-mono uppercase border-border hover:bg-muted/10"
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border border-border bg-background">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Logs</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="text-2xl font-mono font-medium tracking-tighter">{stats.totalLogs}</span>
        </div>
        <div className="p-4 border border-border bg-background">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Today</span>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-2xl font-mono font-medium tracking-tighter text-blue-600">{stats.todayLogs}</span>
        </div>
        <div className="p-4 border border-border bg-background">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Most Active User</span>
            <User className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-mono font-bold truncate">{stats.topUsers[0]?.userName || 'N/A'}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{stats.topUsers[0]?.actionCount || 0} Actions</span>
          </div>
        </div>
        <div className="p-4 border border-border bg-background">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Action Breakdown</span>
            <FileJson className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
            <span>C: {stats.byAction.CREATE || 0}</span>
            <span>U: {stats.byAction.UPDATE || 0}</span>
            <span>D: {stats.byAction.DELETE || 0}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 border border-border bg-muted/5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
          <Input
            placeholder="SEARCH LOGS..."
            className="pl-9 h-8 rounded-none border-border font-mono text-xs uppercase bg-background"
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
        
        <Select 
          value={filters.entityType as string || "all"} 
          onValueChange={(val) => handleFilterChange('entityType', val === "all" ? undefined : val)}
        >
          <SelectTrigger className="w-[160px] h-8 rounded-none border-border font-mono text-xs uppercase bg-background">
            <SelectValue placeholder="ENTITY TYPE" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all" className="font-mono text-xs uppercase">ALL ENTITIES</SelectItem>
            {entityTypes.map(type => (
              <SelectItem key={type} value={type} className="font-mono text-xs uppercase">{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.action as string || "all"} 
          onValueChange={(val) => handleFilterChange('action', val === "all" ? undefined : val)}
        >
          <SelectTrigger className="w-[160px] h-8 rounded-none border-border font-mono text-xs uppercase bg-background">
            <SelectValue placeholder="ACTION TYPE" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all" className="font-mono text-xs uppercase">ALL ACTIONS</SelectItem>
            {actions.map(action => (
              <SelectItem key={action} value={action} className="font-mono text-xs uppercase">{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.userId || "all"} 
          onValueChange={(val) => handleFilterChange('userId', val === "all" ? undefined : val)}
        >
          <SelectTrigger className="w-[160px] h-8 rounded-none border-border font-mono text-xs uppercase bg-background">
            <SelectValue placeholder="USER" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-border">
            <SelectItem value="all" className="font-mono text-xs uppercase">ALL USERS</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id} className="font-mono text-xs uppercase">
                {user.firstName} {user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5 border-b border-border">
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timestamp</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entity</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Details</TableHead>
              <TableHead className="h-9 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center text-xs font-mono uppercase text-muted-foreground">
                    Loading audit data...
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center text-xs font-mono uppercase text-muted-foreground">
                    No logs found matching criteria
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.items.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/5 border-b border-border transition-colors">
                  <TableCell className="font-mono text-xs">
                    {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase">{log.user.firstName} {log.user.lastName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{log.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("rounded-none font-mono text-[10px] uppercase", getActionColor(log.action))}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase">{log.entityType}</span>
                      <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]" title={log.entityId}>
                        ID: {log.entityId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-xs font-mono text-muted-foreground">
                      {log.changes ? JSON.stringify(log.changes) : log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-none hover:bg-muted">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[540px] border-l border-border p-0 gap-0">
                        <SheetHeader className="p-6 border-b border-border bg-muted/5">
                          <SheetTitle className="text-sm font-bold uppercase tracking-widest">Audit Log Details</SheetTitle>
                          <SheetDescription className="text-xs font-mono uppercase text-muted-foreground">
                            ID: {log.id}
                          </SheetDescription>
                        </SheetHeader>
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-100px)]">
                          {/* Metadata Grid */}
                          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">Timestamp</span>
                              <div className="p-2 border border-border bg-muted/10">
                                {format(new Date(log.createdAt), 'PP pp')}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">IP Address</span>
                              <div className="p-2 border border-border bg-muted/10">
                                {log.ipAddress || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">User Agent</span>
                            <div className="p-2 border border-border bg-muted/10 text-xs font-mono break-all">
                              {log.userAgent || 'Unknown'}
                            </div>
                          </div>

                          {/* JSON Data */}
                          {log.changes && (
                            <div className="space-y-2">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Changes</span>
                              <pre className="p-3 border border-border bg-muted/10 text-[10px] font-mono overflow-x-auto">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.metadata && (
                            <div className="space-y-2">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Metadata</span>
                              <pre className="p-3 border border-border bg-muted/10 text-[10px] font-mono overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-[10px] font-mono text-muted-foreground uppercase">
          Page {logs.pagination.page} of {logs.pagination.totalPages} • Total {logs.pagination.total} logs
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(logs.pagination.page - 1)}
            disabled={logs.pagination.page <= 1}
            className="rounded-none h-7 w-7 p-0 border-border"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(logs.pagination.page + 1)}
            disabled={logs.pagination.page >= logs.pagination.totalPages}
            className="rounded-none h-7 w-7 p-0 border-border"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}