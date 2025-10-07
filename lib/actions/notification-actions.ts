// lib/actions/notification-actions.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { addDays, startOfDay } from "date-fns"

export interface NotificationData {
  id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: boolean
  readAt: Date | null
  actionUrl: string | null
  createdAt: Date
}

export async function getAllNotifications(): Promise<NotificationData[]> {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    // First, check and create lease expiry notifications if needed
    await checkAndCreateLeaseExpiryNotifications(session.user.id, session.user.role || "")

    // Then fetch all notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ isRead: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 20,
    })

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      readAt: notification.readAt,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    }))
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return []
  }
}

async function checkAndCreateLeaseExpiryNotifications(
  userId: string,
  userRole: string
): Promise<void> {
  try {
    const today = startOfDay(new Date())
    const ninetyDaysFromNow = addDays(today, 90)

    // Only check for admins/managers or tenants
    const isAdmin = ["ADMIN", "MANAGER"].includes(userRole)

    let expiringLeases

    if (isAdmin) {
      // Get all expiring leases for admins
      expiringLeases = await prisma.lease.findMany({
        where: {
          status: "ACTIVE",
          endDate: {
            gte: today,
            lte: ninetyDaysFromNow,
          },
        },
        include: {
          tenant: true,
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
      })
    } else {
      // Get only user's own leases if they're a tenant
      const tenant = await prisma.tenant.findUnique({
        where: { userId },
        select: { id: true },
      })

      if (!tenant) return

      expiringLeases = await prisma.lease.findMany({
        where: {
          tenantId: tenant.id,
          status: "ACTIVE",
          endDate: {
            gte: today,
            lte: ninetyDaysFromNow,
          },
        },
        include: {
          tenant: true,
          leaseUnits: {
            include: {
              unit: {
                include: {
                  property: true,
                },
              },
            },
          },
        },
      })
    }

    for (const lease of expiringLeases) {
      const endDate = startOfDay(new Date(lease.endDate))
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Determine priority
      let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      let shouldNotify = false

      if (daysUntilExpiry <= 30) {
        priority = "URGENT"
        shouldNotify = true
      } else if (daysUntilExpiry <= 60) {
        priority = "HIGH"
        // Notify at 60 days
        shouldNotify = daysUntilExpiry === 60
      } else if (daysUntilExpiry <= 90) {
        priority = "MEDIUM"
        // Notify at 90 days
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        shouldNotify = daysUntilExpiry === 90
      } else {
        continue
      }

      // Check if notification already exists for this user and lease
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          entityId: lease.id,
          entityType: "LEASE",
          type: "LEASE",
          createdAt: {
            gte: addDays(today, -7), // Check within last 7 days
          },
        },
      })

      if (existingNotification) {
        continue
      }

      // Get property names and units
      const propertyNames = lease.leaseUnits
        .map((lu) => lu.unit.property.propertyName)
        .filter((name, index, self) => self.indexOf(name) === index)
        .join(", ")

      const unitNumbers = lease.leaseUnits.map((lu) => lu.unit.unitNumber).join(", ")

      // Create notification
      if (isAdmin) {
        await prisma.notification.create({
          data: {
            userId,
            title: `Lease Expiring Soon - ${lease.tenant.businessName}`,
            message: `Lease for ${lease.tenant.businessName} expires in ${daysUntilExpiry} days. Units: ${unitNumbers} at ${propertyNames}. ${daysUntilExpiry <= 7 ? "Immediate action required!" : "Please plan for renewal or termination."}`,
            type: "LEASE",
            priority,
            actionUrl: `/dashboard/tenants/leases/${lease.id}`,
            entityId: lease.id,
            entityType: "LEASE",
            expiresAt: addDays(lease.endDate, 7),
          },
        })
      } else {
        await prisma.notification.create({
          data: {
            userId,
            title: "Your Lease is Expiring Soon",
            message: `Your lease for units ${unitNumbers} at ${propertyNames} will expire in ${daysUntilExpiry} days. Please contact management for renewal.`,
            type: "LEASE",
            priority,
            actionUrl: `/dashboard/my-lease`,
            entityId: lease.id,
            entityType: "LEASE",
            expiresAt: addDays(lease.endDate, 7),
          },
        })
      }
    }
  } catch (error) {
    console.error("[v0] Error checking lease expiry:", error)
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    return true
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
    return false
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    return true
  } catch (error) {
    console.error("[v0] Error marking all notifications as read:", error)
    return false
  }
}