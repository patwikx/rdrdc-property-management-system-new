"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  FileText, 
  ArrowUpRight,
  Filter
} from "lucide-react"
import { format } from "date-fns"

// Types (Mirrored from dashboard-actions for client component usage)
interface UpcomingTask {
  id: string
  title: string
  dueDate: Date
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

interface Lease {
  id: string
  endDate: Date
  tenant: {
    firstName: string | null
    lastName: string | null
    company: string
    bpCode: string
  }
  leaseUnits: Array<{
    unit: {
      unitNumber: string
      property: {
        propertyName: string
      }
    }
  }>
}

interface Payment {
  id: string
  amount: number
  paymentDate: Date
  lease: {
    tenant: {
      firstName: string | null
      lastName: string | null
      company: string
      bpCode: string
    }
  }
}

interface ActionBoardProps {
  tasks: UpcomingTask[]
  leases: Lease[]
  payments: Payment[]
}

export function ActionBoard({ tasks, leases, payments }: ActionBoardProps) {
  const [activeTab, setActiveTab] = useState("attention")

  // Filter urgent items for the "Attention" tab
  const urgentTasks = tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH')
  const overduePayments = payments // Assuming all passed payments are overdue based on the prop name in page.tsx
  const expiringLeases = leases // Assuming all passed leases are expiring

  const attentionCount = urgentTasks.length + overduePayments.length + expiringLeases.length

  return (
    <Card className="col-span-1 border-muted/60 shadow-sm h-[500px] flex flex-col overflow-hidden">
      <CardHeader className="pb-0 px-6 pt-6 shrink-0 border-b border-border/40 bg-muted/5">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
              Command Center
              {attentionCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[10px] font-bold h-5">
                  {attentionCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">Centralized operational workspace</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hidden sm:flex">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
            <Button size="sm" className="h-8 text-xs">
              + New Task
            </Button>
          </div>
        </div>

        <Tabs defaultValue="attention" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start h-10 bg-transparent p-0 gap-6 border-b border-transparent">
            <TabsTrigger 
              value="attention" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-medium text-xs uppercase tracking-wide text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Needs Attention
            </TabsTrigger>
            <TabsTrigger 
              value="financials" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-medium text-xs uppercase tracking-wide text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Collections
            </TabsTrigger>
            <TabsTrigger 
              value="maintenance" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 font-medium text-xs uppercase tracking-wide text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Leases
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-y-auto custom-scrollbar bg-background">
        <Tabs value={activeTab} className="h-full">
          
          {/* TAB: ATTENTION (Combined Urgent Items) */}
          <TabsContent value="attention" className="m-0 h-full">
            {attentionCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs opacity-70">No urgent items requiring attention.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {/* Overdue Payments Section */}
                {overduePayments.map(payment => (
                  <div key={`pay-${payment.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
                    <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {payment.lease.tenant.company || `${payment.lease.tenant.firstName} ${payment.lease.tenant.lastName}`}
                        </p>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          ₱{payment.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-rose-600 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          Overdue {format(new Date(payment.paymentDate), 'MMM d')}
                        </span>
                        <span>•</span>
                        <span>{payment.lease.tenant.bpCode}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Urgent Tasks Section */}
                {urgentTasks.map(task => (
                  <div key={`task-${task.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group">
                    <div className="h-9 w-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {task.title}
                        </p>
                        <Badge variant="outline" className="text-[10px] h-5 border-orange-200 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                        <span>•</span>
                        <span>{task.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB: FINANCIALS (Collections List) */}
          <TabsContent value="financials" className="m-0 h-full">
             <div className="divide-y divide-border/40">
                {payments.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">No pending payments.</div>
                ) : (
                  payments.map(payment => (
                    <div key={`pay-tab-${payment.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                       <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between">
                            <p className="text-sm font-medium">{payment.lease.tenant.company || payment.lease.tenant.lastName}</p>
                            <span className="font-bold text-sm">₱{payment.amount.toLocaleString()}</span>
                         </div>
                         <p className="text-xs text-muted-foreground mt-0.5">Due: {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </TabsContent>

          {/* TAB: LEASES (Expiring) */}
          <TabsContent value="maintenance" className="m-0 h-full">
            <div className="divide-y divide-border/40">
                {leases.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">No expiring leases.</div>
                ) : (
                  leases.map(lease => (
                    <div key={`lease-${lease.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                       <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between">
                            <p className="text-sm font-medium">{lease.tenant.company || lease.tenant.lastName}</p>
                            <span className="font-bold text-xs text-rose-600">Ends {format(new Date(lease.endDate), 'MMM dd')}</span>
                         </div>
                         <p className="text-xs text-muted-foreground mt-0.5">
                            {lease.leaseUnits[0]?.unit.property.propertyName} • {lease.leaseUnits[0]?.unit.unitNumber}
                         </p>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}