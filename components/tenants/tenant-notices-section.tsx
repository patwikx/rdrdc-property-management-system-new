"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { getTenantNotices, getTenantNoticeStats, type TenantNotice, type TenantNoticeStats } from "@/lib/actions/tenant-notices-actions"

interface TenantNoticesSectionProps {
  tenantId: string
}

function getNoticeStatusVariant(isSettled: boolean, isOverdue: boolean) {
  if (isSettled) return "default" as const
  if (isOverdue) return "destructive" as const
  return "secondary" as const
}

function getNoticeTypeVariant(noticeType: string) {
  switch (noticeType.toLowerCase()) {
    case "demand_letter": return "destructive" as const
    case "notice_to_quit": return "destructive" as const
    case "payment_reminder": return "secondary" as const
    case "lease_violation": return "destructive" as const
    default: return "outline" as const
  }
}

export function TenantNoticesSection({ tenantId }: TenantNoticesSectionProps) {
  const [notices, setNotices] = useState<TenantNotice[]>([])
  const [stats, setStats] = useState<TenantNoticeStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [noticesResult, statsResult] = await Promise.all([
          getTenantNotices(tenantId),
          getTenantNoticeStats(tenantId)
        ])

        if (noticesResult.success && noticesResult.data) {
          setNotices(noticesResult.data)
        }

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data)
        }
      } catch (error) {
        console.error("Error fetching notices data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenantId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNoticeType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const isNoticeOverdue = (notice: TenantNotice) => {
    if (notice.isSettled) return false
    
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const noticeYear = notice.forYear
    const noticeMonth = parseInt(notice.forMonth)
    
    return noticeYear < currentYear || (noticeYear === currentYear && noticeMonth < currentMonth)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notice Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                Total Notices
              </CardTitle>
              <Badge variant="secondary">{stats.total}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                All notices issued
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                Settled
              </CardTitle>
              <Badge variant="default">{stats.settled}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.settledAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Resolved notices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                Outstanding
              </CardTitle>
              <Badge variant="secondary">{stats.outstanding}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.outstandingAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Pending resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </div>
                Overdue
              </CardTitle>
              <Badge variant="destructive">{stats.overdue}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.overdueAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Past due notices
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Tenant Notices
          </CardTitle>
          <CardDescription>
            All notices issued to this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice) => {
                const isOverdue = isNoticeOverdue(notice)
                return (
                  <div key={notice.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{formatNoticeType(notice.noticeType)}</h3>
                            <Badge variant={getNoticeTypeVariant(notice.noticeType)}>
                              #{notice.noticeNumber}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getNoticeStatusVariant(notice.isSettled, isOverdue)}>
                              {notice.isSettled ? 'Settled' : isOverdue ? 'Overdue' : 'Outstanding'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(new Date(notice.dateIssued), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Date issued
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-3 p-3 bg-muted/30 rounded-lg">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Amount</label>
                        <p className="text-sm font-medium">{formatCurrency(notice.totalAmount)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Period</label>
                        <p className="text-sm">{notice.forMonth} {notice.forYear}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <p className={`text-sm font-medium ${
                          notice.isSettled 
                            ? 'text-green-600 dark:text-green-400' 
                            : isOverdue 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {notice.isSettled ? 'Settled' : isOverdue ? 'Overdue' : 'Outstanding'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No notices</h3>
              <p className="mt-2 text-muted-foreground">
                No notices have been issued to this tenant.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}