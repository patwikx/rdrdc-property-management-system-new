"use server"

import { prisma } from "@/lib/prisma"

export interface TenantNotice {
  id: string
  noticeNumber: number
  noticeType: string
  dateIssued: Date
  forMonth: string
  forYear: number
  totalAmount: number
  isSettled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TenantNoticeStats {
  total: number
  totalAmount: number
  settled: number
  settledAmount: number
  outstanding: number
  outstandingAmount: number
  overdue: number
  overdueAmount: number
}

export async function getTenantNotices(tenantId: string): Promise<{
  success: boolean
  data?: TenantNotice[]
  error?: string
}> {
  try {
    const notices = await prisma.tenantNotice.findMany({
      where: {
        tenantId: tenantId
      },
      orderBy: {
        dateIssued: 'desc'
      }
    })

    return {
      success: true,
      data: notices.map((notice) => ({
        id: notice.id,
        noticeNumber: notice.noticeNumber,
        noticeType: notice.noticeType,
        dateIssued: notice.dateIssued,
        forMonth: notice.forMonth,
        forYear: notice.forYear,
        totalAmount: notice.totalAmount,
        isSettled: notice.isSettled,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt
      }))
    }
  } catch (error) {
    console.error("Error fetching tenant notices:", error)
    return {
      success: false,
      error: "Failed to fetch notice records"
    }
  }
}

export async function getTenantNoticeStats(tenantId: string): Promise<{
  success: boolean
  data?: TenantNoticeStats
  error?: string
}> {
  try {
    const notices = await prisma.tenantNotice.findMany({
      where: {
        tenantId: tenantId
      }
    })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    const stats = notices.reduce((acc: {
      total: number
      totalAmount: number
      settled: number
      settledAmount: number
      outstanding: number
      outstandingAmount: number
      overdue: number
      overdueAmount: number
    }, notice) => {
      acc.total += 1
      acc.totalAmount += notice.totalAmount

      if (notice.isSettled) {
        acc.settled += 1
        acc.settledAmount += notice.totalAmount
      } else {
        acc.outstanding += 1
        acc.outstandingAmount += notice.totalAmount

        // Check if overdue (notice is from previous months/years and not settled)
        const noticeYear = notice.forYear
        const noticeMonth = parseInt(notice.forMonth)
        
        if (noticeYear < currentYear || (noticeYear === currentYear && noticeMonth < currentMonth)) {
          acc.overdue += 1
          acc.overdueAmount += notice.totalAmount
        }
      }

      return acc
    }, {
      total: 0,
      totalAmount: 0,
      settled: 0,
      settledAmount: 0,
      outstanding: 0,
      outstandingAmount: 0,
      overdue: 0,
      overdueAmount: 0
    })

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error("Error fetching tenant notice stats:", error)
    return {
      success: false,
      error: "Failed to fetch notice statistics"
    }
  }
}