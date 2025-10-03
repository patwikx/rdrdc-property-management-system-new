"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { LeaseStatus, UnitStatus, TenantStatus } from "@prisma/client"

export interface LeaseReportData {
  id: string
  tenant: {
    bpCode: string
    firstName: string | null
    lastName: string | null
    businessName: string
    company: string
    email: string
    phone: string
    status: TenantStatus
  }
  startDate: Date
  endDate: Date
  totalRentAmount: number
  securityDeposit: number
  status: LeaseStatus
  terminationDate: Date | null
  terminationReason: string | null
  createdAt: Date
  updatedAt: Date
  units: Array<{
    id: string
    unitNumber: string
    totalArea: number
    rentAmount: number
    property: {
      propertyName: string
      propertyCode: string
      address: string
      propertyType: string
    }
  }>
  payments: Array<{
    id: string
    amount: number
    paymentType: string
    paymentMethod: string
    paymentStatus: string
    paymentDate: Date
  }>
}

export interface LeaseExpirationData {
  id: string
  tenant: {
    bpCode: string
    businessName: string
    email: string
    phone: string
  }
  endDate: Date
  totalRentAmount: number
  daysUntilExpiry: number
  units: Array<{
    unitNumber: string
    property: {
      propertyName: string
      address: string
    }
  }>
  isExpired: boolean
  isExpiringSoon: boolean
}

export interface LeaseRenewalData {
  id: string
  tenant: {
    bpCode: string
    businessName: string
    email: string
    phone: string
  }
  originalStartDate: Date
  originalEndDate: Date
  currentStartDate: Date
  currentEndDate: Date
  originalRent: number
  currentRent: number
  rentIncrease: number
  rentIncreasePercentage: number
  renewalCount: number
  units: Array<{
    unitNumber: string
    property: {
      propertyName: string
    }
  }>
}

export interface MultiUnitLeaseData {
  id: string
  tenant: {
    bpCode: string
    businessName: string
    email: string
    phone: string
  }
  startDate: Date
  endDate: Date
  totalRentAmount: number
  securityDeposit: number
  status: LeaseStatus
  unitCount: number
  totalArea: number
  units: Array<{
    id: string
    unitNumber: string
    totalArea: number
    rentAmount: number
    property: {
      propertyName: string
      propertyCode: string
      address: string
    }
  }>
  averageRentPerSqm: number
}

