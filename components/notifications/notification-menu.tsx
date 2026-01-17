"use client"

import { useState, useEffect } from "react"
import { Bell, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationData,
} from "@/lib/actions/notification-actions"
import { cn } from "@/lib/utils"

const priorityColors = {
  URGENT: "text-rose-600 font-bold",
  HIGH: "text-orange-600 font-bold",
  MEDIUM: "text-amber-600",
  LOW: "text-muted-foreground",
}

const typeIcons = {
  SYSTEM: "SYSTEM",
  MAINTENANCE: "RWO",
  LEASE: "LEASE",
  PAYMENT: "PAYMENT",
  DOCUMENT: "DOCS",
  SECURITY: "SEC",
  UTILITY: "UTIL",
  TAX: "TAX",
  PROPERTY: "PROP",
  UNIT: "UNIT",
  TENANT: "TENANT",
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
      const data = await getAllNotifications()
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

    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [mounted])

  const handleMarkAsRead = async (notificationId: string, actionUrl: string | null) => {
    await markNotificationAsRead(notificationId)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)),
    )

    if (actionUrl) {
      setIsOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none text-muted-foreground">
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/10">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <div className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-none animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 rounded-none border-border" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/5">
          <div className="flex items-center gap-2">
             <Bell className="h-4 w-4" />
             <span className="font-bold text-xs uppercase tracking-widest">System Logs</span>
             {unreadCount > 0 && (
               <span className="bg-rose-500 text-white text-[10px] px-1 font-mono">{unreadCount} NEW</span>
             )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 rounded-none px-2 text-[10px] uppercase font-mono tracking-wider text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-xs font-mono text-muted-foreground uppercase">Loading logs...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-2">
              <Check className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">System Nominal</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 border-b border-border/50 hover:bg-muted/5 transition-colors cursor-pointer group",
                    notification.isRead ? "opacity-60 bg-muted/10" : "bg-background border-l-2 border-l-primary"
                  )}
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
          <div className="p-0 border-t border-border">
            <Link href="/dashboard/system/notifications">
              <Button variant="ghost" className="w-full rounded-none h-9 text-[10px] uppercase tracking-widest font-semibold hover:bg-muted/10">
                View Full Log
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({ notification }: { notification: NotificationData }) {
  const typeLabel = typeIcons[notification.type as keyof typeof typeIcons] || "SYS"
  const priorityColor = priorityColors[notification.priority as keyof typeof priorityColors] || "text-muted-foreground"

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-mono font-bold bg-muted/20 px-1 text-muted-foreground">{typeLabel}</span>
           {!notification.isRead && (
             <span className="h-1.5 w-1.5 bg-emerald-500 rounded-none animate-pulse" />
           )}
        </div>
        <span className="text-[9px] font-mono text-muted-foreground uppercase">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
      </div>
      
      <div className="space-y-0.5">
        <p className={cn("text-xs font-semibold uppercase tracking-wide leading-tight", notification.isRead ? "text-muted-foreground" : "text-foreground")}>
          {notification.title}
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 font-mono">
          {notification.message}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <span className={cn("text-[9px] uppercase tracking-wider", priorityColor)}>
          {notification.priority} PRIORITY
        </span>
      </div>
    </div>
  )
}