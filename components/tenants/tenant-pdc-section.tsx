"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, FileText, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { getTenantPDCs, getTenantPDCStats, type TenantPDC, type TenantPDCStats } from "@/lib/actions/tenant-pdc-actions"

interface TenantPDCSectionProps {
  tenantBpCode: string
}

function getPDCStatusVariant(status: string) {
  switch (status) {
    case "Open": return "outline" as const
    case "Deposited": return "default" as const
    case "RETURNED": return "secondary" as const
    case "Bounced": return "destructive" as const
    case "Cancelled": return "secondary" as const
    default: return "outline" as const
  }
}

function getPDCStatusIcon(status: string) {
  switch (status) {
    case "Open": return Clock
    case "Deposited": return CheckCircle
    case "RETURNED": return AlertTriangle
    case "Bounced": return XCircle
    case "Cancelled": return XCircle
    default: return FileText
  }
}

export function TenantPDCSection({ tenantBpCode }: TenantPDCSectionProps) {
  const [pdcs, setPdcs] = useState<TenantPDC[]>([])
  const [stats, setStats] = useState<TenantPDCStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [pdcResult, statsResult] = await Promise.all([
          getTenantPDCs(tenantBpCode),
          getTenantPDCStats(tenantBpCode)
        ])

        if (pdcResult.success && pdcResult.data) {
          setPdcs(pdcResult.data)
        }

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data)
        }
      } catch (error) {
        console.error("Error fetching PDC data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenantBpCode])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
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
      {/* PDC Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                Total PDCs
              </CardTitle>
              <Badge variant="secondary">{stats.total}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                All post-dated checks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                Open PDCs
              </CardTitle>
              <Badge variant="outline">{stats.open}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.openAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Pending collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                Deposited
              </CardTitle>
              <Badge variant="default">{stats.deposited}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.depositedAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Successfully collected
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
                Past due date
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PDC List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History (PDCs)
          </CardTitle>
          <CardDescription>
            Post-dated checks issued by this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pdcs.length > 0 ? (
            <div className="space-y-4">
              {pdcs.map((pdc) => {
                const StatusIcon = getPDCStatusIcon(pdc.status)
                return (
                  <div key={pdc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{formatCurrency(pdc.amount)}</p>
                          <Badge variant={getPDCStatusVariant(pdc.status)}>
                            {pdc.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pdc.bankName} • Check #{pdc.checkNo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {pdc.refNo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Due: {format(new Date(pdc.dueDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {format(new Date(pdc.docDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No PDC records</h3>
              <p className="mt-2 text-muted-foreground">
                No post-dated checks have been issued by this tenant.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}