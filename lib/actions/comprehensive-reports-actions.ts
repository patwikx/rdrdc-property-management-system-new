"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { 
  UnitStatus, 
  PropertyType, 
  LeaseStatus, 
  TenantStatus,
  RateChangeType,
  RateApprovalStatus
} from "@prisma/client"

// ============================================================================
// SHARED TYPES & INTERFACES
// ============================================================================

/**
 * Base filter interface for all reports
 * All filters are optional to allow flexible querying
 */
export interface BaseReportFilters {
  propertyId?: string
  propertyIds?: string[]
  propertyType?: PropertyType
  startDate?: Date
  endDate?: Date
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * Standard server action response
 */
export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// 1. OCCUPANCY REPORT
// ============================================================================

export interface OccupancyReportFilters extends BaseReportFilters {
  unitStatus?: UnitStatus | UnitStatus[]
  minOccupancyRate?: number
  maxOccupancyRate?: number
  includeUnitDetails?: boolean
}

export interface OccupancyReportItem {
  property: {
    id: string
    propertyCode: string
    propertyName: string
    address: string
    propertyType: PropertyType
    leasableArea: number
  }
  occupancy: {
    totalUnits: number
    occupiedUnits: number
    vacantUnits: number
    maintenanceUnits: number
    reservedUnits: number
    occupancyRate: number
    vacancyRate: number
  }
  area: {
    totalArea: number
    occupiedArea: number
    vacantArea: number
    areaOccupancyRate: number
  }
  revenue: {
    potentialMonthlyRevenue: number
    actualMonthlyRevenue: number
    opportunityLoss: number
    opportunityLossPercentage: number
  }
  units?: OccupancyUnitDetail[]
}

export interface OccupancyUnitDetail {
  id: string
  unitNumber: string
  totalArea: number
  totalRent: number
  status: UnitStatus
  tenant: {
    bpCode: string
    businessName: string
  } | null
  leaseEndDate: Date | null
}

/**
 * Get comprehensive occupancy report with filters
 * Optimized with Promise.all for parallel data fetching
 */
export async function getOccupancyReport(
  filters: OccupancyReportFilters = {}
): Promise<ActionResponse<OccupancyReportItem[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Build property filter
    const propertyWhere: Record<string, unknown> = {}
    
    if (filters.propertyId) {
      propertyWhere.id = filters.propertyId
    }
    
    if (filters.propertyIds?.length) {
      propertyWhere.id = { in: filters.propertyIds }
    }
    
    if (filters.propertyType) {
      propertyWhere.propertyType = filters.propertyType
    }

    const properties = await prisma.property.findMany({
      where: propertyWhere,
      include: {
        units: {
          include: {
            leaseUnits: {
              where: {
                lease: {
                  status: LeaseStatus.ACTIVE
                }
              },
              include: {
                lease: {
                  include: {
                    tenant: {
                      select: {
                        bpCode: true,
                        businessName: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        propertyName: filters.sortOrder ?? 'asc'
      }
    })

    const reportData: OccupancyReportItem[] = properties
      .map(property => {
        const units = property.units
        const totalUnits = units.length
        
        // Count by status - using early returns pattern
        const occupiedUnits = units.filter(u => u.status === UnitStatus.OCCUPIED).length
        const vacantUnits = units.filter(u => u.status === UnitStatus.VACANT).length
        const maintenanceUnits = units.filter(u => u.status === UnitStatus.MAINTENANCE).length
        const reservedUnits = units.filter(u => u.status === UnitStatus.RESERVED).length

        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

        // Apply occupancy rate filter early
        if (filters.minOccupancyRate !== undefined && occupancyRate < filters.minOccupancyRate) {
          return null
        }
        if (filters.maxOccupancyRate !== undefined && occupancyRate > filters.maxOccupancyRate) {
          return null
        }

        // Calculate areas
        const totalArea = units.reduce((sum, u) => sum + u.totalArea, 0)
        const occupiedArea = units
          .filter(u => u.status === UnitStatus.OCCUPIED)
          .reduce((sum, u) => sum + u.totalArea, 0)
        const vacantArea = units
          .filter(u => u.status === UnitStatus.VACANT)
          .reduce((sum, u) => sum + u.totalArea, 0)

        // Calculate revenue
        const potentialMonthlyRevenue = units.reduce((sum, u) => sum + u.totalRent, 0)
        const actualMonthlyRevenue = units
          .filter(u => u.status === UnitStatus.OCCUPIED)
          .reduce((sum, u) => sum + u.totalRent, 0)
        const opportunityLoss = potentialMonthlyRevenue - actualMonthlyRevenue

        // Build unit details if requested
        let unitDetails: OccupancyUnitDetail[] | undefined
        if (filters.includeUnitDetails) {
          unitDetails = units.map(unit => {
            const activeLease = unit.leaseUnits.find(lu => lu.lease.status === LeaseStatus.ACTIVE)
            return {
              id: unit.id,
              unitNumber: unit.unitNumber,
              totalArea: unit.totalArea,
              totalRent: unit.totalRent,
              status: unit.status,
              tenant: activeLease?.lease.tenant ?? null,
              leaseEndDate: activeLease?.lease.endDate ?? null
            }
          })

          // Apply unit status filter if specified
          if (filters.unitStatus) {
            const statusArray = Array.isArray(filters.unitStatus) 
              ? filters.unitStatus 
              : [filters.unitStatus]
            unitDetails = unitDetails.filter(u => statusArray.includes(u.status))
          }
        }

        return {
          property: {
            id: property.id,
            propertyCode: property.propertyCode,
            propertyName: property.propertyName,
            address: property.address,
            propertyType: property.propertyType,
            leasableArea: property.leasableArea,
          },
          occupancy: {
            totalUnits,
            occupiedUnits,
            vacantUnits,
            maintenanceUnits,
            reservedUnits,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            vacancyRate: Math.round((100 - occupancyRate) * 100) / 100,
          },
          area: {
            totalArea,
            occupiedArea,
            vacantArea,
            areaOccupancyRate: totalArea > 0 
              ? Math.round((occupiedArea / totalArea) * 100 * 100) / 100 
              : 0,
          },
          revenue: {
            potentialMonthlyRevenue,
            actualMonthlyRevenue,
            opportunityLoss,
            opportunityLossPercentage: potentialMonthlyRevenue > 0
              ? Math.round((opportunityLoss / potentialMonthlyRevenue) * 100 * 100) / 100
              : 0,
          },
          units: unitDetails,
        }
      })
      .filter(Boolean) as OccupancyReportItem[]

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error fetching occupancy report:", error)
    return { success: false, error: "Failed to fetch occupancy report" }
  }
}

// ============================================================================
// 2. LEASE AGING REPORT
// ============================================================================

export type AgingBucket = '30' | '60' | '90' | '120+' | 'expired'

export interface LeaseAgingFilters extends BaseReportFilters {
  tenantId?: string
  agingBuckets?: AgingBucket[]
  leaseStatus?: LeaseStatus | LeaseStatus[]
  includeExpired?: boolean
}

export interface LeaseAgingItem {
  id: string
  tenant: {
    id: string
    bpCode: string
    businessName: string
    company: string
    email: string
    phone: string
    status: TenantStatus
  }
  lease: {
    startDate: Date
    endDate: Date
    totalRentAmount: number
    securityDeposit: number
    status: LeaseStatus
  }
  aging: {
    daysUntilExpiry: number
    bucket: AgingBucket
    isExpired: boolean
    isExpiringSoon: boolean // within 30 days
    isCritical: boolean // within 7 days
  }
  units: Array<{
    id: string
    unitNumber: string
    propertyName: string
    propertyCode: string
    rentAmount: number
  }>
}

export interface LeaseAgingSummary {
  totalLeases: number
  expired: number
  expiring30Days: number
  expiring60Days: number
  expiring90Days: number
  expiring120Plus: number
  totalRevenueAtRisk: number
}

export interface LeaseAgingReportResult {
  items: LeaseAgingItem[]
  summary: LeaseAgingSummary
}

/**
 * Get lease aging report with bucket analysis
 */
export async function getLeaseAgingReport(
  filters: LeaseAgingFilters = {}
): Promise<ActionResponse<LeaseAgingReportResult>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    
    // Build where clause
    const leaseWhere: Record<string, unknown> = {}

    if (filters.tenantId) {
      leaseWhere.tenantId = filters.tenantId
    }

    if (filters.leaseStatus) {
      const statusArray = Array.isArray(filters.leaseStatus) 
        ? filters.leaseStatus 
        : [filters.leaseStatus]
      leaseWhere.status = { in: statusArray }
    } else if (!filters.includeExpired) {
      // Default: only active leases
      leaseWhere.status = LeaseStatus.ACTIVE
    }

    if (filters.propertyId || filters.propertyIds?.length) {
      leaseWhere.leaseUnits = {
        some: {
          unit: {
            propertyId: filters.propertyId ?? { in: filters.propertyIds }
          }
        }
      }
    }

    const leases = await prisma.lease.findMany({
      where: leaseWhere,
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            company: true,
            email: true,
            phone: true,
            status: true,
          }
        },
        leaseUnits: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    propertyName: true,
                    propertyCode: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    })

    // Calculate aging for each lease
    const items: LeaseAgingItem[] = leases.map(lease => {
      const daysUntilExpiry = Math.ceil(
        (lease.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      const isExpired = daysUntilExpiry < 0
      const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30
      const isCritical = daysUntilExpiry >= 0 && daysUntilExpiry <= 7

      // Determine bucket
      let bucket: AgingBucket
      if (isExpired) {
        bucket = 'expired'
      } else if (daysUntilExpiry <= 30) {
        bucket = '30'
      } else if (daysUntilExpiry <= 60) {
        bucket = '60'
      } else if (daysUntilExpiry <= 90) {
        bucket = '90'
      } else {
        bucket = '120+'
      }

      return {
        id: lease.id,
        tenant: lease.tenant,
        lease: {
          startDate: lease.startDate,
          endDate: lease.endDate,
          totalRentAmount: lease.totalRentAmount,
          securityDeposit: lease.securityDeposit,
          status: lease.status,
        },
        aging: {
          daysUntilExpiry,
          bucket,
          isExpired,
          isExpiringSoon,
          isCritical,
        },
        units: lease.leaseUnits.map(lu => ({
          id: lu.unit.id,
          unitNumber: lu.unit.unitNumber,
          propertyName: lu.unit.property.propertyName,
          propertyCode: lu.unit.property.propertyCode,
          rentAmount: lu.rentAmount,
        }))
      }
    })

    // Apply bucket filter if specified
    let filteredItems = items
    if (filters.agingBuckets?.length) {
      filteredItems = items.filter(item => 
        filters.agingBuckets!.includes(item.aging.bucket)
      )
    }

    // Calculate summary
    const summary: LeaseAgingSummary = {
      totalLeases: items.length,
      expired: items.filter(i => i.aging.bucket === 'expired').length,
      expiring30Days: items.filter(i => i.aging.bucket === '30').length,
      expiring60Days: items.filter(i => i.aging.bucket === '60').length,
      expiring90Days: items.filter(i => i.aging.bucket === '90').length,
      expiring120Plus: items.filter(i => i.aging.bucket === '120+').length,
      totalRevenueAtRisk: items
        .filter(i => i.aging.isExpiringSoon || i.aging.isExpired)
        .reduce((sum, i) => sum + i.lease.totalRentAmount, 0),
    }

    return { 
      success: true, 
      data: { 
        items: filteredItems, 
        summary 
      } 
    }
  } catch (error) {
    console.error("Error fetching lease aging report:", error)
    return { success: false, error: "Failed to fetch lease aging report" }
  }
}

// ============================================================================
// 3. RATE CHANGE HISTORY REPORT
// ============================================================================

export interface RateChangeHistoryFilters extends BaseReportFilters {
  tenantId?: string
  leaseId?: string
  unitId?: string
  changeType?: RateChangeType | RateChangeType[]
  isAutoApplied?: boolean
  minChangePercent?: number
  maxChangePercent?: number
  approvalStatus?: RateApprovalStatus | RateApprovalStatus[]
}

export interface RateChangeHistoryItem {
  id: string
  leaseUnit: {
    id: string
    unitNumber: string
    propertyName: string
    propertyCode: string
  }
  tenant: {
    bpCode: string
    businessName: string
  }
  rateChange: {
    previousRate: number
    newRate: number
    changeAmount: number
    changePercentage: number
    changeType: RateChangeType
    effectiveDate: Date
    reason: string | null
    isAutoApplied: boolean
  }
  approval: {
    requestId: string | null
    status: RateApprovalStatus | null
    requestedBy: string | null
    approvedBy: string | null
    approvedAt: Date | null
  } | null
  createdAt: Date
}

export interface RateChangeHistorySummary {
  totalChanges: number
  averageChangePercent: number
  totalIncreaseAmount: number
  changesByType: Record<RateChangeType, number>
  autoAppliedCount: number
  manualCount: number
}

export interface RateChangeHistoryResult {
  items: RateChangeHistoryItem[]
  summary: RateChangeHistorySummary
}

/**
 * Get comprehensive rate change history with filters
 */
export async function getRateChangeHistoryReport(
  filters: RateChangeHistoryFilters = {}
): Promise<ActionResponse<RateChangeHistoryResult>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Build where clause for rate history
    const historyWhere: Record<string, unknown> = {}

    if (filters.leaseId) {
      historyWhere.leaseUnit = {
        leaseId: filters.leaseId
      }
    }

    if (filters.unitId) {
      historyWhere.leaseUnit = {
        ...historyWhere.leaseUnit as Record<string, unknown>,
        unitId: filters.unitId
      }
    }

    if (filters.changeType) {
      const typeArray = Array.isArray(filters.changeType) 
        ? filters.changeType 
        : [filters.changeType]
      historyWhere.changeType = { in: typeArray }
    }

    if (filters.isAutoApplied !== undefined) {
      historyWhere.isAutoApplied = filters.isAutoApplied
    }

    if (filters.startDate || filters.endDate) {
      historyWhere.effectiveDate = {}
      if (filters.startDate) {
        (historyWhere.effectiveDate as Record<string, Date>).gte = filters.startDate
      }
      if (filters.endDate) {
        (historyWhere.effectiveDate as Record<string, Date>).lte = filters.endDate
      }
    }

    if (filters.tenantId) {
      historyWhere.leaseUnit = {
        ...historyWhere.leaseUnit as Record<string, unknown>,
        lease: {
          tenantId: filters.tenantId
        }
      }
    }

    if (filters.propertyId || filters.propertyIds?.length) {
      historyWhere.leaseUnit = {
        ...historyWhere.leaseUnit as Record<string, unknown>,
        unit: {
          propertyId: filters.propertyId ?? { in: filters.propertyIds }
        }
      }
    }

    const rateHistories = await prisma.rateHistory.findMany({
      where: historyWhere,
      include: {
        leaseUnit: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    propertyName: true,
                    propertyCode: true,
                  }
                }
              }
            },
            lease: {
              include: {
                tenant: {
                  select: {
                    bpCode: true,
                    businessName: true,
                  }
                }
              }
            }
          }
        },
        rateRequest: {
          include: {
            requestedBy: {
              select: {
                firstName: true,
                lastName: true,
              }
            },
            approvedBy: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
      orderBy: filters.sortBy === 'changePercentage'
        ? undefined // Will sort in memory
        : { effectiveDate: filters.sortOrder ?? 'desc' }
    })

    // Transform to report items
    let items: RateChangeHistoryItem[] = rateHistories.map(history => {
      const changeAmount = history.newRate - history.previousRate
      const changePercentage = history.previousRate > 0 
        ? (changeAmount / history.previousRate) * 100 
        : 0

      return {
        id: history.id,
        leaseUnit: {
          id: history.leaseUnit.id,
          unitNumber: history.leaseUnit.unit.unitNumber,
          propertyName: history.leaseUnit.unit.property.propertyName,
          propertyCode: history.leaseUnit.unit.property.propertyCode,
        },
        tenant: history.leaseUnit.lease.tenant,
        rateChange: {
          previousRate: history.previousRate,
          newRate: history.newRate,
          changeAmount,
          changePercentage: Math.round(changePercentage * 100) / 100,
          changeType: history.changeType,
          effectiveDate: history.effectiveDate,
          reason: history.reason,
          isAutoApplied: history.isAutoApplied,
        },
        approval: history.rateRequest ? {
          requestId: history.requestId,
          status: history.rateRequest.status,
          requestedBy: history.rateRequest.requestedBy 
            ? `${history.rateRequest.requestedBy.firstName} ${history.rateRequest.requestedBy.lastName}`
            : null,
          approvedBy: history.rateRequest.approvedBy
            ? `${history.rateRequest.approvedBy.firstName} ${history.rateRequest.approvedBy.lastName}`
            : null,
          approvedAt: history.rateRequest.approvedAt,
        } : null,
        createdAt: history.createdAt,
      }
    })

    // Apply percentage filters in memory
    if (filters.minChangePercent !== undefined) {
      items = items.filter(i => i.rateChange.changePercentage >= filters.minChangePercent!)
    }
    if (filters.maxChangePercent !== undefined) {
      items = items.filter(i => i.rateChange.changePercentage <= filters.maxChangePercent!)
    }

    // Apply approval status filter if specified
    if (filters.approvalStatus) {
      const statusArray = Array.isArray(filters.approvalStatus)
        ? filters.approvalStatus
        : [filters.approvalStatus]
      items = items.filter(i => 
        i.approval?.status && statusArray.includes(i.approval.status)
      )
    }

    // Sort by change percentage if requested
    if (filters.sortBy === 'changePercentage') {
      items.sort((a, b) => 
        filters.sortOrder === 'asc'
          ? a.rateChange.changePercentage - b.rateChange.changePercentage
          : b.rateChange.changePercentage - a.rateChange.changePercentage
      )
    }

    // Calculate summary
    const changesByType: Record<RateChangeType, number> = {
      [RateChangeType.STANDARD_INCREASE]: 0,
      [RateChangeType.MANUAL_ADJUSTMENT]: 0,
      [RateChangeType.RENEWAL_INCREASE]: 0,
      [RateChangeType.OVERRIDE_REQUEST]: 0,
    }

    items.forEach(item => {
      changesByType[item.rateChange.changeType]++
    })

    const summary: RateChangeHistorySummary = {
      totalChanges: items.length,
      averageChangePercent: items.length > 0
        ? Math.round(
            (items.reduce((sum, i) => sum + i.rateChange.changePercentage, 0) / items.length) * 100
          ) / 100
        : 0,
      totalIncreaseAmount: items.reduce((sum, i) => sum + i.rateChange.changeAmount, 0),
      changesByType,
      autoAppliedCount: items.filter(i => i.rateChange.isAutoApplied).length,
      manualCount: items.filter(i => !i.rateChange.isAutoApplied).length,
    }

    return { 
      success: true, 
      data: { 
        items, 
        summary 
      } 
    }
  } catch (error) {
    console.error("Error fetching rate change history report:", error)
    return { success: false, error: "Failed to fetch rate change history report" }
  }
}

// ============================================================================
// 4. LEASE RENEWALS DUE REPORT
// ============================================================================

export interface LeaseRenewalsDueFilters extends BaseReportFilters {
  tenantId?: string
  daysAhead?: number // Default: 90
  includeExpired?: boolean
  leaseStatus?: LeaseStatus | LeaseStatus[]
}

export interface LeaseRenewalsDueItem {
  id: string
  tenant: {
    id: string
    bpCode: string
    businessName: string
    company: string
    email: string
    phone: string
    contactPerson: string | null
  }
  lease: {
    startDate: Date
    endDate: Date
    totalRentAmount: number
    securityDeposit: number
    status: LeaseStatus
    tenureYears: number
    tenureMonths: number
  }
  renewal: {
    daysUntilExpiry: number
    isExpired: boolean
    isUrgent: boolean // within 30 days
    isCritical: boolean // within 7 days
    recommendedAction: 'RENEW' | 'NEGOTIATE' | 'TERMINATE' | 'EXPIRED'
  }
  units: Array<{
    id: string
    unitNumber: string
    propertyName: string
    propertyCode: string
    totalArea: number
    rentAmount: number
    status: UnitStatus
  }>
  lastRateIncrease: {
    date: Date | null
    previousRate: number | null
    currentRate: number | null
    increasePercent: number | null
  } | null
}

export interface LeaseRenewalsDueSummary {
  totalDue: number
  expired: number
  critical: number
  urgent: number
  normal: number
  totalMonthlyRevenueAtRisk: number
  averageTenureYears: number
}

export interface LeaseRenewalsDueResult {
  items: LeaseRenewalsDueItem[]
  summary: LeaseRenewalsDueSummary
}

/**
 * Get lease renewals due report
 */
export async function getLeaseRenewalsDueReport(
  filters: LeaseRenewalsDueFilters = {}
): Promise<ActionResponse<LeaseRenewalsDueResult>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    const daysAhead = filters.daysAhead ?? 90
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    // Build where clause
    const leaseWhere: Record<string, unknown> = {
      endDate: filters.includeExpired 
        ? { lte: futureDate }
        : { gte: today, lte: futureDate }
    }

