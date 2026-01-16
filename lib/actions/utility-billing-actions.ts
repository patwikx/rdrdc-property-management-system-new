"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UtilityType, Prisma } from "@prisma/client"
import { getBillStatus, BillStatus } from "@/lib/utils/bill-status"

/**
 * Utility Billing Server Actions
 * Requirements: 1.2, 1.3, 1.6, 1.7, 1.9, 1.10
 */

// Types for utility billing
export interface UtilityBillWithDetails {
  id: string
  dueDate: Date
  billingPeriodStart: Date
  billingPeriodEnd: Date
  amount: number
  consumption: number | null
  isPaid: boolean
  paidDate: Date | null
  utilityType: UtilityType
  status: BillStatus
  space: {
    id: string
    unitNumber: string
    property: {
      id: string
      propertyName: string
    }
  }
  tenant: {
    id: string
    businessName: string
    bpCode: string
  } | null
}

export interface UtilityBillingSummary {
  totalBills: number
  overdueCount: number
  upcomingCount: number
  totalAmountDue: number
  totalOverdueAmount: number
}

export interface GetUtilityBillsParams {
  propertyId?: string
  utilityType?: UtilityType
  status?: 'all' | 'paid' | 'unpaid' | 'overdue'
  sortBy?: 'dueDate' | 'amount' | 'space'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface GetUtilityBillsResult {
  bills: UtilityBillWithDetails[]
  summary: UtilityBillingSummary
  totalCount: number
  totalPages: number
}

/**
 * Get utility bills with filtering and sorting
 * Requirements: 1.2, 1.3, 1.6, 1.9, 1.10
 */
export async function getUtilityBills(
  params: GetUtilityBillsParams = {}
): Promise<GetUtilityBillsResult> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const {
    propertyId,
    utilityType,
    status = 'all',
    sortBy = 'dueDate',
    sortOrder = 'asc',
    page = 1,
    limit = 20
  } = params

  const skip = (page - 1) * limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build where clause for unit utility accounts
  const unitUtilityWhere: Prisma.UnitUtilityAccountWhereInput = {}
  
  if (utilityType) {
    unitUtilityWhere.utilityType = utilityType
  }

  if (propertyId) {
    unitUtilityWhere.unit = {
      propertyId: propertyId
    }
  }

  // Build where clause for bills
  const billWhere: Prisma.UtilityBillWhereInput = {
    unitUtilityAccountId: { not: null },
    unitUtilityAccount: unitUtilityWhere
  }

  // Filter by payment status
  if (status === 'paid') {
    billWhere.isPaid = true
  } else if (status === 'unpaid') {
    billWhere.isPaid = false
  } else if (status === 'overdue') {
    billWhere.isPaid = false
    billWhere.dueDate = { lt: today }
  }

  // Build order by clause
  let orderBy: Prisma.UtilityBillOrderByWithRelationInput = {}
  
  if (sortBy === 'dueDate') {
    orderBy = { dueDate: sortOrder }
  } else if (sortBy === 'amount') {
    orderBy = { amount: sortOrder }
  } else if (sortBy === 'space') {
    orderBy = {
      unitUtilityAccount: {
        unit: {
          unitNumber: sortOrder
        }
      }
    }
  }

