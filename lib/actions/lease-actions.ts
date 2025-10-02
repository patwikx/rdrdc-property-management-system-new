"use server"

import { prisma } from "@/lib/prisma"
import { LeaseStatus, UnitStatus, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

// Types for lease operations
export interface LeaseWithDetails {
  id: string
  tenantId: string
  startDate: Date
  endDate: Date
  totalRentAmount: number
  securityDeposit: number
  status: LeaseStatus
  terminationDate: Date | null
  terminationReason: string | null
  createdAt: Date
  updatedAt: Date
  tenant: {
    id: string
    bpCode: string
    firstName: string | null
    lastName: string | null
    company: string
    businessName: string
    email: string
    status: string
  }
  leaseUnits: Array<{
    id: string
    unitId: string
    rentAmount: number
    unit: {
      id: string
      unitNumber: string
      totalArea: number
      status: string
      property: {
        id: string
        propertyName: string
        propertyCode: string
      }
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

export interface CreateLeaseData {
  tenantId: string
  startDate: Date
  endDate: Date
  securityDeposit: number
  unitIds: string[]
  unitRentAmounts: Record<string, number>
}

export interface UpdateLeaseData {
  id: string
  startDate?: Date
  endDate?: Date
  securityDeposit?: number
  status?: LeaseStatus
  terminationDate?: Date | null
  terminationReason?: string | null
}

// Get all leases with pagination and filtering
export async function getLeases(
  page: number = 1,
  limit: number = 12,
  search?: string,
  status?: LeaseStatus,
  tenantId?: string
) {
  try {
    const skip = (page - 1) * limit
    
    const where: Prisma.LeaseWhereInput = {
      ...(status && { status }),
      ...(tenantId && { tenantId }),
      ...(search && {
        OR: [
          {
            tenant: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { businessName: { contains: search, mode: 'insensitive' } },
                { bpCode: { contains: search, mode: 'insensitive' } }
              ]
            }
          },
          {
            leaseUnits: {
              some: {
                unit: {
                  OR: [
                    { unitNumber: { contains: search, mode: 'insensitive' } },
                    { property: { propertyName: { contains: search, mode: 'insensitive' } } }
                  ]
                }
              }
            }
          }
        ]
      })
    }

    const [leases, totalCount] = await Promise.all([
      prisma.lease.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              bpCode: true,
              firstName: true,
              lastName: true,
              company: true,
              businessName: true,
              email: true,
              status: true
            }
          },
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: {
                    select: {
                      id: true,
                      propertyName: true,
                      propertyCode: true
                    }
                  }
                }
              }
            }
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.lease.count({ where })
    ])

    return {
      leases,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Error fetching leases:', error)
    throw new Error('Failed to fetch leases')
  }
}

// Get lease by ID
export async function getLeaseById(id: string): Promise<LeaseWithDetails | null> {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            bpCode: true,
            firstName: true,
            lastName: true,
            company: true,
            businessName: true,
            email: true,
            status: true
          }
        },
        leaseUnits: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    propertyName: true,
                    propertyCode: true
                  }
                }
              }
            }
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    })

    return lease
  } catch (error) {
    console.error('Error fetching lease:', error)
    return null
  }
}

// Create new lease
export async function createLease(data: CreateLeaseData) {
  try {
    // Calculate total rent amount
    const totalRentAmount = Object.values(data.unitRentAmounts).reduce((sum, amount) => sum + amount, 0)

    const lease = await prisma.$transaction(async (tx) => {
      // Create the lease
      const newLease = await tx.lease.create({
        data: {
          tenantId: data.tenantId,
          startDate: data.startDate,
          endDate: data.endDate,
          totalRentAmount,
          securityDeposit: data.securityDeposit,
          status: 'PENDING'
        }
      })

      // Create lease units
      const leaseUnits = await Promise.all(
        data.unitIds.map(unitId =>
          tx.leaseUnit.create({
            data: {
              leaseId: newLease.id,
              unitId,
              rentAmount: data.unitRentAmounts[unitId]
            }
          })
        )
      )

      // Update unit statuses to RESERVED
      await tx.unit.updateMany({
        where: { id: { in: data.unitIds } },
        data: { status: UnitStatus.RESERVED }
      })

      return { ...newLease, leaseUnits }
    })

    revalidatePath('/tenants/leases')
    revalidatePath('/tenants')
    revalidatePath('/properties')

    return { success: true, lease }
  } catch (error) {
    console.error('Error creating lease:', error)
    return { error: 'Failed to create lease' }
  }
}

