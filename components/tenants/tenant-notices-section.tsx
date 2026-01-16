"use client"

import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"

// Define interface locally based on TenantWithDetails to avoid import cycles or missing types
interface TenantNotice {
  id: string
  noticeType: string
  noticeNumber: number
  totalAmount: number
  forMonth: string
  forYear: number
  dateIssued: Date
  isSettled: boolean
}

interface TenantNoticesSectionProps {
  notices: TenantNotice[]
}

function getNoticeStatusStyle(isSettled: boolean, isOverdue: boolean) {
  if (isSettled) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  if (isOverdue) return "bg-rose-500/10 text-rose-600 border-rose-500/20"
  return "bg-amber-500/10 text-amber-600 border-amber-500/20"
}

export function TenantNoticesSection({ notices }: TenantNoticesSectionProps) {
  // Calculate stats client-side
  const now = new Date()

  const isNoticeOverdue = (notice: TenantNotice) => {
    if (notice.isSettled) return false
    // Simplification for UI stats: 
    return !notice.isSettled && new Date(notice.dateIssued) < new Date(now.setMonth(now.getMonth() - 1))
  }

  const stats = {
    total: notices.length,
    totalAmount: notices.reduce((sum, n) => sum + n.totalAmount, 0),
    settled: notices.filter(n => n.isSettled).length,
    settledAmount: notices.filter(n => n.isSettled).reduce((sum, n) => sum + n.totalAmount, 0),
    outstanding: notices.filter(n => !n.isSettled && !isNoticeOverdue(n)).length,
    outstandingAmount: notices.filter(n => !n.isSettled && !isNoticeOverdue(n)).reduce((sum, n) => sum + n.totalAmount, 0),
    overdue: notices.filter(n => isNoticeOverdue(n)).length,
    overdueAmount: notices.filter(n => isNoticeOverdue(n)).reduce((sum, n) => sum + n.totalAmount, 0),
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNoticeType = (type: string) => {
    return type.replace(/_/g, ' ').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Total Notices</span>
            <FileText className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block">{stats.total}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.totalAmount)}</span>
          </div>
        </div>

        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Settled</span>
            <CheckCircle className="h-4 w-4 text-emerald-500/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block text-emerald-600">{stats.settled}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.settledAmount)}</span>
          </div>
        </div>

        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Outstanding</span>
            <Clock className="h-4 w-4 text-amber-500/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block text-amber-600">{stats.outstanding}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.outstandingAmount)}</span>
          </div>
        </div>

        <div className="border border-border bg-background p-4 flex flex-col justify-between hover:bg-muted/5 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-rose-500/50" />
          </div>
          <div>
            <span className="text-2xl font-mono font-medium tracking-tighter block text-rose-600">{stats.overdue}</span>
            <span className="text-xs text-muted-foreground font-mono">{formatCurrency(stats.overdueAmount)}</span>
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="border border-border bg-background p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Notice History
        </h3>
        
        {notices.length > 0 ? (
          <div className="grid gap-2">
            {notices.map((notice) => {
              const isOverdue = isNoticeOverdue(notice)
              const statusStyle = getNoticeStatusStyle(notice.isSettled, isOverdue)
              
              return (
                <div key={notice.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 border border-border bg-muted/5 items-center hover:border-primary/30 transition-colors">
                  {/* Status */}
                  <div className="md:col-span-2">
                    <Badge variant="outline" className={`rounded-none text-[9px] uppercase tracking-widest border-0 px-1.5 py-0.5 w-fit ${statusStyle}`}>
                      {notice.isSettled ? 'SETTLED' : isOverdue ? 'OVERDUE' : 'PENDING'}
                    </Badge>
                  </div>

                  {/* Type & ID */}
                  <div className="md:col-span-4">
                    <span className="text-[10px] text-muted-foreground uppercase block md:hidden mb-1">Notice Type</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wide">{formatNoticeType(notice.noticeType)}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">REF#{notice.noticeNumber}</span>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="md:col-span-3">
                    <span className="text-[10px] text-muted-foreground uppercase block md:hidden mb-1">Amount</span>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-sm">{formatCurrency(notice.totalAmount)}</span>
                      <span className="text-[10px] text-muted-foreground">FOR: {notice.forMonth} {notice.forYear}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase text-muted-foreground tracking-widest">Date Issued</span>
                      <span className="font-mono text-xs">{format(new Date(notice.dateIssued), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border bg-muted/5">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No Notices Found</h3>
          </div>
        )}
      </div>
    </div>
  )
}