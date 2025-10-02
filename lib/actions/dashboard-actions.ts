// app/actions/dashboard.ts
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { LeaseStatus, MaintenanceStatus, PaymentStatus, TenantStatus, UnitStatus } from "@prisma/client"

export interface DashboardStats {
  properties: {
    total: number
    byType: {
      RESIDENTIAL: number
      COMMERCIAL: number
      MIXED: number
    }
  }
  units: {
    total: number
    occupied: number
    vacant: number
    maintenance: number
    reserved: number
    occupancyRate: number
  }
  tenants: {
    total: number
    active: number
    inactive: number
    pending: number
  }
  leases: {
    active: number
    expiringSoon: number
    expired: number
  }
  financial: {
    totalRentCollected: number
    pendingPayments: number
    overduePayments: number
    pdcOpen: number
    pdcDeposited: number
  }
  maintenance: {
    pending: number
    inProgress: number
    completed: number
    emergency: number
  }
  taxes: {
    propertyTaxesDue: number
    unitTaxesDue: number
    propertyTaxesOverdue: number
    unitTaxesOverdue: number
  }
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  user: string
}

export interface UpcomingTask {
  id: string
  title: string
  dueDate: Date
  priority: string
  status: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const today = new Date()

  // Properties stats
  const [totalProperties, propertiesByType] = await Promise.all([
    prisma.property.count(),
    prisma.property.groupBy({
      by: ['propertyType'],
      _count: true,
    }),
  ])

  const propertyTypeStats = propertiesByType.reduce((acc, item) => {
    acc[item.propertyType] = item._count
    return acc
  }, {} as Record<string, number>)

  // Units stats
  const [totalUnits, unitsByStatus] = await Promise.all([
    prisma.unit.count(),
    prisma.unit.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const unitStatusStats = unitsByStatus.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {} as Record<UnitStatus, number>)

  const occupancyRate = totalUnits > 0 
    ? ((unitStatusStats.OCCUPIED || 0) / totalUnits) * 100 
    : 0

  // Tenants stats
  const [totalTenants, tenantsByStatus] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const tenantStatusStats = tenantsByStatus.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {} as Record<TenantStatus, number>)

  // Leases stats
  const [activeLeases, expiringSoonLeases, expiredLeases] = await Promise.all([
    prisma.lease.count({
      where: { status: LeaseStatus.ACTIVE },
    }),
    prisma.lease.count({
      where: {
        status: LeaseStatus.ACTIVE,
        endDate: {
          lte: thirtyDaysFromNow,
          gte: today,
        },
      },
    }),
    prisma.lease.count({
      where: { status: LeaseStatus.EXPIRED },
    }),
  ])

  // Financial stats
  const [
    totalRentCollected,
    pendingPayments,
    overduePayments,
    pdcOpen,
    pdcDeposited,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { paymentStatus: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: { paymentStatus: PaymentStatus.PENDING },
    }),
    prisma.payment.count({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        paymentDate: { lt: today },
      },
    }),
    prisma.pDC.count({
      where: { status: 'Open' },
    }),
    prisma.pDC.count({
      where: { status: 'Deposited' },
    }),
  ])

  // Maintenance stats
  const [pendingMaintenance, inProgressMaintenance, completedMaintenance, emergencyMaintenance] = 
    await Promise.all([
      prisma.maintenanceRequest.count({
        where: { status: MaintenanceStatus.PENDING },
      }),
      prisma.maintenanceRequest.count({
        where: { status: MaintenanceStatus.IN_PROGRESS },
      }),
      prisma.maintenanceRequest.count({
        where: { status: MaintenanceStatus.COMPLETED },
      }),
      prisma.maintenanceRequest.count({
        where: { priority: 'EMERGENCY' },
      }),
    ])

  // Tax stats
  const [propertyTaxesDue, unitTaxesDue, propertyTaxesOverdue, unitTaxesOverdue] = 
    await Promise.all([
      prisma.propertyTax.count({
        where: {
          isPaid: false,
          dueDate: { gte: today },
        },
      }),
      prisma.unitTax.count({
        where: {
          isPaid: false,
          dueDate: { gte: today },
        },
      }),
      prisma.propertyTax.count({
        where: {
          isPaid: false,
          dueDate: { lt: today },
        },
      }),
      prisma.unitTax.count({
        where: {
          isPaid: false,
          dueDate: { lt: today },
        },
      }),
    ])

  return {
    properties: {
      total: totalProperties,
      byType: {
        RESIDENTIAL: propertyTypeStats.RESIDENTIAL || 0,
        COMMERCIAL: propertyTypeStats.COMMERCIAL || 0,
        MIXED: propertyTypeStats.MIXED || 0,
      },
    },
    units: {
      total: totalUnits,
      occupied: unitStatusStats.OCCUPIED || 0,
      vacant: unitStatusStats.VACANT || 0,
      maintenance: unitStatusStats.MAINTENANCE || 0,
      reserved: unitStatusStats.RESERVED || 0,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    },
    tenants: {
      total: totalTenants,
      active: tenantStatusStats.ACTIVE || 0,
      inactive: tenantStatusStats.INACTIVE || 0,
      pending: tenantStatusStats.PENDING || 0,
    },
    leases: {
      active: activeLeases,
      expiringSoon: expiringSoonLeases,
      expired: expiredLeases,
    },
    financial: {
      totalRentCollected: totalRentCollected._sum.amount || 0,
      pendingPayments,
      overduePayments,
      pdcOpen,
      pdcDeposited,
    },
    maintenance: {
      pending: pendingMaintenance,
      inProgress: inProgressMaintenance,
      completed: completedMaintenance,
      emergency: emergencyMaintenance,
    },
    taxes: {
      propertyTaxesDue,
      unitTaxesDue,
      propertyTaxesOverdue,
      unitTaxesOverdue,
    },
  }
}

export async function getRecentActivities(limit = 10): Promise<RecentActivity[]> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const activities = await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return activities.map(activity => ({
    id: activity.id,
    type: activity.action,
    description: `${activity.action} on ${activity.entityType}`,
    timestamp: activity.createdAt,
    user: `${activity.user.firstName} ${activity.user.lastName}`,
  }))
}

export async function getUpcomingTasks(limit = 10): Promise<UpcomingTask[]> {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const tasks = await prisma.task.findMany({
    take: limit,
    where: {
      status: {
        not: 'DONE',
      },
      dueDate: {
        not: null,
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      status: true,
    },
  })

  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate!,
    priority: task.priority,
    status: task.status,
  }))
}

export async function getExpiringLeases(days = 30) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const leases = await prisma.lease.findMany({
    where: {
      status: LeaseStatus.ACTIVE,
      endDate: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    include: {
      tenant: {
        select: {
          firstName: true,
          lastName: true,
          company: true,
          bpCode: true,
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

  return leases
}

export async function getOverduePayments() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const payments = await prisma.payment.findMany({
    where: {
      paymentStatus: PaymentStatus.PENDING,
      paymentDate: {
        lt: new Date(),
      },
    },
    include: {
      lease: {
        include: {
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              company: true,
              bpCode: true,
            },
          },
        },
      },
    },
    orderBy: {
      paymentDate: 'asc',
    },
  })

  return payments
}