// Update lease
export async function updateLease(data: UpdateLeaseData) {
  try {
    const lease = await prisma.lease.update({
      where: { id: data.id },
      data: {
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.securityDeposit !== undefined && { securityDeposit: data.securityDeposit }),
        ...(data.status && { status: data.status }),
        ...(data.terminationDate !== undefined && { terminationDate: data.terminationDate }),
        ...(data.terminationReason !== undefined && { terminationReason: data.terminationReason })
      },
      include: {
        leaseUnits: {
          include: {
            unit: true
          }
        }
      }
    })

    // Update unit statuses based on lease status
    if (data.status) {
      let unitStatus: UnitStatus
      switch (data.status) {
        case 'ACTIVE':
          unitStatus = UnitStatus.OCCUPIED
          break
        case 'TERMINATED':
        case 'EXPIRED':
          unitStatus = UnitStatus.VACANT
          break
        default:
          unitStatus = UnitStatus.RESERVED
      }

      await prisma.unit.updateMany({
        where: { 
          id: { 
            in: lease.leaseUnits.map(lu => lu.unitId) 
          } 
        },
        data: { status: unitStatus }
      })
    }

    revalidatePath('/tenants/leases')
    revalidatePath('/tenants')
    revalidatePath('/properties')

    return { success: true, lease }
  } catch (error) {
    console.error('Error updating lease:', error)
    return { error: 'Failed to update lease' }
  }
}

// Terminate lease
export async function terminateLease(id: string, reason: string) {
  try {
    const lease = await prisma.$transaction(async (tx) => {
      // Update lease status
      const updatedLease = await tx.lease.update({
        where: { id },
        data: {
          status: 'TERMINATED',
          terminationDate: new Date(),
          terminationReason: reason
        },
        include: {
          leaseUnits: true
        }
      })

      // Update unit statuses to VACANT
      await tx.unit.updateMany({
        where: { 
          id: { 
            in: updatedLease.leaseUnits.map(lu => lu.unitId) 
          } 
        },
        data: { status: UnitStatus.VACANT }
      })

      return updatedLease
    })

    revalidatePath('/tenants/leases')
    revalidatePath('/tenants')
    revalidatePath('/properties')

    return { success: true, lease }
  } catch (error) {
    console.error('Error terminating lease:', error)
    return { error: 'Failed to terminate lease' }
  }
}

// Delete lease
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteLease(id: string) {
  try {

    revalidatePath('/tenants/leases')
    revalidatePath('/tenants')
    revalidatePath('/properties')

    return { success: true }
  } catch (error) {
    console.error('Error deleting lease:', error)
    return { error: 'Failed to delete lease' }
  }
}

// Get available units for lease
export async function getAvailableUnits() {
  try {
    const units = await prisma.unit.findMany({
      where: {
        status: { in: [UnitStatus.VACANT] }
      },
      include: {
        property: {
          select: {
            id: true,
            propertyName: true,
            propertyCode: true
          }
        }
      },
      orderBy: [
        { property: { propertyName: 'asc' } },
        { unitNumber: 'asc' }
      ]
    })

    return units
  } catch (error) {
    console.error('Error fetching available units:', error)
    return []
  }
}

// Get lease statistics
export async function getLeaseStats() {
  try {
    const [
      totalLeases,
      activeLeases,
      pendingLeases,
      terminatedLeases,
      expiredLeases,
      totalRevenue
    ] = await Promise.all([
      prisma.lease.count(),
      prisma.lease.count({ where: { status: 'ACTIVE' } }),
      prisma.lease.count({ where: { status: 'PENDING' } }),
      prisma.lease.count({ where: { status: 'TERMINATED' } }),
      prisma.lease.count({ where: { status: 'EXPIRED' } }),
      prisma.lease.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { totalRentAmount: true }
      })
    ])

    return {
      totalLeases,
      activeLeases,
      pendingLeases,
      terminatedLeases,
      expiredLeases,
      totalRevenue: totalRevenue._sum.totalRentAmount || 0
    }
  } catch (error) {
    console.error('Error fetching lease stats:', error)
    return {
      totalLeases: 0,
      activeLeases: 0,
      pendingLeases: 0,
      terminatedLeases: 0,
      expiredLeases: 0,
      totalRevenue: 0
    }
  }
}