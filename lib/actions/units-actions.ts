"use server"

import { prisma } from "@/lib/prisma"
import { UnitStatus } from "@prisma/client"

export interface UnitWithDetails {
  id: string
  unitNumber: string
  totalArea: number
  totalRent: number
  status: UnitStatus
  createdAt: Date
  updatedAt: Date
  property: {
    id: string
    propertyName: string
    propertyCode: string
    propertyType: string
  }
  propertyTitle: {
    titleNo: string
  } | null
  _count: {
    leaseUnits: number
    maintenanceRequests: number
    documents: number
    unitFloors: number
  }
  unitFloors: Array<{
    id: string
    floorType: string
    area: number
    rate: number
    rent: number
  }>
  currentLease?: {
    id: string
    tenant: {
      firstName: string | null
      lastName: string | null
      company: string
      bpCode: string
    }
    startDate: Date
    endDate: Date
    rentAmount: number
  } | null
}

export type UnitSortBy = 'rate' | 'name' | 'status' | 'area'
export type SortOrder = 'asc' | 'desc'

export interface GetUnitsParams {
  page?: number
  limit?: number
  search?: string
  status?: UnitStatus
  propertyId?: string
  minRate?: number
  maxRate?: number
  sortBy?: UnitSortBy
  sortOrder?: SortOrder
}

export async function getUnits(
  params: GetUnitsParams = {}
): Promise<{
  units: UnitWithDetails[]
  totalCount: number
  totalPages: number
  highestRateUnitId?: string
}> {
  const {
    page = 1,
    limit = 12,
    search,
    status,
    propertyId,
    minRate,
    maxRate,
    sortBy = 'name',
    sortOrder = 'asc'
  } = params

  try {
    const skip = (page - 1) * limit

    // Build where clause with rate filtering
    const whereConditions: Record<string, unknown>[] = []
    
    if (search) {
      whereConditions.push({
        OR: [
          { unitNumber: { contains: search, mode: 'insensitive' as const } },
          { property: { propertyName: { contains: search, mode: 'insensitive' as const } } },
          { property: { propertyCode: { contains: search, mode: 'insensitive' as const } } }
        ]
      })
    }
    
    if (status) {
      whereConditions.push({ status })
    }
    
    if (propertyId) {
      whereConditions.push({ propertyId })
    }
    
    // Rate filtering - Requirements 3.1, 3.2
    if (minRate !== undefined && minRate > 0) {
      whereConditions.push({ totalRent: { gte: minRate } })
    }
    
    if (maxRate !== undefined && maxRate > 0) {
      whereConditions.push({ totalRent: { lte: maxRate } })
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

    // Build orderBy based on sortBy parameter - Requirements 3.1, 3.2
    let orderBy: Record<string, unknown>[] | Record<string, unknown>
    switch (sortBy) {
      case 'rate':
        orderBy = { totalRent: sortOrder }
        break
      case 'area':
        orderBy = { totalArea: sortOrder }
        break
      case 'status':
        orderBy = { status: sortOrder }
        break
      case 'name':
      default:
        orderBy = [
          { property: { propertyName: sortOrder } },
          { unitNumber: sortOrder }
        ]
        break
    }

    const [units, totalCount] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        include: {
          property: {
            select: {
              id: true,
              propertyName: true,
              propertyCode: true,
              propertyType: true
            }
          },
          propertyTitle: {
            select: {
              titleNo: true
            }
          },
          _count: {
            select: {
              leaseUnits: true,
              maintenanceRequests: true,
              documents: true,
              unitFloors: true
            }
          },
          unitFloors: {
            select: {
              id: true,
              floorType: true,
              area: true,
              rate: true,
              rent: true
            },
            orderBy: {
              floorType: 'asc'
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
                      firstName: true,
                      lastName: true,
                      company: true,
                      bpCode: true
                    }
                  }
                }
              }
            },
            take: 1
          }
        },
        orderBy
      }),
      prisma.unit.count({ where })
    ])

    const unitsWithDetails: UnitWithDetails[] = units.map(unit => ({
      id: unit.id,
      unitNumber: unit.unitNumber,
      totalArea: unit.totalArea,
      totalRent: unit.totalRent,
      status: unit.status,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
      property: {
        id: unit.property.id,
        propertyName: unit.property.propertyName,
        propertyCode: unit.property.propertyCode,
        propertyType: unit.property.propertyType
      },
      propertyTitle: unit.propertyTitle,
      _count: unit._count,
      unitFloors: unit.unitFloors,
      currentLease: unit.leaseUnits[0] ? {
        id: unit.leaseUnits[0].lease.id,
        tenant: unit.leaseUnits[0].lease.tenant,
        startDate: unit.leaseUnits[0].lease.startDate,
        endDate: unit.leaseUnits[0].lease.endDate,
        rentAmount: unit.leaseUnits[0].rentAmount
      } : null
    }))

    const totalPages = Math.ceil(totalCount / limit)

    // Find highest rate unit ID when sorting by rate descending - Requirement 3.5
    let highestRateUnitId: string | undefined
    if (sortBy === 'rate' && sortOrder === 'desc' && unitsWithDetails.length > 0) {
      highestRateUnitId = unitsWithDetails[0].id
    }

    return {
      units: unitsWithDetails,
      totalCount,
      totalPages,
      highestRateUnitId
    }
  } catch (error) {
    console.error("Error fetching units:", error)
    throw new Error("Failed to fetch units")
  }
}

export async function getUnitStats(): Promise<{
  total: number
  occupied: number
  vacant: number
  maintenance: number
  reserved: number
  totalRentValue: number
  occupancyRate: number
}> {
  try {
    const [units, totalRentValue] = await Promise.all([
      prisma.unit.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),
      prisma.unit.aggregate({
        _sum: {
          totalRent: true
        },
        where: {
          status: 'OCCUPIED'
        }
      })
    ])

    const stats = units.reduce((acc, unit) => {
      acc.total += unit._count.status
      switch (unit.status) {
        case 'OCCUPIED':
          acc.occupied += unit._count.status
          break
        case 'VACANT':
          acc.vacant += unit._count.status
          break
        case 'MAINTENANCE':
          acc.maintenance += unit._count.status
          break
        case 'RESERVED':
          acc.reserved += unit._count.status
          break
      }
      return acc
    }, {
      total: 0,
      occupied: 0,
      vacant: 0,
      maintenance: 0,
      reserved: 0
    })

    const occupancyRate = stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0

    return {
      ...stats,
      totalRentValue: totalRentValue._sum.totalRent || 0,
      occupancyRate
    }
  } catch (error) {
    console.error("Error fetching unit stats:", error)
    throw new Error("Failed to fetch unit statistics")
  }
}

export async function getPropertiesForFilter(): Promise<Array<{
  id: string
  propertyName: string
  propertyCode: string
}>> {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        propertyName: true,
        propertyCode: true
      },
      orderBy: {
        propertyName: 'asc'
      }
    })

    return properties
  } catch (error) {
    console.error("Error fetching properties for filter:", error)
    throw new Error("Failed to fetch properties")
  }
}