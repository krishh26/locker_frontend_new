"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X } from "lucide-react"
import {
  useGetInnovationCommentsQuery,
  useCreateInnovationCommentMutation,
} from "@/store/api/innovations/innovationsApi"
import { toast } from "sonner"
import { useAppSelector } from "@/store/hooks"
import type { Innovation, InnovationComment } from "@/store/api/innovations/types"

interface InnovationsViewChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  innovation: Innovation | null
  onSuccess: () => void
}

const timeAgo = (timestamp: string) => {
  if (!timestamp) return ""

  const now = new Date()
  const past = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  const minutes = Math.floor(diffInSeconds / 60)
  const hours = Math.floor(diffInSeconds / 3600)
  const days = Math.floor(diffInSeconds / 86400)
  const weeks = Math.floor(diffInSeconds / 604800)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec${diffInSeconds !== 1 ? "s" : ""} ago`
  } else if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? "s" : ""} ago`
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`
  } else if (days < 7) {
    return `${days} day${days !== 1 ? "s" : ""} ago`
  } else {
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`
  }
}

const getRandomColor = (seed: string) => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function InnovationsViewChatDrawer({
  open,
  onOpenChange,
  innovation,
  onSuccess,
}: InnovationsViewChatDrawerProps) {
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = Array.isArray(user?.roles) ? user.roles.includes("Admin") : user?.role === "Admin"
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [newMessage, setNewMessage] = useState("")

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useGetInnovationCommentsQuery(
    {
      innovationId: innovation?.id || 0,
    },
    {
      skip: !innovation?.id || !open,
    }
  )

  const [createComment, { isLoading: isSending }] =
    useCreateInnovationCommentMutation()

  // Extract comments from the Innovation object's comment array
  const comments = useMemo(() => commentsData?.data?.comment || [], [commentsData])

  useEffect(() => {
    if (open && innovation) {
      refetchComments()
      setNewMessage("")
    }
  }, [open, innovation, refetchComments])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !innovation) return

    const messageType = isAdmin ? "Response" : "Reply"


    try {
      await createComment({
        innovation_id: innovation.id,
        type: messageType,
        description: newMessage,
        date: new Date().toISOString(),
      }).unwrap()
      setNewMessage("")
      refetchComments()
      onSuccess()
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { message?: string } }).data?.message ===
          "string"
          ? (error as { data: { message: string } }).data.message
          : "Failed to send message. Please try again."
      toast.error(errorMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!innovation) return null

  const isInnovationOwner =
    innovation.innovation_propose_by_id?.user_id === user?.user_id

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[50%] overflow-y-auto">
        <SheetHeader className="relative pb-4 border-b">
          <SheetTitle className="pr-8 truncate">{innovation.topic}</SheetTitle>
          <SheetDescription className="line-clamp-2">
            {innovation.description}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-120px)] mt-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {isLoadingComments ? (
              <div className="text-center text-muted-foreground py-8">
                Loading messages...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              comments.map((message: InnovationComment , index: number) => {
                const isOwnerMessage =
                  isInnovationOwner && message.type === "Response"
                const isUserMessage =
                  !isInnovationOwner && message.type === "Reply"

                // Admin response to owner
                if (isOwnerMessage) {
                  return (
                    <div key={index} className="flex justify-start">
                      <div className="flex items-start gap-3 bg-muted rounded-lg p-4 max-w-[80%]">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            style={{
                              backgroundColor: getRandomColor("admin"),
                            }}
                          >
                            A
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm">Admin</span>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(message.date || message.created_at || "")}
                            </span>
                          </div>
                          <p className="text-sm wrap-break-word">
                            {message.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }

                // User reply
                if (isUserMessage) {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-[80%]">
                        <p className="text-sm wrap-break-word">
                          {message.description}
                        </p>
                        <div className="flex justify-end mt-1">
                          <span className="text-xs opacity-80">
                            {timeAgo(message.date || message.created_at || "")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }

                // Other cases (non-owner reply or admin response to non-owner)
                const isResponse = message.type === "Response"
                return (
                  <div
                    key={message.id}
                    className={`flex ${isResponse ? "justify-start" : "justify-end"}`}
                  >
                    {isResponse ? (
                      <div className="flex items-start gap-3 bg-muted rounded-lg p-4 max-w-[80%]">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              innovation.innovation_propose_by_id?.avatar?.url
                            }
                          />
                          <AvatarFallback>
                            {innovation.innovation_propose_by_id?.user_name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm">
                              {innovation.innovation_propose_by_id?.user_name ||
                                "User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(message.date || message.created_at || "")}
                            </span>
                          </div>
                          <p className="text-sm wrap-break-word">
                            {message.description}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-[80%]">
                        <p className="text-sm wrap-break-word">
                          {message.description}
                        </p>
                        <div className="flex justify-end mt-1">
                          <span className="text-xs opacity-80">
                            {timeAgo(message.date || message.created_at || "")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Start your chat..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending || innovation.status === "Closed"}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending || innovation.status === "Closed"}
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
            {innovation.status === "Closed" && (
              <p className="text-xs text-muted-foreground mt-2">
                This innovation is closed. No new messages can be sent.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