  // Fetch bills with related data
  const [bills, totalCount] = await Promise.all([
    prisma.utilityBill.findMany({
      where: billWhere,
      skip,
      take: limit,
      orderBy,
      include: {
        unitUtilityAccount: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    propertyName: true
                  }
                },
                leaseUnits: {
                  where: {
                    lease: {
                      status: 'ACTIVE'
                    }
                  },
                  include: {
                    lease: {
                      include: {
                        tenant: {
                          select: {
                            id: true,
                            businessName: true,
                            bpCode: true
                          }
                        }
                      }
                    }
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    }),
    prisma.utilityBill.count({ where: billWhere })
  ])

  // Calculate summary for all matching bills (not just current page)
  const summary = await calculateBillingSummary(billWhere)

  // Transform bills to include status and flatten structure
  const transformedBills: UtilityBillWithDetails[] = bills
    .filter(bill => bill.unitUtilityAccount?.unit)
    .map(bill => {
      const unitAccount = bill.unitUtilityAccount!
      const unit = unitAccount.unit
      const activeLease = unit.leaseUnits[0]
      const tenant = activeLease?.lease?.tenant || null

      return {
        id: bill.id,
        dueDate: bill.dueDate,
        billingPeriodStart: bill.billingPeriodStart,
        billingPeriodEnd: bill.billingPeriodEnd,
        amount: bill.amount,
        consumption: bill.consumption,
        isPaid: bill.isPaid,
        paidDate: bill.paidDate,
        utilityType: unitAccount.utilityType,
        status: getBillStatus(bill.dueDate, bill.isPaid),
        space: {
          id: unit.id,
          unitNumber: unit.unitNumber,
          property: {
            id: unit.property.id,
            propertyName: unit.property.propertyName
          }
        },
        tenant: tenant ? {
          id: tenant.id,
          businessName: tenant.businessName,
          bpCode: tenant.bpCode
        } : null
      }
    })

  const totalPages = Math.ceil(totalCount / limit)

  return {
    bills: transformedBills,
    summary,
    totalCount,
    totalPages
  }
}

/**
 * Calculate billing summary statistics
 * Requirements: 1.7
 */
async function calculateBillingSummary(
  baseWhere: Prisma.UtilityBillWhereInput
): Promise<UtilityBillingSummary> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // Remove status-specific filters for summary calculation
  const summaryWhere: Prisma.UtilityBillWhereInput = {
    unitUtilityAccountId: baseWhere.unitUtilityAccountId,
    unitUtilityAccount: baseWhere.unitUtilityAccount
  }

  const [
    totalBills,
    overdueCount,
    upcomingCount,
    unpaidBills,
    overdueBills
  ] = await Promise.all([
    // Total bills count
    prisma.utilityBill.count({ where: summaryWhere }),
    
    // Overdue count (unpaid and past due)
    prisma.utilityBill.count({
      where: {
        ...summaryWhere,
        isPaid: false,
        dueDate: { lt: today }
      }
    }),
    
    // Upcoming count (unpaid and due within 7 days)
    prisma.utilityBill.count({
      where: {
        ...summaryWhere,
        isPaid: false,
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow
        }
      }
    }),
    
    // Total amount due (all unpaid)
    prisma.utilityBill.aggregate({
      where: {
        ...summaryWhere,
        isPaid: false
      },
      _sum: {
        amount: true
      }
    }),
    
    // Total overdue amount
    prisma.utilityBill.aggregate({
      where: {
        ...summaryWhere,
        isPaid: false,
        dueDate: { lt: today }
      },
      _sum: {
        amount: true
      }
    })
  ])

  return {
    totalBills,
    overdueCount,
    upcomingCount,
    totalAmountDue: unpaidBills._sum.amount || 0,
    totalOverdueAmount: overdueBills._sum.amount || 0
  }
}

/**
 * Get utility billing summary only (without bills list)
 * Requirements: 1.7
 */
export async function getUtilityBillingSummary(
  propertyId?: string,
  utilityType?: UtilityType
): Promise<UtilityBillingSummary> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const unitUtilityWhere: Prisma.UnitUtilityAccountWhereInput = {}
  
  if (utilityType) {
    unitUtilityWhere.utilityType = utilityType
  }

  if (propertyId) {
    unitUtilityWhere.unit = {
      propertyId: propertyId
    }
  }

  const billWhere: Prisma.UtilityBillWhereInput = {
    unitUtilityAccountId: { not: null },
    unitUtilityAccount: unitUtilityWhere
  }

  return calculateBillingSummary(billWhere)
}

/**
 * Get all properties for filter dropdown
 */
export async function getPropertiesForFilter(): Promise<Array<{ id: string; propertyName: string }>> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      propertyName: true
    },
    orderBy: {
      propertyName: 'asc'
    }
  })

  return properties
}
