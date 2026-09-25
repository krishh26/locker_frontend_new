"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  useGetChatListQuery,
  useGetMessagesQuery,
} from "@/store/api/forum/forumApi"
import { useAppSelector } from "@/store/hooks"
import { timeAgo } from "../utils/timeAgo"
import {
  getForumChatListSenderName,
  getForumSenderDisplayName,
} from "../utils/display-name"
import type { ForumChat } from "@/store/api/forum/types"
import { useTranslations } from "next-intl"

// Theme-adaptive avatar colors that cycle through chat items
const avatarColors = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-primary",
  "bg-secondary",
]

// Theme-adaptive chat item backgrounds – follows active theme automatically
const chatItemBgColors = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-primary",
  "bg-muted",
  "bg-secondary",
  "bg-accent",
  "bg-primary",
]

interface ForumChatListProps {
  onChatSelect: (chat: ForumChat) => void
  selectedChatId?: string
}

function ForumChatListItem({
  chat,
  index,
  isSelected,
  onSelect,
}: {
  chat: ForumChat
  index: number
  isSelected: boolean
  onSelect: () => void
}) {
  // Reuse messages cache so opening a chat is instant; also gives us latest sender name.
  const { data: messagesData } = useGetMessagesQuery({
    page: 1,
    page_size: 25,
    course_id: String(chat.course_course_id),
  })

  const latestMessage = messagesData?.data?.[messagesData.data.length - 1]
  const senderName =
    (latestMessage
      ? getForumSenderDisplayName(latestMessage.sender)
      : "") || getForumChatListSenderName(chat)

  const initials = chat.course_course_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b p-4 transition-all duration-200 hover:brightness-95 dark:hover:brightness-110",
        isSelected
          ? "bg-linear-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-l-2 border-l-primary"
          : chatItemBgColors[index % chatItemBgColors.length]
      )}
    >
      <Avatar
        className={cn(
          "h-12 w-12 shadow-sm",
          isSelected && "ring-2 ring-primary/30"
        )}
      >
        <AvatarImage
          src={chat.course_course_name.toLowerCase().charAt(0)}
          alt={chat.course_course_name}
        />
        <AvatarFallback
          className={cn(
            "text-white font-semibold",
            avatarColors[index % avatarColors.length]
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={cn(
              "truncate font-semibold",
              isSelected ? "text-primary" : "text-white"
            )}
          >
            {chat.course_course_name}
          </h3>
          {chat.latest_forum_created_at && (
            <span
              className={cn(
                "shrink-0 text-xs",
                isSelected ? "text-muted-foreground" : "text-white/70"
              )}
            >
              {timeAgo(chat.latest_forum_created_at)}
            </span>
          )}
        </div>
        {senderName ? (
          <p
            className={cn(
              "truncate text-sm font-medium",
              isSelected ? "text-foreground" : "text-white"
            )}
          >
            {senderName}
          </p>
        ) : null}
        <p
          className={cn(
            "truncate text-sm",
            isSelected ? "text-muted-foreground" : "text-white/70"
          )}
        >
          {chat.course_course_code}
        </p>
      </div>
    </div>
  )
}

export function ForumChatList({
  onChatSelect,
  selectedChatId,
}: ForumChatListProps) {
  const t = useTranslations("forum")
  const user = useAppSelector((state) => state.auth.user)
  const userId = user?.role === "Admin" ? undefined : user?.id
  const { data, isLoading } = useGetChatListQuery(userId)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredChats = data?.data?.filter((chat) => {
    const term = searchTerm.toLowerCase()
    const senderName = getForumChatListSenderName(chat).toLowerCase()
    return (
      chat.course_course_name.toLowerCase().includes(term) ||
      chat.course_course_code.toLowerCase().includes(term) ||
      senderName.includes(term)
    )
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("chatList.loading")}</p>
      </div>
    )
  }

  if (!filteredChats || filteredChats.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("chatList.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{t("chatList.noCourses")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("chatList.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat, index) => (
          <ForumChatListItem
            key={chat.course_course_id}
            chat={chat}
            index={index}
            isSelected={chat.course_course_id === selectedChatId}
            onSelect={() => onChatSelect(chat)}
          />
        ))}
      </div>
    </div>
  )
}
