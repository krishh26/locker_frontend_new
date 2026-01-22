"use client"

import { format } from "date-fns"
import { Check, X, Bell, BellRing, Newspaper, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Notification, NotificationType } from "@/store/api/notification/types"
import { useMemo } from "react"

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s]+)/g

// Function to parse message and convert URLs to clickable links
const parseMessageWithLinks = (message: string) => {
  const parts: Array<{ text: string; isUrl: boolean }> = []
  let lastIndex = 0
  let match

  while ((match = URL_REGEX.exec(message)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      parts.push({
        text: message.substring(lastIndex, match.index),
        isUrl: false,
      })
    }
    // Add URL
    parts.push({
      text: match[0],
      isUrl: true,
    })
    lastIndex = URL_REGEX.lastIndex
  }

  // Add remaining text after last URL
  if (lastIndex < message.length) {
    parts.push({
      text: message.substring(lastIndex),
      isUrl: false,
    })
  }

  // If no URLs found, return original message
  if (parts.length === 0) {
    parts.push({ text: message, isUrl: false })
  }

  return parts
}

interface NotificationItemProps {
  notification: Notification
  onRead?: (id: number) => void
  onDelete?: (id: number) => void
}

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

const getTypeLabel = (type: NotificationType): string => {
  switch (type) {
    case "notification":
      return "Notification"
    case "news":
      return "News"
    case "allocation":
      return "Allocation"
    default:
      return "Notification"
  }
}

export function NotificationItem({
  notification,
  onRead,
  onDelete,
}: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type)

  // Parse message to extract URLs
  const messageParts = useMemo(
    () => parseMessageWithLinks(notification.message || ""),
    [notification.message]
  )

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        notification.read
          ? "bg-background border-border"
          : "bg-primary/5 dark:bg-primary/10 border-primary/20"
      }`}
    >
      <div className="mt-1">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={`text-sm font-semibold ${
                  notification.read ? "text-muted-foreground" : ""
                }`}
              >
                {notification.title}
              </h4>
              {!notification.read && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getTypeLabel(notification.type)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {messageParts.map((part, index) => {
                if (part.isUrl) {
                  return (
                    <a
                      key={index}
                      href={part.text}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium break-all"
                      onClick={() => {
                        // Mark notification as read when link is clicked
                        if (onRead && !notification.read) {
                          onRead(notification.notification_id)
                        }
                      }}
                    >
                      {part.text}
                    </a>
                  )
                }
                return <span key={index}>{part.text}</span>
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRead && !notification.read && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRead(notification.notification_id)}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark as read
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.notification_id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

