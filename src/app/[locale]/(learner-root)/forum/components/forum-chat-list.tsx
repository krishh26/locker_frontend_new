"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useGetChatListQuery } from "@/store/api/forum/forumApi"
import { useAppSelector } from "@/store/hooks"
import { timeAgo } from "../utils/timeAgo"
import type { ForumChat } from "@/store/api/forum/types"

// Theme-adaptive avatar colors that cycle through chat items
const avatarColors = [
  "bg-primary",
  "bg-secondary",
  "bg-accent",
  "bg-primary/80",
  "bg-secondary/80",
  "bg-accent/80",
  "bg-primary/60",
  "bg-secondary/60",
]

// Theme-adaptive chat item backgrounds – follows active theme automatically
const chatItemBgColors = [
  "bg-primary/5",
  "bg-secondary/5",
  "bg-accent/5",
  "bg-primary/8",
  "bg-muted/50",
  "bg-secondary/8",
  "bg-accent/8",
  "bg-primary/10",
]

interface ForumChatListProps {
  onChatSelect: (chat: ForumChat) => void
  selectedChatId?: string
}

export function ForumChatList({
  onChatSelect,
  selectedChatId,
}: ForumChatListProps) {
  const user = useAppSelector((state) => state.auth.user)
  const userId = user?.role === "Admin" ? undefined : user?.id
  const { data, isLoading } = useGetChatListQuery(userId)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredChats = data?.data?.filter((chat) =>
    chat.course_course_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading chats...</p>
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
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">No courses found</p>
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
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat, index) => {
          const isSelected = chat.course_course_id === selectedChatId
          const initials = chat.course_course_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)

          return (
            <div
              key={chat.course_course_id}
              onClick={() => onChatSelect(chat)}
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
                <AvatarFallback className={cn("text-white font-semibold", avatarColors[index % avatarColors.length])}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className={cn("truncate font-semibold", isSelected && "text-primary")}>
                    {chat.course_course_name}
                  </h3>
                  {chat.latest_forum_created_at && (
                    <span className="text-muted-foreground text-xs">
                      {timeAgo(chat.latest_forum_created_at)}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {chat.course_course_code}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
