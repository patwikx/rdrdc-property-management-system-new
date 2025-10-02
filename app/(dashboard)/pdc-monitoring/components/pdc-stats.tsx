"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"

type PDC = {
  id: string
  amount: number
  status: "Open" | "Deposited" | "RETURNED" | "Bounced" | "Cancelled"
  dueDate: Date
}

interface PDCStatsProps {
  pdcs: PDC[]
}

export function PDCStats({ pdcs }: PDCStatsProps) {
  const stats = pdcs.reduce(
    (acc, pdc) => {
      acc.total += pdc.amount
      acc.count += 1
      
      switch (pdc.status) {
        case "Open":
          acc.open += pdc.amount
          acc.openCount += 1
          break
        case "Deposited":
          acc.deposited += pdc.amount
          acc.depositedCount += 1
          break
        case "RETURNED":
          acc.returned += pdc.amount
          acc.returnedCount += 1
          break
        case "Bounced":
          acc.bounced += pdc.amount
          acc.bouncedCount += 1
          break
        case "Cancelled":
          acc.cancelled += pdc.amount
          acc.cancelledCount += 1
          break
      }

      // Check if due within 30 days
      const daysUntilDue = Math.ceil(
        (new Date(pdc.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilDue <= 30 && daysUntilDue >= 0 && pdc.status === "Open") {
        acc.dueSoon += pdc.amount
        acc.dueSoonCount += 1
      }

      return acc
    },
    {
      total: 0,
      count: 0,
      open: 0,
      openCount: 0,
      deposited: 0,
      depositedCount: 0,
      returned: 0,
      returnedCount: 0,
      bounced: 0,
      bouncedCount: 0,
      cancelled: 0,
      cancelledCount: 0,
      dueSoon: 0,
      dueSoonCount: 0,
    }
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const statsData = [
    {
      title: "Total PDCs",
      amount: stats.total,
      count: stats.count,
      description: "All post-dated checks",
      variant: "secondary" as const,
      icon: FileText
    },
    {
      title: "Open PDCs", 
      amount: stats.open,
      count: stats.openCount,
      description: "Pending collection",
      variant: "outline" as const,
      icon: Clock
    },
    {
      title: "Due Soon",
      amount: stats.dueSoon,
      count: stats.dueSoonCount,
      description: "Due within 30 days",
      variant: "destructive" as const,
      icon: AlertTriangle
    },
    {
      title: "Deposited",
      amount: stats.deposited,
      count: stats.depositedCount,
      description: "Successfully collected",
      variant: "default" as const,
      icon: CheckCircle
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                {stat.title}
              </CardTitle>
              <Badge variant={stat.variant}>{stat.count}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stat.amount)}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}