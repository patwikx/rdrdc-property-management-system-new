"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import {
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationData,
} from "@/lib/actions/notification-actions"
import { cn } from "@/lib/utils"

const priorityColors = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-muted-foreground",
}

const typeIcons = {
  SYSTEM: "🔔",
  MAINTENANCE: "🔧",
  LEASE: "📄",
  PAYMENT: "💰",
  DOCUMENT: "📁",
  SECURITY: "🔒",
  UTILITY: "⚡",
  TAX: "📊",
  PROPERTY: "🏢",
  UNIT: "🏠",
  TENANT: "👤",
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Fetching notifications...")
      const data = await getUnreadNotifications()
      console.log("[v0] Notifications fetched:", data.length)
      setNotifications(data)
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!mounted) return

    fetchNotifications()

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [mounted])

  const handleMarkAsRead = async (notificationId: string, actionUrl: string | null) => {
    await markNotificationAsRead(notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    if (actionUrl) {
      setIsOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications([])
  }

  const unreadCount = notifications.length

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground text-center">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleMarkAsRead(notification.id, notification.actionUrl)}
                >
                  {notification.actionUrl ? (
                    <Link href={notification.actionUrl} className="block">
                      <NotificationItem notification={notification} />
                    </Link>
                  ) : (
                    <NotificationItem notification={notification} />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Link href="/system/notifications">
                <Button variant="ghost" className="w-full text-xs" size="sm">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({ notification }: { notification: NotificationData }) {
  const typeIcon = typeIcons[notification.type as keyof typeof typeIcons] || "🔔"
  const priorityColor = priorityColors[notification.priority as keyof typeof priorityColors] || "text-muted-foreground"

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{typeIcon}</span>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">{notification.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            <span className={cn("text-xs font-medium", priorityColor)}>{notification.priority}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
