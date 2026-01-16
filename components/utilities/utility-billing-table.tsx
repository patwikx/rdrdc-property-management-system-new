"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getBillStatusColor, getBillStatusLabel } from "@/lib/utils/bill-status"
import type { UtilityBillWithDetails } from "@/lib/actions/utility-billing-actions"

/**
 * UtilityBillingTable Component
 * Displays utility bills with status indicators
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.8, 1.10
 */

interface UtilityBillingTableProps {
  bills: UtilityBillWithDetails[]
}

export function UtilityBillingTable({ bills }: UtilityBillingTableProps) {
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getUtilityTypeLabel = (type: string) => {
    switch (type) {
      case "ELECTRICITY":
        return "Electricity"
      case "WATER":
        return "Water"
      case "OTHERS":
        return "Others"
      default:
        return type
    }
  }

  const handleRowClick = (bill: UtilityBillWithDetails) => {
    // Navigate to the space's utility details
    router.push(`/properties/${bill.space.property.id}/units/${bill.space.id}?tab=utilities`)
  }

  if (bills.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Space</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Utility Type</TableHead>
              <TableHead>Billing Period</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No utility bills found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Space</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Utility Type</TableHead>
            <TableHead>Billing Period</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow
              key={bill.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(bill)}
            >
              <TableCell className="font-medium">
                {bill.space.unitNumber}
              </TableCell>
              <TableCell>
                {bill.space.property.propertyName}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getUtilityTypeLabel(bill.utilityType)}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(bill.billingPeriodStart), "MMM d")} -{" "}
                {format(new Date(bill.billingPeriodEnd), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                {format(new Date(bill.dueDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(bill.amount)}
              </TableCell>
              <TableCell>
                {bill.tenant ? (
                  <div>
                    <div className="font-medium">{bill.tenant.businessName}</div>
                    <div className="text-xs text-muted-foreground">
                      {bill.tenant.bpCode}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getBillStatusColor(bill.status)}>
                  {getBillStatusLabel(bill.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