export async function getLeaseManagementReport(
  startDate?: Date,
  endDate?: Date,
  status?: LeaseStatus,
  propertyId?: string
): Promise<{
  success: boolean
  data?: LeaseReportData[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const where: Record<string, unknown> = {}

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      ]
    }

    if (status) {
      where.status = status
    }

    if (propertyId) {
      where.leaseUnits = {
        some: {
          unit: {
            propertyId: propertyId,
          },
        },
      }
    }

    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: {
          select: {
            bpCode: true,
            firstName: true,
            lastName: true,
            businessName: true,
            company: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        leaseUnits: {
          include: {
            unit: {
              select: {
                id: true,
                unitNumber: true,
                totalArea: true,
                property: {
                  select: {
                    propertyName: true,
                    propertyCode: true,
                    address: true,
                    propertyType: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentType: true,
            paymentMethod: true,
            paymentStatus: true,
            paymentDate: true,
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const reportData: LeaseReportData[] = leases.map(lease => ({
      id: lease.id,
      tenant: lease.tenant,
      startDate: lease.startDate,
      endDate: lease.endDate,
      totalRentAmount: lease.totalRentAmount,
      securityDeposit: lease.securityDeposit,
      status: lease.status,
      terminationDate: lease.terminationDate,
      terminationReason: lease.terminationReason,
      createdAt: lease.createdAt,
      updatedAt: lease.updatedAt,
      units: lease.leaseUnits.map(leaseUnit => ({
        id: leaseUnit.unit.id,
        unitNumber: leaseUnit.unit.unitNumber,
        totalArea: leaseUnit.unit.totalArea,
        rentAmount: leaseUnit.rentAmount,
        property: {
          propertyName: leaseUnit.unit.property.propertyName,
          propertyCode: leaseUnit.unit.property.propertyCode,
          address: leaseUnit.unit.property.address,
          propertyType: leaseUnit.unit.property.propertyType,
        },
      })),
      payments: lease.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentDate: payment.paymentDate,
      })),
    }))

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error fetching lease management report:", error)
    return { success: false, error: "Failed to fetch lease management report" }
  }
}

export async function getLeaseExpirationReport(
  daysAhead: number = 90
): Promise<{
  success: boolean
  data?: LeaseExpirationData[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const leases = await prisma.lease.findMany({
      where: {
        status: LeaseStatus.ACTIVE,
        endDate: {
          lte: futureDate,
        },
      },
      include: {
        tenant: {
          select: {
            bpCode: true,
            businessName: true,
            email: true,
            phone: true,
          },
        },
        leaseUnits: {
          include: {
            unit: {
              select: {
                unitNumber: true,
                property: {
                  select: {
                    propertyName: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    })

    const reportData: LeaseExpirationData[] = leases.map(lease => {
      const daysUntilExpiry = Math.ceil((lease.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const isExpired = daysUntilExpiry < 0
      const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0

      return {
        id: lease.id,
        tenant: lease.tenant,
        endDate: lease.endDate,
        totalRentAmount: lease.totalRentAmount,
        daysUntilExpiry,
        units: lease.leaseUnits.map(leaseUnit => ({
          unitNumber: leaseUnit.unit.unitNumber,
          property: {
            propertyName: leaseUnit.unit.property.propertyName,
            address: leaseUnit.unit.property.address,
          },
        })),
        isExpired,
        isExpiringSoon,
      }
    })

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error fetching lease expiration report:", error)
    return { success: false, error: "Failed to fetch lease expiration report" }
  }
}

export async function getMultiUnitLeaseReport(): Promise<{
  success: boolean
  data?: MultiUnitLeaseData[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const leases = await prisma.lease.findMany({
      where: {
        leaseUnits: {
          some: {},
        },
      },
      include: {
        tenant: {
          select: {
            bpCode: true,
            businessName: true,
            email: true,
            phone: true,
          },
        },
        leaseUnits: {
          include: {
            unit: {
              select: {
                id: true,
                unitNumber: true,
                totalArea: true,
                property: {
                  select: {
                    propertyName: true,
                    propertyCode: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            leaseUnits: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter for multi-unit leases only
    const multiUnitLeases = leases.filter(lease => lease._count.leaseUnits > 1)

    const reportData: MultiUnitLeaseData[] = multiUnitLeases.map(lease => {
      const totalArea = lease.leaseUnits.reduce((sum, leaseUnit) => sum + leaseUnit.unit.totalArea, 0)
      const averageRentPerSqm = totalArea > 0 ? lease.totalRentAmount / totalArea : 0

      return {
        id: lease.id,
        tenant: lease.tenant,
        startDate: lease.startDate,
        endDate: lease.endDate,
        totalRentAmount: lease.totalRentAmount,
        securityDeposit: lease.securityDeposit,
        status: lease.status,
        unitCount: lease._count.leaseUnits,
        totalArea,
        units: lease.leaseUnits.map(leaseUnit => ({
          id: leaseUnit.unit.id,
          unitNumber: leaseUnit.unit.unitNumber,
          totalArea: leaseUnit.unit.totalArea,
          rentAmount: leaseUnit.rentAmount,
          property: {
            propertyName: leaseUnit.unit.property.propertyName,
            propertyCode: leaseUnit.unit.property.propertyCode,
            address: leaseUnit.unit.property.address,
          },
        })),
        averageRentPerSqm,
      }
    })

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error fetching multi-unit lease report:", error)
    return { success: false, error: "Failed to fetch multi-unit lease report" }
  }
}

export async function getLeasingStats(): Promise<{
  success: boolean
  data?: {
    totalLeases: number
    activeLeases: number
    expiredLeases: number
    pendingLeases: number
    terminatedLeases: number
    expiringSoon: number
    multiUnitLeases: number
    totalRentValue: number
    averageLeaseLength: number
    occupancyRate: number
  }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const [
      totalLeases,
      leasesByStatus,
      expiringSoon,
      ,
      totalRentValue,
      totalUnits,
      occupiedUnits,
    ] = await Promise.all([
      prisma.lease.count(),
      prisma.lease.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
      prisma.lease.count({
        where: {
          status: LeaseStatus.ACTIVE,
          endDate: {
            gte: today,
            lte: thirtyDaysFromNow,
          },
        },
      }),
      // Get multi-unit leases count - we'll calculate this separately
      Promise.resolve(0),
      prisma.lease.aggregate({
        _sum: {
          totalRentAmount: true,
        },
        where: {
          status: LeaseStatus.ACTIVE,
        },
      }),
      prisma.unit.count(),
      prisma.unit.count({
        where: {
          status: UnitStatus.OCCUPIED,
        },
      }),
    ])

    // Calculate multi-unit leases count separately
    const leasesWithUnitCount = await prisma.lease.findMany({
      include: {
        _count: {
          select: {
            leaseUnits: true,
          },
        },
      },
    })
    
    const multiUnitLeases = leasesWithUnitCount.filter(lease => lease._count.leaseUnits > 1).length

    const statusCounts = leasesByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<LeaseStatus, number>)

    // Calculate average lease length
    const leasesWithDuration = await prisma.lease.findMany({
      select: {
        startDate: true,
        endDate: true,
      },
    })

    const averageLeaseLength = leasesWithDuration.length > 0
      ? leasesWithDuration.reduce((sum, lease) => {
          const duration = Math.ceil((lease.endDate.getTime() - lease.startDate.getTime()) / (1000 * 60 * 60 * 24))
          return sum + duration
        }, 0) / leasesWithDuration.length
      : 0

    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

    return {
      success: true,
      data: {
        totalLeases,
        activeLeases: statusCounts[LeaseStatus.ACTIVE] || 0,
        expiredLeases: statusCounts[LeaseStatus.EXPIRED] || 0,
        pendingLeases: statusCounts[LeaseStatus.PENDING] || 0,
        terminatedLeases: statusCounts[LeaseStatus.TERMINATED] || 0,
        expiringSoon,
        multiUnitLeases,
        totalRentValue: totalRentValue._sum.totalRentAmount || 0,
        averageLeaseLength: Math.round(averageLeaseLength),
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      },
    }
  } catch (error) {
    console.error("Error fetching leasing stats:", error)
    return { success: false, error: "Failed to fetch leasing statistics" }
  }
}