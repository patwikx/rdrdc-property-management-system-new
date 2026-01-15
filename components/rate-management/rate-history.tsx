"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type RateHistoryWithDetails } from "@/lib/actions/rate-actions"
import { RateChangeType } from "@prisma/client"
import { History, TrendingUp, TrendingDown, Minus, Bot, User } from "lucide-react"
import { format } from "date-fns"

interface RateHistoryProps {
  leaseUnitId: string
  history: RateHistoryWithDetails[]
}

const changeTypeLabels: Record<RateChangeType, string> = {
  STANDARD_INCREASE: "Standard Increase",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
  RENEWAL_INCREASE: "Renewal Increase",
  OVERRIDE_REQUEST: "Override Request",
}

const changeTypeVariants: Record<RateChangeType, "default" | "secondary" | "outline" | "destructive"> = {
  STANDARD_INCREASE: "default",
  MANUAL_ADJUSTMENT: "secondary",
  RENEWAL_INCREASE: "outline",
  OVERRIDE_REQUEST: "destructive",
}

function getRateChangeIcon(previousRate: number, newRate: number) {
  if (newRate > previousRate) {
    return <TrendingUp className="h-4 w-4 text-green-500" />
  } else if (newRate < previousRate) {
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function calculatePercentageChange(previousRate: number, newRate: number): string {
  if (previousRate === 0) return "N/A"
  const change = ((newRate - previousRate) / previousRate) * 100
  const sign = change >= 0 ? "+" : ""
  return `${sign}${change.toFixed(2)}%`
}

export function RateHistory({ leaseUnitId, history }: RateHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Rate History
          </CardTitle>
          <CardDescription>
            Track all rate changes for this lease unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No rate history available for this lease unit.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Rate History
          <Badge variant="secondary">{history.length} changes</Badge>
        </CardTitle>
        <CardDescription>
          Chronological record of all rate changes for this lease unit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Effective Date</TableHead>
              <TableHead>Change Type</TableHead>
              <TableHead className="text-right">Previous Rate</TableHead>
              <TableHead className="text-right">New Rate</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {format(new Date(record.effectiveDate), "PP")}
                </TableCell>
                <TableCell>
                  <Badge variant={changeTypeVariants[record.changeType]}>
                    {changeTypeLabels[record.changeType]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ₱{record.previousRate.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {getRateChangeIcon(record.previousRate, record.newRate)}
                    ₱{record.newRate.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={
                    record.newRate > record.previousRate 
                      ? "text-green-600" 
                      : record.newRate < record.previousRate 
                        ? "text-red-600" 
                        : "text-muted-foreground"
                  }>
                    {calculatePercentageChange(record.previousRate, record.newRate)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {record.isAutoApplied ? (
                      <>
                        <Bot className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Auto</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Manual</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                    {record.reason || "-"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Compact version for embedding in other components
interface RateHistoryCompactProps {
  history: RateHistoryWithDetails[]
  maxItems?: number
}

export function RateHistoryCompact({ history, maxItems = 5 }: RateHistoryCompactProps) {
  const displayHistory = history.slice(0, maxItems)

  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No rate history available.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {displayHistory.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
        >
          <div className="flex items-center gap-2">
            {getRateChangeIcon(record.previousRate, record.newRate)}
            <div>
              <div className="text-sm font-medium">
                ₱{record.previousRate.toLocaleString()} → ₱{record.newRate.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(record.effectiveDate), "PP")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {changeTypeLabels[record.changeType]}
            </Badge>
            {record.isAutoApplied && (
              <Bot className="h-3 w-3 text-blue-500" />
            )}
          </div>
        </div>
      ))}
      {history.length > maxItems && (
        <div className="text-xs text-muted-foreground text-center">
          +{history.length - maxItems} more changes
        </div>
      )}
    </div>
  )
}
