"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

export async function getUnreadNotifications(): Promise<NotificationData[]> {
  const session = await auth()

  if (!session?.user?.id) {
    return []
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        isRead: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 10,
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
