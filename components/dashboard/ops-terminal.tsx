"use client"

import { useState } from "react"
import { 
  AlertTriangle, 
  Terminal, 
  DollarSign, 
  FileOutput,
  ChevronRight
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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

interface OpsTerminalProps {
  tasks: UpcomingTask[]
  leases: Lease[]
  payments: Payment[]
}

export function OpsTerminal({ tasks, leases, payments }: OpsTerminalProps) {
  const [activeChannel, setActiveChannel] = useState<'PRIORITY' | 'FINANCE' | 'LEASES'>('PRIORITY')

  const priorityItems = [
    ...payments.map(p => ({ type: 'PAYMENT', data: p, date: new Date(p.paymentDate) })),
    ...tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').map(t => ({ type: 'TASK', data: t, date: new Date(t.dueDate) }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="border border-border bg-background h-[600px] flex flex-col font-mono text-sm relative overflow-hidden">
      {/* HEADER BAR */}
      <div className="border-b border-border bg-muted/10 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-emerald-500 animate-pulse rounded-none" />
          <span className="uppercase tracking-widest text-[10px] font-bold">OPS_TERMINAL_V3</span>
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground">
          <span>UPTIME: 99.9%</span>
          <span>LATENCY: 24ms</span>
        </div>
      </div>

      {/* CHANNEL SELECTOR */}
      <div className="flex border-b border-border divide-x divide-border">
        <button 
          onClick={() => setActiveChannel('PRIORITY')}
          className={cn(
            "flex-1 py-3 text-xs uppercase tracking-wider hover:bg-muted/5 transition-colors flex items-center justify-center gap-2",
            activeChannel === 'PRIORITY' ? "bg-primary/10 text-primary font-bold shadow-[inset_0_-2px_0_0_currentColor]" : "text-muted-foreground"
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          Priority_Queue [{priorityItems.length}]
        </button>
        <button 
          onClick={() => setActiveChannel('FINANCE')}
          className={cn(
            "flex-1 py-3 text-xs uppercase tracking-wider hover:bg-muted/5 transition-colors flex items-center justify-center gap-2",
            activeChannel === 'FINANCE' ? "bg-primary/10 text-primary font-bold shadow-[inset_0_-2px_0_0_currentColor]" : "text-muted-foreground"
          )}
        >
          <DollarSign className="h-3 w-3" />
          Collections [{payments.length}]
        </button>
        <button 
          onClick={() => setActiveChannel('LEASES')}
          className={cn(
            "flex-1 py-3 text-xs uppercase tracking-wider hover:bg-muted/5 transition-colors flex items-center justify-center gap-2",
            activeChannel === 'LEASES' ? "bg-primary/10 text-primary font-bold shadow-[inset_0_-2px_0_0_currentColor]" : "text-muted-foreground"
          )}
        >
          <FileOutput className="h-3 w-3" />
          Expiring_Leases [{leases.length}]
        </button>
      </div>

      {/* TERMINAL CONTENT */}
      <div className="flex-1 overflow-y-auto p-0 bg-black/5">
        {activeChannel === 'PRIORITY' && (
          <div className="divide-y divide-border/50">
             {priorityItems.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                   <Terminal className="h-8 w-8 mx-auto mb-2 opacity-20" />
                   <p className="uppercase tracking-widest text-xs">Queue Empty</p>
                </div>
             ) : (
                priorityItems.map((item, idx) => {
                  const isPayment = item.type === 'PAYMENT'
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const data = item.data as any
                  return (
                    <div key={idx} className="p-3 hover:bg-muted/10 flex items-start gap-3 group">
                       <div className="mt-1 font-mono text-[10px] text-muted-foreground w-8 shrink-0 opacity-50">
                          {(idx + 1).toString().padStart(2, '0')}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <span className={cn(
                                "text-xs font-bold uppercase tracking-wide",
                                isPayment ? "text-rose-600" : "text-orange-600"
                             )}>
                                {isPayment ? "OVERDUE_PAYMENT" : `TASK_${data.priority}`}
                             </span>
                             <span className="text-[10px] font-mono text-muted-foreground">
                                {format(item.date, 'yyyy-MM-dd')}
                             </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                             {isPayment 
                                ? `₱${data.amount.toLocaleString()} - ${data.lease.tenant.company || data.lease.tenant.lastName}` 
                                : data.title
                             }
                          </p>
                          {!isPayment && (
                             <div className="mt-1 flex gap-2">
                                <span className="text-[10px] bg-muted px-1 py-0.5 text-muted-foreground">ID: {data.id.substring(0,8)}</span>
                             </div>
                          )}
                       </div>
                       <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )
                })
             )}
          </div>
        )}

        {activeChannel === 'FINANCE' && (
           <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 border-b border-border font-mono text-muted-foreground">
                 <tr>
                    <th className="p-3 font-normal uppercase tracking-wider">ID</th>
                    <th className="p-3 font-normal uppercase tracking-wider">Entity</th>
                    <th className="p-3 font-normal uppercase tracking-wider text-right">Amount</th>
                    <th className="p-3 font-normal uppercase tracking-wider text-right">Due_Date</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                 {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-muted/10 group">
                       <td className="p-3 font-mono text-muted-foreground">{payment.id.substring(0,6)}...</td>
                       <td className="p-3 font-medium">{payment.lease.tenant.company || payment.lease.tenant.lastName}</td>
                       <td className="p-3 text-right font-mono">₱{payment.amount.toLocaleString()}</td>
                       <td className="p-3 text-right font-mono text-rose-600">{format(new Date(payment.paymentDate), 'MM-dd')}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        )}
        
        {activeChannel === 'LEASES' && (
           <div className="grid grid-cols-1 divide-y divide-border/50">
              {leases.map(lease => (
                 <div key={lease.id} className="p-3 flex items-center justify-between hover:bg-muted/10">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold uppercase">{lease.tenant.company || lease.tenant.lastName}</span>
                       <span className="text-[10px] text-muted-foreground font-mono">UNIT: {lease.leaseUnits[0]?.unit.unitNumber}</span>
                    </div>
                    <div className="text-right">
                       <span className="block text-xs font-mono text-blue-600">EXP: {format(new Date(lease.endDate), 'yyyy-MM-dd')}</span>
                       <span className="block text-[10px] text-muted-foreground">BP: {lease.tenant.bpCode}</span>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-border bg-muted/5 p-2 flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
         <span>Status: ONLINE</span>
         <span>Synced: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  )
}