"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  BellRing,
  Check,
  X,
  CheckCheck,
  Trash2,
  Newspaper,
  FileText,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetNotificationsQuery, useReadAllNotificationsMutation, useDeleteAllNotificationsMutation, useReadNotificationMutation, useDeleteNotificationMutation } from "@/store/api/notification/notificationApi"
import { toast } from "sonner"
import type { Notification, NotificationType } from "@/store/api/notification/types"
import { format } from "date-fns"

const NOTIFICATION_ITEMS_TO_SHOW = 5

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "notification":
      return BellRing
    case "news":
      return Newspaper
    case "allocation":
      return FileText
    default:
      return Bell
  }
}

interface NotificationItemProps {
  notification: Notification
  onRead?: (id: number) => void
  onDelete?: (id: number) => void
}

function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type)

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        notification.read
          ? "bg-transparent"
          : "bg-primary/5 dark:bg-primary/10"
      }`}
    >
      <div className="mt-0.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={`text-sm ${
            notification.read
              ? "font-normal text-muted-foreground"
              : "font-semibold"
          }`}
        >
          {notification.title.length > 30
            ? `${notification.title.slice(0, 30)}...`
            : notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message.length > 50
            ? `${notification.message.slice(0, 50)}...`
            : notification.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(notification.created_at), "MMM d, h:mm a")}
        </p>
      </div>
      <div className="flex gap-1">
        {onRead && !notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onRead(notification.notification_id)}
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDelete(notification.notification_id)}
            title="Delete"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { data, isLoading, error } = useGetNotificationsQuery(
    {
      page: 1,
      page_size: NOTIFICATION_ITEMS_TO_SHOW,
    },
    {
      pollingInterval: 300000, // 5 minutes
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  )

  const [readAll, { isLoading: isReadingAll }] = useReadAllNotificationsMutation()
  const [deleteAll, { isLoading: isDeletingAll }] = useDeleteAllNotificationsMutation()
  const [readNotification] = useReadNotificationMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const handleRead = async (id: number) => {
    try {
      await readNotification({ notification_id: id }).unwrap()
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification({ notification_id: id }).unwrap()
      toast.success("Notification deleted")
    } catch {
      toast.error("Failed to delete notification")
    }
  }

  const notifications = data?.data || []
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleReadAll = async () => {
    try {
      await readAll().unwrap()
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAll().unwrap()
      toast.success("All notifications deleted")
    } catch {
      toast.error("Failed to delete all notifications")
    }
  }

  const handleViewAll = () => {
    setOpen(false)
    router.push("/notifications")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative cursor-pointer">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Failed to load notifications
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">No notifications</p>
              <p className="text-xs text-muted-foreground">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.notification_id}
                  notification={notification}
                  onRead={handleRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleViewAll}
              >
                View all notifications
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={handleReadAll}
                  disabled={isReadingAll || unreadCount === 0}
                >
                  {isReadingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                >
                  {isDeletingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete all
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

