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
import type { UtilityBillWithDetails } from "@/lib/actions/utility-billing-actions"

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
      case "ELECTRICITY": return "Electricity"
      case "WATER": return "Water"
      case "OTHERS": return "Others"
      default: return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="outline" className="rounded-none border-emerald-500 text-emerald-600 bg-emerald-50/10 uppercase">Paid</Badge>
      case "OVERDUE":
        return <Badge variant="outline" className="rounded-none border-rose-500 text-rose-600 bg-rose-50/10 uppercase">Overdue</Badge>
      case "UNPAID":
        return <Badge variant="outline" className="rounded-none border-amber-500 text-amber-600 bg-amber-50/10 uppercase">Unpaid</Badge>
      default:
        return <Badge variant="outline" className="rounded-none border-muted text-muted-foreground uppercase">{status}</Badge>
    }
  }

  const handleRowClick = (bill: UtilityBillWithDetails) => {
    router.push(`/properties/${bill.space.property.id}/units/${bill.space.id}?tab=utilities`)
  }

  if (bills.length === 0) {
    return (
      <div className="border border-t-0 border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Space</TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Property</TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Type</TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Period</TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Due Date</TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5 text-right">Amount</TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Tenant</TableHead>
              <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground font-mono uppercase tracking-wide">
                No utility bills found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="border border-t-0 border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Space</TableHead>
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Property</TableHead>
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Type</TableHead>
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Billing Period</TableHead>
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Due Date</TableHead>
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5 text-right">Amount</TableHead>
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Tenant</TableHead>
            <TableHead className="h-9 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-muted/5">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow
              key={bill.id}
              className="cursor-pointer hover:bg-muted/5 border-border transition-colors group"
              onClick={() => handleRowClick(bill)}
            >
              <TableCell className="font-mono text-xs font-bold text-foreground">
                {bill.space.unitNumber}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {bill.space.property.propertyName}
              </TableCell>
              <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                {getUtilityTypeLabel(bill.utilityType)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {format(new Date(bill.billingPeriodStart), "MM/dd")} - {format(new Date(bill.billingPeriodEnd), "MM/dd/yy")}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {format(new Date(bill.dueDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                {formatCurrency(bill.amount)}
              </TableCell>
              <TableCell>
                {bill.tenant ? (
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-medium truncate max-w-[150px]">{bill.tenant.businessName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{bill.tenant.bpCode}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs font-mono">—</span>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(bill.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
