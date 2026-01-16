"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NotificationType } from "@/store/api/notification/types"

interface NotificationFiltersProps {
  typeFilter: NotificationType | "all"
  onTypeFilterChange: (type: NotificationType | "all") => void
  readFilter: "all" | "read" | "unread"
  onReadFilterChange: (read: "all" | "read" | "unread") => void
}

export function NotificationFilters({
  typeFilter,
  onTypeFilterChange,
  readFilter,
  onReadFilterChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="space-y-2">
        <Label htmlFor="type-filter">Type</Label>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger id="type-filter" className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="allocation">Allocation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="read-filter">Status</Label>
        <Select value={readFilter} onValueChange={onReadFilterChange}>
          <SelectTrigger id="read-filter" className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

