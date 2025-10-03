"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { UnitStatus, PropertyType, LeaseStatus } from "@prisma/client"
import type { Prisma } from "@prisma/client"

type PropertyWithUnits = Prisma.PropertyGetPayload<{
  include: {
    units: {
      include: {
        leaseUnits: {
          include: {
            lease: {
              include: {
                tenant: {
                  select: {
                    bpCode: true
                    businessName: true
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}>

type PropertyWithUnitsSimple = Prisma.PropertyGetPayload<{
  include: {
    units: {
      include: {
        leaseUnits: {
          include: {
            lease: true
          }
        }
      }
    }
  }
}>

type PropertyWithUnitsActive = Prisma.PropertyGetPayload<{
  include: {
    units: {
      include: {
        leaseUnits: {
          include: {
            lease: true
          }
        }
      }
    }
  }
}>

export interface OccupancyReportData {
  property: {
    id: string
    propertyCode: string
    propertyName: string
    address: string
    propertyType: PropertyType
    leasableArea: number
    totalUnits: number
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
    maintenanceArea: number
    reservedArea: number
    areaOccupancyRate: number
  }
  revenue: {
    potentialRevenue: number
    actualRevenue: number
    lostRevenue: number
    opportunityLoss: number
    opportunityLossPercentage: number
  }
  units: Array<{
    id: string
    unitNumber: string
    totalArea: number
    totalRent: number
    status: UnitStatus
    lease: {
      id: string
      tenant: {
        bpCode: string
        businessName: string
      }
      startDate: Date
      endDate: Date
      totalRentAmount: number
    } | null
    vacantDays: number
    lostRevenue: number
  }>
}

export interface OpportunityLossData {
  property: {
    id: string
    propertyCode: string
    propertyName: string
    propertyType: PropertyType
  }
  period: {
    startDate: Date
    endDate: Date
    totalDays: number
  }
  loss: {
    vacantDays: number
    maintenanceDays: number
    totalLostDays: number
    dailyPotentialRevenue: number
    vacancyLoss: number
    maintenanceLoss: number
    totalOpportunityLoss: number
  }
  units: Array<{
    id: string
    unitNumber: string
    totalRent: number
    status: UnitStatus
    vacantDays: number
    maintenanceDays: number
    unitOpportunityLoss: number
    lastLeaseEndDate: Date | null
    nextLeaseStartDate: Date | null
  }>
}

export interface OccupancyTrendData {
  date: Date
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  maintenanceUnits: number
  reservedUnits: number
  occupancyRate: number
  totalRevenue: number
  potentialRevenue: number
  opportunityLoss: number
}

export interface PropertyPerformanceData {
  property: {
    id: string
    propertyCode: string
    propertyName: string
    propertyType: PropertyType
    totalUnits: number
    leasableArea: number
  }
  performance: {
    occupancyRate: number
    areaOccupancyRate: number
    averageRentPerSqm: number
    totalRevenue: number
    potentialRevenue: number
    opportunityLoss: number
    opportunityLossPercentage: number
    averageVacancyDays: number
    turnoverRate: number
  }
  ranking: {
    occupancyRank: number
    revenueRank: number
    efficiencyRank: number
  }
}

export async function getOccupancyReport(
  startDate?: Date,
  endDate?: Date,
  propertyId?: string,
  propertyType?: PropertyType
): Promise<{
  success: boolean
  data?: OccupancyReportData[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const where: Record<string, unknown> = {}

    if (propertyId) {
      where.id = propertyId
    }

    if (propertyType) {
      where.propertyType = propertyType
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        units: {
          include: {
            leaseUnits: {
              include: {
                lease: {
                  include: {
                    tenant: {
                      select: {
                        bpCode: true,
                        businessName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        propertyName: 'asc',
      },
    })

    const reportData: OccupancyReportData[] = await Promise.all(
      properties.map(async (property) => {
        // Calculate occupancy metrics
        const totalUnits = property.units.length
        const occupiedUnits = property.units.filter(unit => unit.status === UnitStatus.OCCUPIED).length
        const vacantUnits = property.units.filter(unit => unit.status === UnitStatus.VACANT).length
        const maintenanceUnits = property.units.filter(unit => unit.status === UnitStatus.MAINTENANCE).length
        const reservedUnits = property.units.filter(unit => unit.status === UnitStatus.RESERVED).length

        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
        const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0

        // Calculate area metrics
        const totalArea = property.units.reduce((sum, unit) => sum + unit.totalArea, 0)
        const occupiedArea = property.units
          .filter(unit => unit.status === UnitStatus.OCCUPIED)
          .reduce((sum, unit) => sum + unit.totalArea, 0)
        const vacantArea = property.units
          .filter(unit => unit.status === UnitStatus.VACANT)
          .reduce((sum, unit) => sum + unit.totalArea, 0)
        const maintenanceArea = property.units
          .filter(unit => unit.status === UnitStatus.MAINTENANCE)
          .reduce((sum, unit) => sum + unit.totalArea, 0)
        const reservedArea = property.units
          .filter(unit => unit.status === UnitStatus.RESERVED)
          .reduce((sum, unit) => sum + unit.totalArea, 0)

        const areaOccupancyRate = totalArea > 0 ? (occupiedArea / totalArea) * 100 : 0

        // Calculate revenue metrics
        const potentialRevenue = property.units.reduce((sum, unit) => sum + unit.totalRent, 0)
        const actualRevenue = property.units
          .filter(unit => unit.status === UnitStatus.OCCUPIED)
          .reduce((sum, unit) => sum + unit.totalRent, 0)
        const lostRevenue = potentialRevenue - actualRevenue
        const opportunityLoss = lostRevenue
        const opportunityLossPercentage = potentialRevenue > 0 ? (opportunityLoss / potentialRevenue) * 100 : 0

        // Calculate unit-level data with vacancy analysis
        const unitsData = await Promise.all(
          property.units.map(async (unit) => {
            let vacantDays = 0
            let unitLostRevenue = 0

            if (unit.status !== UnitStatus.OCCUPIED && startDate && endDate) {
              // Calculate vacant days in the period
              const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              
              // Get the last lease end date for this unit
              const lastLease = await prisma.lease.findFirst({
                where: {
                  leaseUnits: {
                    some: {
                      unitId: unit.id,
                    },
                  },
                  status: {
                    in: [LeaseStatus.EXPIRED, LeaseStatus.TERMINATED],
                  },
                },
                orderBy: {
                  endDate: 'desc',
                },
              })

              if (lastLease && lastLease.endDate >= startDate) {
                const vacantStart = lastLease.endDate > startDate ? lastLease.endDate : startDate
                vacantDays = Math.ceil((endDate.getTime() - vacantStart.getTime()) / (1000 * 60 * 60 * 24))
                unitLostRevenue = (unit.totalRent / 30) * vacantDays // Assuming monthly rent
              } else if (!lastLease) {
                // Unit has been vacant for the entire period
                vacantDays = periodDays
                unitLostRevenue = (unit.totalRent / 30) * vacantDays
              }
            }

            // Get active lease info
            const activeLease = unit.leaseUnits.find(lu => lu.lease.status === LeaseStatus.ACTIVE)?.lease

            return {
              id: unit.id,
              unitNumber: unit.unitNumber,
              totalArea: unit.totalArea,
              totalRent: unit.totalRent,
              status: unit.status,
              lease: activeLease ? {
                id: activeLease.id,
                tenant: activeLease.tenant,
                startDate: activeLease.startDate,
                endDate: activeLease.endDate,
                totalRentAmount: activeLease.totalRentAmount,
              } : null,
              vacantDays,
              lostRevenue: unitLostRevenue,
            }
          })
        )

        return {
          property: {
            id: property.id,
            propertyCode: property.propertyCode,
            propertyName: property.propertyName,
            address: property.address,
            propertyType: property.propertyType,
            leasableArea: property.leasableArea,
            totalUnits: property.totalUnits || 0,
          },
          occupancy: {
            totalUnits,
            occupiedUnits,
            vacantUnits,
            maintenanceUnits,
            reservedUnits,
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            vacancyRate: Math.round(vacancyRate * 100) / 100,
          },
          area: {
            totalArea,
            occupiedArea,
            vacantArea,
            maintenanceArea,
            reservedArea,
            areaOccupancyRate: Math.round(areaOccupancyRate * 100) / 100,
          },
          revenue: {
            potentialRevenue,
            actualRevenue,
            lostRevenue,
            opportunityLoss,
            opportunityLossPercentage: Math.round(opportunityLossPercentage * 100) / 100,
          },
          units: unitsData,
        }
      })
    )

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error fetching occupancy report:", error)
    return { success: false, error: "Failed to fetch occupancy report" }
  }
}

export async function getOpportunityLossReport(
  startDate: Date,
  endDate: Date,
  propertyId?: string
): Promise<{
  success: boolean
  data?: OpportunityLossData[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const where: Record<string, unknown> = {}
    if (propertyId) {
      where.id = propertyId
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        units: {
          include: {
            leaseUnits: {
              include: {
                lease: true,
              },
            },
          },
        },
      },
    })

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const reportData: OpportunityLossData[] = await Promise.all(
      properties.map(async (property) => {
        let totalVacantDays = 0
        let totalMaintenanceDays = 0
        let totalPotentialRevenue = 0

        const unitsData = await Promise.all(
          property.units.map(async (unit) => {
            let vacantDays = 0
            let maintenanceDays = 0
            let lastLeaseEndDate: Date | null = null
            let nextLeaseStartDate: Date | null = null

            // Get lease history for this unit in the period
            const leases = await prisma.lease.findMany({
              where: {
                leaseUnits: {
                  some: {
                    unitId: unit.id,
                  },
                },
                OR: [
                  {
                    startDate: {
                      lte: endDate,
                    },
                    endDate: {
                      gte: startDate,
                    },
                  },
                ],
              },
              orderBy: {
                startDate: 'asc',
              },
            })

            // Calculate vacancy periods
            if (leases.length === 0) {
              // No leases in period - entire period is vacant
              vacantDays = totalDays
            } else {
              // Calculate gaps between leases
              let currentDate = startDate

              for (const lease of leases) {
                const leaseStart = lease.startDate > startDate ? lease.startDate : startDate
                const leaseEnd = lease.endDate < endDate ? lease.endDate : endDate

                // Gap before this lease
                if (currentDate < leaseStart) {
                  vacantDays += Math.ceil((leaseStart.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
                }

                currentDate = leaseEnd > currentDate ? leaseEnd : currentDate
              }

              // Gap after last lease
              if (currentDate < endDate) {
                vacantDays += Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
              }

              // Get last and next lease dates
              const lastLease = leases[leases.length - 1]
              if (lastLease && lastLease.endDate < endDate) {
                lastLeaseEndDate = lastLease.endDate
              }

              const nextLease = await prisma.lease.findFirst({
                where: {
                  leaseUnits: {
                    some: {
                      unitId: unit.id,
                    },
                  },
                  startDate: {
                    gt: endDate,
                  },
                },
                orderBy: {
                  startDate: 'asc',
                },
              })

              if (nextLease) {
                nextLeaseStartDate = nextLease.startDate
              }
            }

            // Calculate maintenance days (simplified - assuming current status applies to period)
            if (unit.status === UnitStatus.MAINTENANCE) {
              maintenanceDays = totalDays
            }

            const unitOpportunityLoss = ((unit.totalRent / 30) * (vacantDays + maintenanceDays))

            totalVacantDays += vacantDays
            totalMaintenanceDays += maintenanceDays
            totalPotentialRevenue += (unit.totalRent / 30) * totalDays

            return {
              id: unit.id,
              unitNumber: unit.unitNumber,
              totalRent: unit.totalRent,
              status: unit.status,
              vacantDays,
              maintenanceDays,
              unitOpportunityLoss,
              lastLeaseEndDate,
              nextLeaseStartDate,
            }
          })
        )

        const dailyPotentialRevenue = totalPotentialRevenue / totalDays
        const vacancyLoss = (property.units.reduce((sum, unit) => sum + unit.totalRent, 0) / 30) * totalVacantDays
        const maintenanceLoss = (property.units.reduce((sum, unit) => sum + unit.totalRent, 0) / 30) * totalMaintenanceDays
        const totalOpportunityLoss = vacancyLoss + maintenanceLoss

        return {
          property: {
            id: property.id,
            propertyCode: property.propertyCode,
            propertyName: property.propertyName,
            propertyType: property.propertyType,
          },
          period: {
            startDate,
            endDate,
            totalDays,
          },
          loss: {
            vacantDays: totalVacantDays,
            maintenanceDays: totalMaintenanceDays,
            totalLostDays: totalVacantDays + totalMaintenanceDays,
            dailyPotentialRevenue,
            vacancyLoss,
            maintenanceLoss,
            totalOpportunityLoss,
          },
          units: unitsData,
        }
      })
    )

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error fetching opportunity loss report:", error)
    return { success: false, error: "Failed to fetch opportunity loss report" }
  }
}

export async function getPropertyPerformanceReport(
  startDate?: Date,
  endDate?: Date
): Promise<{
  success: boolean
  data?: PropertyPerformanceData[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const properties = await prisma.property.findMany({
      include: {
        units: {
          include: {
            leaseUnits: {
              include: {
                lease: true,
              },
            },
          },
        },
      },
    })

    const performanceData: PropertyPerformanceData[] = await Promise.all(
      properties.map(async (property) => {
        const totalUnits = property.units.length
        const occupiedUnits = property.units.filter(unit => unit.status === UnitStatus.OCCUPIED).length
        const totalArea = property.units.reduce((sum, unit) => sum + unit.totalArea, 0)
        const occupiedArea = property.units
          .filter(unit => unit.status === UnitStatus.OCCUPIED)
          .reduce((sum, unit) => sum + unit.totalArea, 0)

        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
        const areaOccupancyRate = totalArea > 0 ? (occupiedArea / totalArea) * 100 : 0
        const averageRentPerSqm = totalArea > 0 ? 
          property.units.reduce((sum, unit) => sum + unit.totalRent, 0) / totalArea : 0

        const totalRevenue = property.units
          .filter(unit => unit.status === UnitStatus.OCCUPIED)
          .reduce((sum, unit) => sum + unit.totalRent, 0)
        const potentialRevenue = property.units.reduce((sum, unit) => sum + unit.totalRent, 0)
        const opportunityLoss = potentialRevenue - totalRevenue
        const opportunityLossPercentage = potentialRevenue > 0 ? (opportunityLoss / potentialRevenue) * 100 : 0

        // Calculate average vacancy days and turnover rate
        let averageVacancyDays = 0
        let turnoverRate = 0

        if (startDate && endDate) {
          // This would require more complex calculations based on lease history
          // For now, we'll use simplified calculations
          const vacantUnits = property.units.filter(unit => unit.status === UnitStatus.VACANT).length
          const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          averageVacancyDays = vacantUnits > 0 ? periodDays / vacantUnits : 0

          // Simplified turnover rate calculation
          const expiredLeases = await prisma.lease.count({
            where: {
              leaseUnits: {
                some: {
                  unit: {
                    propertyId: property.id,
                  },
                },
              },
              endDate: {
                gte: startDate,
                lte: endDate,
              },
              status: {
                in: [LeaseStatus.EXPIRED, LeaseStatus.TERMINATED],
              },
            },
          })

          turnoverRate = totalUnits > 0 ? (expiredLeases / totalUnits) * 100 : 0
        }

        return {
          property: {
            id: property.id,
            propertyCode: property.propertyCode,
            propertyName: property.propertyName,
            propertyType: property.propertyType,
            totalUnits,
            leasableArea: property.leasableArea,
          },
          performance: {
            occupancyRate: Math.round(occupancyRate * 100) / 100,
            areaOccupancyRate: Math.round(areaOccupancyRate * 100) / 100,
            averageRentPerSqm: Math.round(averageRentPerSqm * 100) / 100,
            totalRevenue,
            potentialRevenue,
            opportunityLoss,
            opportunityLossPercentage: Math.round(opportunityLossPercentage * 100) / 100,
            averageVacancyDays: Math.round(averageVacancyDays * 100) / 100,
            turnoverRate: Math.round(turnoverRate * 100) / 100,
          },
          ranking: {
            occupancyRank: 0, // Will be calculated after all properties are processed
            revenueRank: 0,
            efficiencyRank: 0,
          },
        }
      })
    )

    // Calculate rankings
    performanceData.sort((a, b) => b.performance.occupancyRate - a.performance.occupancyRate)
    performanceData.forEach((item, index) => {
      item.ranking.occupancyRank = index + 1
    })

    performanceData.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue)
    performanceData.forEach((item, index) => {
      item.ranking.revenueRank = index + 1
    })

    performanceData.sort((a, b) => a.performance.opportunityLossPercentage - b.performance.opportunityLossPercentage)
    performanceData.forEach((item, index) => {
      item.ranking.efficiencyRank = index + 1
    })

    // Sort back to original order
    performanceData.sort((a, b) => a.property.propertyName.localeCompare(b.property.propertyName))

    return { success: true, data: performanceData }
  } catch (error) {
    console.error("Error fetching property performance report:", error)
    return { success: false, error: "Failed to fetch property performance report" }
  }
}

export async function getOccupancyStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  success: boolean
  data?: {
    totalProperties: number
    totalUnits: number
    occupiedUnits: number
    vacantUnits: number
    maintenanceUnits: number
    reservedUnits: number
    overallOccupancyRate: number
    totalLeasableArea: number
    occupiedArea: number
    areaOccupancyRate: number
    totalPotentialRevenue: number
    totalActualRevenue: number
    totalOpportunityLoss: number
    opportunityLossPercentage: number
    averageRentPerSqm: number
    bestPerformingProperty: string
    worstPerformingProperty: string
  }
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const [properties, units] = await Promise.all([
      prisma.property.count(),
      prisma.unit.findMany({
        include: {
          property: {
            select: {
              propertyName: true,
              leasableArea: true,
            },
          },
        },
      }),
    ])

    const totalUnits = units.length
    const occupiedUnits = units.filter(unit => unit.status === UnitStatus.OCCUPIED).length
    const vacantUnits = units.filter(unit => unit.status === UnitStatus.VACANT).length
    const maintenanceUnits = units.filter(unit => unit.status === UnitStatus.MAINTENANCE).length
    const reservedUnits = units.filter(unit => unit.status === UnitStatus.RESERVED).length

    const overallOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

    const totalLeasableArea = units.reduce((sum, unit) => sum + unit.property.leasableArea, 0)
    const occupiedArea = units
      .filter(unit => unit.status === UnitStatus.OCCUPIED)
      .reduce((sum, unit) => sum + unit.totalArea, 0)
    const areaOccupancyRate = totalLeasableArea > 0 ? (occupiedArea / totalLeasableArea) * 100 : 0

    const totalPotentialRevenue = units.reduce((sum, unit) => sum + unit.totalRent, 0)
    const totalActualRevenue = units
      .filter(unit => unit.status === UnitStatus.OCCUPIED)
      .reduce((sum, unit) => sum + unit.totalRent, 0)
    const totalOpportunityLoss = totalPotentialRevenue - totalActualRevenue
    const opportunityLossPercentage = totalPotentialRevenue > 0 ? (totalOpportunityLoss / totalPotentialRevenue) * 100 : 0

    const totalArea = units.reduce((sum, unit) => sum + unit.totalArea, 0)
    const averageRentPerSqm = totalArea > 0 ? totalPotentialRevenue / totalArea : 0

    // Get property performance for best/worst
    const propertyPerformance = await getPropertyPerformanceReport(startDate, endDate)
    let bestPerformingProperty = "N/A"
    let worstPerformingProperty = "N/A"

    if (propertyPerformance.success && propertyPerformance.data && propertyPerformance.data.length > 0) {
      const sortedByOccupancy = [...propertyPerformance.data].sort((a, b) => b.performance.occupancyRate - a.performance.occupancyRate)
      bestPerformingProperty = sortedByOccupancy[0].property.propertyName
      worstPerformingProperty = sortedByOccupancy[sortedByOccupancy.length - 1].property.propertyName
    }

    return {
      success: true,
      data: {
        totalProperties: properties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        maintenanceUnits,
        reservedUnits,
        overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100,
        totalLeasableArea,
        occupiedArea,
        areaOccupancyRate: Math.round(areaOccupancyRate * 100) / 100,
        totalPotentialRevenue,
        totalActualRevenue,
        totalOpportunityLoss,
        opportunityLossPercentage: Math.round(opportunityLossPercentage * 100) / 100,
        averageRentPerSqm: Math.round(averageRentPerSqm * 100) / 100,
        bestPerformingProperty,
        worstPerformingProperty,
      },
    }
  } catch (error) {
    console.error("Error fetching occupancy stats:", error)
    return { success: false, error: "Failed to fetch occupancy statistics" }
  }
}