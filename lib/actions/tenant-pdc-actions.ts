"use server"

import { prisma } from "@/lib/prisma"

export interface TenantPDC {
  id: string
  refNo: string
  bankName: string
  checkNo: string
  amount: number
  dueDate: Date
  status: "Open" | "Deposited" | "RETURNED" | "Bounced" | "Cancelled"
  remarks: string | null
  docDate: Date
  updatedAt: Date
}

export interface TenantPDCStats {
  total: number
  totalAmount: number
  open: number
  openAmount: number
  deposited: number
  depositedAmount: number
  overdue: number
  overdueAmount: number
}

export async function getTenantPDCs(tenantBpCode: string): Promise<{
  success: boolean
  data?: TenantPDC[]
  error?: string
}> {
  try {
    const pdcs = await prisma.pDC.findMany({
      where: {
        bpCode: tenantBpCode
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    return {
      success: true,
      data: pdcs.map(pdc => ({
        id: pdc.id,
        refNo: pdc.refNo,
        bankName: pdc.bankName,
        checkNo: pdc.checkNo,
        amount: pdc.amount,
        dueDate: pdc.dueDate,
        status: pdc.status as "Open" | "Deposited" | "RETURNED" | "Bounced" | "Cancelled",
        remarks: pdc.remarks,
        docDate: pdc.docDate,
        updatedAt: pdc.updatedAt
      }))
    }
  } catch (error) {
    console.error("Error fetching tenant PDCs:", error)
    return {
      success: false,
      error: "Failed to fetch PDC records"
    }
  }
}

export async function getTenantPDCStats(tenantBpCode: string): Promise<{
  success: boolean
  data?: TenantPDCStats
  error?: string
}> {
  try {
    const pdcs = await prisma.pDC.findMany({
      where: {
        bpCode: tenantBpCode
      }
    })

    const now = new Date()
    
    const stats = pdcs.reduce((acc, pdc) => {
      acc.total += 1
      acc.totalAmount += pdc.amount

      switch (pdc.status) {
        case "Open":
          acc.open += 1
          acc.openAmount += pdc.amount
          // Check if overdue
          if (new Date(pdc.dueDate) < now) {
            acc.overdue += 1
            acc.overdueAmount += pdc.amount
          }
          break
        case "Deposited":
          acc.deposited += 1
          acc.depositedAmount += pdc.amount
          break
      }

      return acc
    }, {
      total: 0,
      totalAmount: 0,
      open: 0,
      openAmount: 0,
      deposited: 0,
      depositedAmount: 0,
      overdue: 0,
      overdueAmount: 0
    })

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error("Error fetching tenant PDC stats:", error)
    return {
      success: false,
      error: "Failed to fetch PDC statistics"
    }
  }
}