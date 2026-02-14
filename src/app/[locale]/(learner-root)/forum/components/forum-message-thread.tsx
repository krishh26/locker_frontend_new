"use client";

import { useEffect, useRef, useMemo } from "react";
import { ArrowLeft, FileText, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useGetMessagesQuery } from "@/store/api/forum/forumApi";
import { useAppSelector } from "@/store/hooks";
import { ForumMessageInput } from "./forum-message-input";
import { format } from "date-fns";
import type { ForumChat } from "@/store/api/forum/types";
import type { ForumMessage } from "@/store/api/forum/types";

interface ForumMessageThreadProps {
  chat: ForumChat;
  onClose?: () => void;
}

export function ForumMessageThread({
  chat,
  onClose,
}: ForumMessageThreadProps) {
  const user = useAppSelector((state) => state.auth.user);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useGetMessagesQuery({
    page: 1,
    page_size: 25,
    course_id: chat.course_course_id,
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.data]);

  const messages = useMemo(() => data?.data || [], [data?.data]);

  // Helper function to get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Group messages by date and add date headers
  const messagesWithDates = useMemo(() => {
    if (messages.length === 0) return [];

    const grouped: Array<ForumMessage | { type: "date"; date: string }> = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at);
      const dateKey = format(messageDate, "yyyy-MM-dd");
      const day = messageDate.getDate();
      const dayName = format(messageDate, "EEEE");
      const monthYear = format(messageDate, "MMMM yyyy");
      const ordinalSuffix = getOrdinalSuffix(day);
      const displayDate = `${dayName}, ${day}${ordinalSuffix} ${monthYear}`;

      // Add date header if date changed
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        grouped.push({ type: "date", date: displayDate } as ForumMessage & { type: "date"; date: string });
      }

      grouped.push(message);
    });

    return grouped;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4 bg-linear-to-r from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10 cursor-pointer shadow-sm ring-2 ring-primary/20">
          <AvatarImage src={chat.course_course_name.toLowerCase().charAt(0)} alt={chat.course_course_name} />
          <AvatarFallback className="bg-linear-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
              {chat.course_course_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start flex-col">
            <h2 className="font-semibold truncate">{chat.course_course_name}</h2>
            <p className="text-muted-foreground text-sm">{chat.course_course_code}</p>
          </div>

        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center space-y-2">
              <div className="mx-auto rounded-full bg-accent p-4 w-fit">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-muted-foreground font-medium">No messages yet</p>
              <p className="text-muted-foreground text-sm">
                Start the conversation
              </p>
            </div>
          </div>
        ) : (
          messagesWithDates.map((item) => {
            // Check if this is a date header
            if ("type" in item && item.type === "date") {
              return (
                <div
                  key={`date-${item.date}`}
                  className="flex items-center justify-center py-4"
                >
                  <div className="rounded-full bg-primary px-4 py-1.5 shadow-sm">
                    <span className="text-white text-xs font-medium">
                      {item.date}
                    </span>
                  </div>
                </div>
              );
            }

            // Regular message
            const message = item as ForumMessage;
            const isSent = Number(message.sender.user_id) === Number(user?.id);
            const messageDate = new Date(message.created_at);
            const timeString = format(messageDate, "MMM d, HH:mm");

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isSent ? "justify-end" : "justify-start"
                )}
              >
                {!isSent && (
                  <Avatar className="size-8 shrink-0 shadow-sm">
                    <AvatarImage
                      src={message.sender.avatar?.url}
                      alt={message.sender.user_name}
                    />
                    <AvatarFallback className="bg-accent text-white text-xs font-semibold">
                      {message.sender.user_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2 shadow-sm",
                    isSent
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {!isSent && (
                    <span className="text-xs font-semibold text-accent-foreground dark:text-accent">
                      {message.sender.user_name}
                    </span>
                  )}
                  {message.file && (
                    <a
                      href={message.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 hover:underline",
                        isSent && "text-primary-foreground"
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{message.file.name}</span>
                    </a>
                  )}
                  {message.message && (
                    <p className="whitespace-pre-wrap wrap-break-word text-sm">
                      {message.message}
                    </p>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      isSent
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    <span>{timeString}</span>
                    {isSent && (
                      <CheckCheck className="h-3 w-3" />
                    )}
                  </div>
                </div>
                {isSent && (
                  <Avatar className="size-8 shrink-0 shadow-sm">
                    <AvatarFallback className="bg-linear-to-br from-primary/80 to-primary text-primary-foreground text-xs font-semibold">
                      {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4 bg-linear-to-r from-muted/30 to-transparent">
        <ForumMessageInput courseId={chat.course_course_id} />
      </div>
    </div>
  );
}