    if (filters.tenantId) {
      leaseWhere.tenantId = filters.tenantId
    }

    if (filters.leaseStatus) {
      const statusArray = Array.isArray(filters.leaseStatus)
        ? filters.leaseStatus
        : [filters.leaseStatus]
      leaseWhere.status = { in: statusArray }
    } else {
      leaseWhere.status = LeaseStatus.ACTIVE
    }

    if (filters.propertyId || filters.propertyIds?.length) {
      leaseWhere.leaseUnits = {
        some: {
          unit: {
            propertyId: filters.propertyId ?? { in: filters.propertyIds }
          }
        }
      }
    }

    const leases = await prisma.lease.findMany({
      where: leaseWhere,
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            businessName: true,
            company: true,
            email: true,
            phone: true,
            authorizedSignatory: true,
          }
        },
        leaseUnits: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    propertyName: true,
                    propertyCode: true,
                  }
                }
              }
            },
            rateHistory: {
              orderBy: { effectiveDate: 'desc' },
              take: 1,
            }
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    })

    const items: LeaseRenewalsDueItem[] = leases.map(lease => {
      const daysUntilExpiry = Math.ceil(
        (lease.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      const isExpired = daysUntilExpiry < 0
      const isCritical = !isExpired && daysUntilExpiry <= 7
      const isUrgent = !isExpired && daysUntilExpiry <= 30

      // Calculate tenure
      const tenureMs = lease.endDate.getTime() - lease.startDate.getTime()
      const tenureYears = Math.floor(tenureMs / (1000 * 60 * 60 * 24 * 365))
      const tenureMonths = Math.floor(
        (tenureMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
      )

      // Determine recommended action
      let recommendedAction: 'RENEW' | 'NEGOTIATE' | 'TERMINATE' | 'EXPIRED'
      if (isExpired) {
        recommendedAction = 'EXPIRED'
      } else if (tenureYears >= 2) {
        recommendedAction = 'RENEW' // Long-term tenant
      } else if (tenureYears >= 1) {
        recommendedAction = 'NEGOTIATE' // Mid-term tenant
      } else {
        recommendedAction = 'NEGOTIATE' // New tenant, evaluate
      }

      // Get last rate increase from first lease unit
      const lastRateHistory = lease.leaseUnits[0]?.rateHistory[0]
      const lastRateIncrease = lastRateHistory ? {
        date: lastRateHistory.effectiveDate,
        previousRate: lastRateHistory.previousRate,
        currentRate: lastRateHistory.newRate,
        increasePercent: lastRateHistory.previousRate > 0
          ? Math.round(
              ((lastRateHistory.newRate - lastRateHistory.previousRate) / 
                lastRateHistory.previousRate) * 100 * 100
            ) / 100
          : null,
      } : null

      return {
        id: lease.id,
        tenant: {
          id: lease.tenant.id,
          bpCode: lease.tenant.bpCode,
          businessName: lease.tenant.businessName,
          company: lease.tenant.company,
          email: lease.tenant.email,
          phone: lease.tenant.phone,
          contactPerson: lease.tenant.authorizedSignatory,
        },
        lease: {
          startDate: lease.startDate,
          endDate: lease.endDate,
          totalRentAmount: lease.totalRentAmount,
          securityDeposit: lease.securityDeposit,
          status: lease.status,
          tenureYears,
          tenureMonths,
        },
        renewal: {
          daysUntilExpiry,
          isExpired,
          isUrgent,
          isCritical,
          recommendedAction,
        },
        units: lease.leaseUnits.map(lu => ({
          id: lu.unit.id,
          unitNumber: lu.unit.unitNumber,
          propertyName: lu.unit.property.propertyName,
          propertyCode: lu.unit.property.propertyCode,
          totalArea: lu.unit.totalArea,
          rentAmount: lu.rentAmount,
          status: lu.unit.status,
        })),
        lastRateIncrease,
      }
    })

    // Calculate summary
    const summary: LeaseRenewalsDueSummary = {
      totalDue: items.length,
      expired: items.filter(i => i.renewal.isExpired).length,
      critical: items.filter(i => i.renewal.isCritical).length,
      urgent: items.filter(i => i.renewal.isUrgent && !i.renewal.isCritical).length,
      normal: items.filter(i => 
        !i.renewal.isExpired && !i.renewal.isUrgent && !i.renewal.isCritical
      ).length,
      totalMonthlyRevenueAtRisk: items.reduce((sum, i) => sum + i.lease.totalRentAmount, 0),
      averageTenureYears: items.length > 0
        ? Math.round(
            (items.reduce((sum, i) => sum + i.lease.tenureYears, 0) / items.length) * 10
          ) / 10
        : 0,
    }

    return {
      success: true,
      data: {
        items,
        summary,
      }
    }
  } catch (error) {
    console.error("Error fetching lease renewals due report:", error)
    return { success: false, error: "Failed to fetch lease renewals due report" }
  }
}

// ============================================================================
// 5. MULTI-SPACE TENANTS REPORT
// ============================================================================

export interface MultiSpaceTenantsFilters extends BaseReportFilters {
  minUnits?: number // Default: 2
  tenantStatus?: TenantStatus | TenantStatus[]
  leaseStatus?: LeaseStatus | LeaseStatus[]
  sortBy?: 'unitCount' | 'totalRent' | 'totalArea' | 'businessName'
}

export interface MultiSpaceTenantsItem {
  tenant: {
    id: string
    bpCode: string
    businessName: string
    company: string
    email: string
    phone: string
    status: TenantStatus
    natureOfBusiness: string | null
  }
  portfolio: {
    totalUnits: number
    totalArea: number
    totalMonthlyRent: number
    totalSecurityDeposit: number
    averageRentPerSqm: number
    propertiesCount: number
  }
  leases: Array<{
    id: string
    startDate: Date
    endDate: Date
    totalRentAmount: number
    status: LeaseStatus
    daysUntilExpiry: number
    units: Array<{
      id: string
      unitNumber: string
      propertyId: string
      propertyName: string
      propertyCode: string
      totalArea: number
      rentAmount: number
    }>
  }>
  properties: Array<{
    id: string
    propertyCode: string
    propertyName: string
    unitsCount: number
    totalRent: number
  }>
}

export interface MultiSpaceTenantsSummary {
  totalTenants: number
  totalUnits: number
  totalMonthlyRevenue: number
  averageUnitsPerTenant: number
  topTenantByUnits: string | null
  topTenantByRent: string | null
}

export interface MultiSpaceTenantsResult {
  items: MultiSpaceTenantsItem[]
  summary: MultiSpaceTenantsSummary
}

/**
 * Get multi-space tenants report
 */
export async function getMultiSpaceTenantsReport(
  filters: MultiSpaceTenantsFilters = {}
): Promise<ActionResponse<MultiSpaceTenantsResult>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    const minUnits = filters.minUnits ?? 2

    // Build tenant where clause
    const tenantWhere: Record<string, unknown> = {}

    if (filters.tenantStatus) {
      const statusArray = Array.isArray(filters.tenantStatus)
        ? filters.tenantStatus
        : [filters.tenantStatus]
      tenantWhere.status = { in: statusArray }
    }

    // Build lease where clause
    const leaseStatusFilter = filters.leaseStatus
      ? Array.isArray(filters.leaseStatus) 
        ? filters.leaseStatus 
        : [filters.leaseStatus]
      : [LeaseStatus.ACTIVE]

    const tenants = await prisma.tenant.findMany({
      where: tenantWhere,
      include: {
        leases: {
          where: {
            status: { in: leaseStatusFilter },
            ...(filters.propertyId || filters.propertyIds?.length
              ? {
                  leaseUnits: {
                    some: {
                      unit: {
                        propertyId: filters.propertyId ?? { in: filters.propertyIds }
                      }
                    }
                  }
                }
              : {})
          },
          include: {
            leaseUnits: {
              include: {
                unit: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        propertyCode: true,
                        propertyName: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Filter tenants with minimum units and transform
    const items: MultiSpaceTenantsItem[] = tenants
      .map(tenant => {
        // Count total units across all leases
        const allUnits = tenant.leases.flatMap(lease => 
          lease.leaseUnits.map(lu => ({
            leaseId: lease.id,
            leaseStartDate: lease.startDate,
            leaseEndDate: lease.endDate,
            leaseStatus: lease.status,
            leaseTotalRent: lease.totalRentAmount,
            unitId: lu.unit.id,
            unitNumber: lu.unit.unitNumber,
            propertyId: lu.unit.property.id,
            propertyCode: lu.unit.property.propertyCode,
            propertyName: lu.unit.property.propertyName,
            totalArea: lu.unit.totalArea,
            rentAmount: lu.rentAmount,
          }))
        )

        if (allUnits.length < minUnits) {
          return null
        }

        // Calculate portfolio metrics
        const totalArea = allUnits.reduce((sum, u) => sum + u.totalArea, 0)
        const totalMonthlyRent = allUnits.reduce((sum, u) => sum + u.rentAmount, 0)
        const totalSecurityDeposit = tenant.leases.reduce(
          (sum, l) => sum + l.securityDeposit, 0
        )

        // Group by property
        const propertiesMap = new Map<string, {
          id: string
          propertyCode: string
          propertyName: string
          unitsCount: number
          totalRent: number
        }>()

        allUnits.forEach(unit => {
          const existing = propertiesMap.get(unit.propertyId)
          if (existing) {
            existing.unitsCount++
            existing.totalRent += unit.rentAmount
          } else {
            propertiesMap.set(unit.propertyId, {
              id: unit.propertyId,
              propertyCode: unit.propertyCode,
              propertyName: unit.propertyName,
              unitsCount: 1,
              totalRent: unit.rentAmount,
            })
          }
        })

        // Transform leases
        const leases = tenant.leases.map(lease => {
          const daysUntilExpiry = Math.ceil(
            (lease.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          return {
            id: lease.id,
            startDate: lease.startDate,
            endDate: lease.endDate,
            totalRentAmount: lease.totalRentAmount,
            status: lease.status,
            daysUntilExpiry,
            units: lease.leaseUnits.map(lu => ({
              id: lu.unit.id,
              unitNumber: lu.unit.unitNumber,
              propertyId: lu.unit.property.id,
              propertyName: lu.unit.property.propertyName,
              propertyCode: lu.unit.property.propertyCode,
              totalArea: lu.unit.totalArea,
              rentAmount: lu.rentAmount,
            }))
          }
        })

        return {
          tenant: {
            id: tenant.id,
            bpCode: tenant.bpCode,
            businessName: tenant.businessName,
            company: tenant.company,
            email: tenant.email,
            phone: tenant.phone,
            status: tenant.status,
            natureOfBusiness: tenant.natureOfBusiness,
          },
          portfolio: {
            totalUnits: allUnits.length,
            totalArea,
            totalMonthlyRent,
            totalSecurityDeposit,
            averageRentPerSqm: totalArea > 0 
              ? Math.round((totalMonthlyRent / totalArea) * 100) / 100 
              : 0,
            propertiesCount: propertiesMap.size,
          },
          leases,
          properties: Array.from(propertiesMap.values()),
        }
      })
      .filter((item): item is MultiSpaceTenantsItem => item !== null)

    // Sort items
    const sortBy = filters.sortBy ?? 'unitCount'
    const sortOrder = filters.sortOrder ?? 'desc'

    items.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'unitCount':
          comparison = a.portfolio.totalUnits - b.portfolio.totalUnits
          break
        case 'totalRent':
          comparison = a.portfolio.totalMonthlyRent - b.portfolio.totalMonthlyRent
          break
        case 'totalArea':
          comparison = a.portfolio.totalArea - b.portfolio.totalArea
          break
        case 'businessName':
          comparison = a.tenant.businessName.localeCompare(b.tenant.businessName)
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Calculate summary
    const summary: MultiSpaceTenantsSummary = {
      totalTenants: items.length,
      totalUnits: items.reduce((sum, i) => sum + i.portfolio.totalUnits, 0),
      totalMonthlyRevenue: items.reduce((sum, i) => sum + i.portfolio.totalMonthlyRent, 0),
      averageUnitsPerTenant: items.length > 0
        ? Math.round(
            (items.reduce((sum, i) => sum + i.portfolio.totalUnits, 0) / items.length) * 10
          ) / 10
        : 0,
      topTenantByUnits: items.length > 0
        ? items.sort((a, b) => b.portfolio.totalUnits - a.portfolio.totalUnits)[0].tenant.businessName
        : null,
      topTenantByRent: items.length > 0
        ? items.sort((a, b) => b.portfolio.totalMonthlyRent - a.portfolio.totalMonthlyRent)[0].tenant.businessName
        : null,
    }

    return {
      success: true,
      data: {
        items,
        summary,
      }
    }
  } catch (error) {
    console.error("Error fetching multi-space tenants report:", error)
    return { success: false, error: "Failed to fetch multi-space tenants report" }
  }
}

// ============================================================================
// 6. OPPORTUNITY LOSS REPORT (VACANT SPACES)
// ============================================================================

export interface OpportunityLossFilters extends BaseReportFilters {
  unitStatus?: UnitStatus | UnitStatus[] // Default: VACANT, MAINTENANCE
  minVacantDays?: number
  maxVacantDays?: number
  includeReserved?: boolean
}

export interface OpportunityLossUnitItem {
  id: string
  unitNumber: string
  property: {
    id: string
    propertyCode: string
    propertyName: string
    address: string
  }
  unit: {
    totalArea: number
    totalRent: number
    status: UnitStatus
  }
  vacancy: {
    vacantSince: Date | null
    vacantDays: number
    dailyLoss: number
    monthlyLoss: number
    totalLoss: number // During analysis period
    lastTenant: {
      bpCode: string
      businessName: string
    } | null
    lastLeaseEndDate: Date | null
    nextLeaseStartDate: Date | null
  }
}

export interface OpportunityLossPropertySummary {
  propertyId: string
  propertyCode: string
  propertyName: string
  vacantUnits: number
  totalVacantArea: number
  dailyLoss: number
  monthlyLoss: number
  periodLoss: number
}

export interface OpportunityLossSummary {
  totalVacantUnits: number
  totalVacantArea: number
  dailyOpportunityLoss: number
  monthlyOpportunityLoss: number
  periodOpportunityLoss: number
  averageVacancyDays: number
  longestVacancy: {
    unitNumber: string
    propertyName: string
    days: number
  } | null
  highestLoss: {
    unitNumber: string
    propertyName: string
    amount: number
  } | null
}

export interface OpportunityLossResult {
  items: OpportunityLossUnitItem[]
  propertyBreakdown: OpportunityLossPropertySummary[]
  summary: OpportunityLossSummary
  period: {
    startDate: Date
    endDate: Date
    totalDays: number
  }
}

/**
 * Get opportunity loss report for vacant/maintenance spaces
 */
export async function getOpportunityLossReport(
  filters: OpportunityLossFilters = {}
): Promise<ActionResponse<OpportunityLossResult>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    const startDate = filters.startDate ?? new Date(today.getFullYear(), today.getMonth(), 1)
    const endDate = filters.endDate ?? today
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Determine unit status filter
    let statusFilter: UnitStatus[]
    if (filters.unitStatus) {
      statusFilter = Array.isArray(filters.unitStatus) 
        ? filters.unitStatus 
        : [filters.unitStatus]
    } else {
      statusFilter = [UnitStatus.VACANT, UnitStatus.MAINTENANCE]
      if (filters.includeReserved) {
        statusFilter.push(UnitStatus.RESERVED)
      }
    }

    // Build unit where clause
    const unitWhere: Record<string, unknown> = {
      status: { in: statusFilter }
    }

    if (filters.propertyId) {
      unitWhere.propertyId = filters.propertyId
    }

    if (filters.propertyIds?.length) {
      unitWhere.propertyId = { in: filters.propertyIds }
    }

    const units = await prisma.unit.findMany({
      where: unitWhere,
      include: {
        property: {
          select: {
            id: true,
            propertyCode: true,
            propertyName: true,
            address: true,
          }
        },
        leaseUnits: {
          where: {
            lease: {
              status: { in: [LeaseStatus.EXPIRED, LeaseStatus.TERMINATED] }
            }
          },
          orderBy: {
            lease: {
              endDate: 'desc'
            }
          },
          take: 1,
          include: {
            lease: {
              include: {
                tenant: {
                  select: {
                    bpCode: true,
                    businessName: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { property: { propertyName: 'asc' } },
        { unitNumber: 'asc' }
      ]
    })

    // Get future leases for these units
    const futureLeases = await prisma.leaseUnit.findMany({
      where: {
        unitId: { in: units.map(u => u.id) },
        lease: {
          status: LeaseStatus.PENDING,
          startDate: { gt: today }
        }
      },
      include: {
        lease: true
      }
    })

    const futureLeaseMap = new Map<string, Date>()
    futureLeases.forEach(flu => {
      const existing = futureLeaseMap.get(flu.unitId)
      if (!existing || flu.lease.startDate < existing) {
        futureLeaseMap.set(flu.unitId, flu.lease.startDate)
      }
    })

    // Transform units
    let items: OpportunityLossUnitItem[] = units.map(unit => {
      const lastLeaseUnit = unit.leaseUnits[0]
      const lastLeaseEndDate = lastLeaseUnit?.lease.endDate ?? null
      
      // Calculate vacant days
      let vacantSince: Date | null = null
      let vacantDays = 0

      if (lastLeaseEndDate) {
        vacantSince = lastLeaseEndDate
        const vacantStartDate = lastLeaseEndDate > startDate ? lastLeaseEndDate : startDate
        vacantDays = Math.max(0, Math.ceil(
          (endDate.getTime() - vacantStartDate.getTime()) / (1000 * 60 * 60 * 24)
        ))
      } else {
        // No previous lease, assume vacant for entire period
        vacantDays = totalDays
        vacantSince = startDate
      }

      const dailyLoss = unit.totalRent / 30
      const monthlyLoss = unit.totalRent
      const periodLoss = dailyLoss * vacantDays

      return {
        id: unit.id,
        unitNumber: unit.unitNumber,
        property: unit.property,
        unit: {
          totalArea: unit.totalArea,
          totalRent: unit.totalRent,
          status: unit.status,
        },
        vacancy: {
          vacantSince,
          vacantDays,
          dailyLoss: Math.round(dailyLoss * 100) / 100,
          monthlyLoss,
          totalLoss: Math.round(periodLoss * 100) / 100,
          lastTenant: lastLeaseUnit?.lease.tenant ?? null,
          lastLeaseEndDate,
          nextLeaseStartDate: futureLeaseMap.get(unit.id) ?? null,
        }
      }
    })

    // Apply vacancy day filters
    if (filters.minVacantDays !== undefined) {
      items = items.filter(i => i.vacancy.vacantDays >= filters.minVacantDays!)
    }
    if (filters.maxVacantDays !== undefined) {
      items = items.filter(i => i.vacancy.vacantDays <= filters.maxVacantDays!)
    }

    // Calculate property breakdown
    const propertyMap = new Map<string, OpportunityLossPropertySummary>()

    items.forEach(item => {
      const existing = propertyMap.get(item.property.id)
      if (existing) {
        existing.vacantUnits++
        existing.totalVacantArea += item.unit.totalArea
        existing.dailyLoss += item.vacancy.dailyLoss
        existing.monthlyLoss += item.vacancy.monthlyLoss
        existing.periodLoss += item.vacancy.totalLoss
      } else {
        propertyMap.set(item.property.id, {
          propertyId: item.property.id,
          propertyCode: item.property.propertyCode,
          propertyName: item.property.propertyName,
          vacantUnits: 1,
          totalVacantArea: item.unit.totalArea,
          dailyLoss: item.vacancy.dailyLoss,
          monthlyLoss: item.vacancy.monthlyLoss,
          periodLoss: item.vacancy.totalLoss,
        })
      }
    })

    const propertyBreakdown = Array.from(propertyMap.values())
      .sort((a, b) => b.periodLoss - a.periodLoss)

    // Calculate summary
    const longestVacancyItem = items.length > 0
      ? items.reduce((max, item) => 
          item.vacancy.vacantDays > max.vacancy.vacantDays ? item : max
        )
      : null

    const highestLossItem = items.length > 0
      ? items.reduce((max, item) => 
          item.vacancy.totalLoss > max.vacancy.totalLoss ? item : max
        )
      : null

    const summary: OpportunityLossSummary = {
      totalVacantUnits: items.length,
      totalVacantArea: items.reduce((sum, i) => sum + i.unit.totalArea, 0),
      dailyOpportunityLoss: Math.round(
        items.reduce((sum, i) => sum + i.vacancy.dailyLoss, 0) * 100
      ) / 100,
      monthlyOpportunityLoss: items.reduce((sum, i) => sum + i.vacancy.monthlyLoss, 0),
      periodOpportunityLoss: Math.round(
        items.reduce((sum, i) => sum + i.vacancy.totalLoss, 0) * 100
      ) / 100,
      averageVacancyDays: items.length > 0
        ? Math.round(items.reduce((sum, i) => sum + i.vacancy.vacantDays, 0) / items.length)
        : 0,
      longestVacancy: longestVacancyItem ? {
        unitNumber: longestVacancyItem.unitNumber,
        propertyName: longestVacancyItem.property.propertyName,
        days: longestVacancyItem.vacancy.vacantDays,
      } : null,
      highestLoss: highestLossItem ? {
        unitNumber: highestLossItem.unitNumber,
        propertyName: highestLossItem.property.propertyName,
        amount: highestLossItem.vacancy.totalLoss,
      } : null,
    }

    return {
      success: true,
      data: {
        items,
        propertyBreakdown,
        summary,
        period: {
          startDate,
          endDate,
          totalDays,
        }
      }
    }
  } catch (error) {
    console.error("Error fetching opportunity loss report:", error)
    return { success: false, error: "Failed to fetch opportunity loss report" }
  }
}

// ============================================================================
// 7. DASHBOARD STATISTICS
// ============================================================================

export interface ReportDashboardStats {
  occupancy: {
    totalUnits: number
    occupiedUnits: number
    occupancyRate: number
  }
  leasing: {
    activeLeases: number
    expiringSoon: number // within 30 days
    expired: number
  }
  revenue: {
    monthlyActual: number
    monthlyPotential: number
    opportunityLoss: number
  }
  tenants: {
    total: number
    active: number
    multiSpace: number
  }
}

/**
 * Get high-level dashboard statistics
 * Optimized with Promise.all for parallel queries
 */
export async function getReportDashboardStats(): Promise<ActionResponse<ReportDashboardStats>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    // Use Promise.all for parallel execution (Vercel best practice)
    const [
      totalUnits,
      occupiedUnits,
      activeLeases,
      expiringSoon,
      expiredLeases,
      unitRevenue,
      totalTenants,
      activeTenants,
      multiSpaceTenantsResult
    ] = await Promise.all([
      prisma.unit.count(),
      prisma.unit.count({ where: { status: UnitStatus.OCCUPIED } }),
      prisma.lease.count({ where: { status: LeaseStatus.ACTIVE } }),
      prisma.lease.count({
        where: {
          status: LeaseStatus.ACTIVE,
          endDate: { gte: today, lte: thirtyDaysFromNow }
        }
      }),
      prisma.lease.count({
        where: {
          status: LeaseStatus.ACTIVE,
          endDate: { lt: today }
        }
      }),
      prisma.unit.aggregate({
        _sum: { totalRent: true },
        where: { status: UnitStatus.OCCUPIED }
      }),
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      // Get multi-space tenants count
      prisma.tenant.findMany({
        where: { status: TenantStatus.ACTIVE },
        include: {
          leases: {
            where: { status: LeaseStatus.ACTIVE },
            include: {
              _count: { select: { leaseUnits: true } }
            }
          }
        }
      })
    ])

    // Calculate multi-space tenants
    const multiSpaceCount = multiSpaceTenantsResult.filter(tenant => {
      const totalUnitsCount = tenant.leases.reduce(
        (sum, lease) => sum + lease._count.leaseUnits, 0
      )
      return totalUnitsCount >= 2
    }).length

    // Calculate potential revenue
    const potentialRevenue = await prisma.unit.aggregate({
      _sum: { totalRent: true }
    })

    const monthlyActual = unitRevenue._sum.totalRent ?? 0
    const monthlyPotential = potentialRevenue._sum.totalRent ?? 0

    return {
      success: true,
      data: {
        occupancy: {
          totalUnits,
          occupiedUnits,
          occupancyRate: totalUnits > 0 
            ? Math.round((occupiedUnits / totalUnits) * 100 * 100) / 100 
            : 0,
        },
        leasing: {
          activeLeases,
          expiringSoon,
          expired: expiredLeases,
        },
        revenue: {
          monthlyActual,
          monthlyPotential,
          opportunityLoss: monthlyPotential - monthlyActual,
        },
        tenants: {
          total: totalTenants,
          active: activeTenants,
          multiSpace: multiSpaceCount,
        }
      }
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return { success: false, error: "Failed to fetch dashboard statistics" }
  }
}
