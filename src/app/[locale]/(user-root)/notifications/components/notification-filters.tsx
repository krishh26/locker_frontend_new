"use client"

import { useTranslations } from "next-intl"
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
  const t = useTranslations("notifications")
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="space-y-2">
        <Label htmlFor="type-filter">{t("filters.typeLabel")}</Label>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger id="type-filter" className="w-[180px]">
            <SelectValue placeholder={t("filters.allTypesPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
            <SelectItem value="notification">{t("types.notification")}</SelectItem>
            <SelectItem value="news">{t("types.news")}</SelectItem>
            <SelectItem value="allocation">{t("types.allocation")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="read-filter">{t("filters.statusLabel")}</Label>
        <Select value={readFilter} onValueChange={onReadFilterChange}>
          <SelectTrigger id="read-filter" className="w-[180px]">
            <SelectValue placeholder={t("filters.allStatusesPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
            <SelectItem value="unread">{t("filters.unread")}</SelectItem>
            <SelectItem value="read">{t("filters.read")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

