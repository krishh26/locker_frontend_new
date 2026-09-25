"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  FileText,
  Check,
  CheckCheck,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  normalizeForumMessage,
  useGetMessagesQuery,
  useSendMessageMutation,
} from "@/store/api/forum/forumApi";
import { useAppSelector } from "@/store/hooks";
import {
  ForumMessageInput,
  type ForumSendPayload,
} from "./forum-message-input";
import { format } from "date-fns";
import type { ForumChat } from "@/store/api/forum/types";
import type { ForumMessage } from "@/store/api/forum/types";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getCurrentUserDisplayName,
  getForumSenderDisplayName,
} from "../utils/display-name";

interface ForumMessageThreadProps {
  chat: ForumChat;
  onClose?: () => void;
}

function highlightMatch(text: string, term: string) {
  if (!term.trim() || !text) return text;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark
        key={index}
        className="rounded-sm bg-yellow-300/90 px-0.5 text-inherit dark:bg-yellow-500/50"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function messageMatchesSearch(message: ForumMessage, term: string) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;

  const sender = getForumSenderDisplayName(message.sender).toLowerCase();
  const body = (message.message || "").toLowerCase();
  const fileName = (message.file?.name || "").toLowerCase();

  return (
    body.includes(needle) ||
    sender.includes(needle) ||
    fileName.includes(needle)
  );
}

function getCurrentUserId(user: {
  id?: string;
  user_id?: unknown;
} | null): string {
  if (!user) return "";
  if (user.id != null && String(user.id) !== "") return String(user.id);
  if (user.user_id != null && String(user.user_id) !== "") {
    return String(user.user_id);
  }
  return "";
}

export function ForumMessageThread({
  chat,
  onClose,
}: ForumMessageThreadProps) {
  const user = useAppSelector((state) => state.auth.user);
  const t = useTranslations("forum");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [localMessages, setLocalMessages] = useState<ForumMessage[]>([]);

  const courseId = String(chat.course_course_id);
  const currentUserId = getCurrentUserId(user);

  const { data, isLoading } = useGetMessagesQuery({
    page: 1,
    page_size: 25,
    course_id: courseId,
  });
  const [sendMessage] = useSendMessageMutation();

  const messages = useMemo(() => {
    const server = (data?.data || []).map((m) => ({
      ...m,
      id: String(m.id),
      delivery_status: m.delivery_status ?? ("sent" as const),
    }));
    const serverIds = new Set(server.map((m) => String(m.id)));

    const extras = localMessages.filter((m) => {
      if (m.delivery_status === "pending" || m.delivery_status === "failed") {
        return true;
      }
      return !serverIds.has(String(m.id));
    });

    return [...server, ...extras].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [data?.data, localMessages]);

  const trimmedSearch = searchTerm.trim();
  const isSearching = trimmedSearch.length > 0;

  const matchingMessages = useMemo(() => {
    if (!isSearching) return messages;
    return messages.filter((message) =>
      messageMatchesSearch(message, trimmedSearch)
    );
  }, [messages, isSearching, trimmedSearch]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchTerm("");
    setActiveMatchIndex(0);
    setLocalMessages([]);
  }, [courseId]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [trimmedSearch, courseId]);

  useEffect(() => {
    if (!isSearching) {
      scrollToBottom();
    }
  }, [messages, isSearching, scrollToBottom]);

  useEffect(() => {
    if (!isSearching || matchingMessages.length === 0) return;

    const activeMessage = matchingMessages[activeMatchIndex];
    if (!activeMessage) return;

    const el = messageRefs.current.get(String(activeMessage.id));
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchIndex, isSearching, matchingMessages]);

  const handleSend = useCallback(
    async ({ message: text, file }: ForumSendPayload) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const localFileUrl = file ? URL.createObjectURL(file) : undefined;

      const optimistic: ForumMessage = {
        id: tempId,
        course_id: courseId,
        sender_id: currentUserId,
        message: text || undefined,
        file: file
          ? { url: localFileUrl || "", name: file.name }
          : undefined,
        created_at: new Date().toISOString(),
        sender: {
          user_id: currentUserId,
          user_name: String(user?.user_name || user?.email || "You"),
          first_name: user?.firstName,
          last_name: user?.lastName,
          email: user?.email,
        },
        delivery_status: "pending",
      };

      // Instant bubble with single tick
      setLocalMessages((prev) => [...prev, optimistic]);

      const formData = new FormData();
      formData.append("course_id", courseId);
      formData.append("sender_id", currentUserId);
      formData.append("message", text);
      if (file) {
        formData.append("file", file);
      }

      try {
        const result = await sendMessage(formData).unwrap();
        const confirmed =
          normalizeForumMessage(result.data, {
            ...optimistic,
            delivery_status: "sent",
          }) || { ...optimistic, delivery_status: "sent" as const };

        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...confirmed, delivery_status: "sent" }
              : m
          )
        );

        if (localFileUrl) {
          URL.revokeObjectURL(localFileUrl);
        }
      } catch {
        if (localFileUrl) {
          URL.revokeObjectURL(localFileUrl);
        }
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, delivery_status: "failed" } : m
          )
        );
        toast.error(t("messageInput.toastError"));
      }
    },
    [courseId, currentUserId, sendMessage, t, user]
  );

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

  const messagesWithDates = useMemo(() => {
    if (matchingMessages.length === 0) return [];

    const grouped: Array<ForumMessage | { type: "date"; date: string }> = [];
    let currentDate = "";

    matchingMessages.forEach((message) => {
      const messageDate = new Date(message.created_at);
      const dateKey = format(messageDate, "yyyy-MM-dd");
      const day = messageDate.getDate();
      const dayName = format(messageDate, "EEEE");
      const monthYear = format(messageDate, "MMMM yyyy");
      const ordinalSuffix = getOrdinalSuffix(day);
      const displayDate = `${dayName}, ${day}${ordinalSuffix} ${monthYear}`;

      if (dateKey !== currentDate) {
        currentDate = dateKey;
        grouped.push({
          type: "date",
          date: displayDate,
        } as ForumMessage & { type: "date"; date: string });
      }

      grouped.push(message);
    });

    return grouped;
  }, [matchingMessages]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchTerm("");
    setActiveMatchIndex(0);
  };

  const goToPrevMatch = () => {
    if (matchingMessages.length === 0) return;
    setActiveMatchIndex((prev) =>
      prev <= 0 ? matchingMessages.length - 1 : prev - 1
    );
  };

  const goToNextMatch = () => {
    if (matchingMessages.length === 0) return;
    setActiveMatchIndex((prev) =>
      prev >= matchingMessages.length - 1 ? 0 : prev + 1
    );
  };

  const isOwnMessage = (message: ForumMessage) => {
    if (
      message.delivery_status === "pending" ||
      message.delivery_status === "failed"
    ) {
      return true;
    }
    if (!currentUserId) return false;
    return (
      Number(message.sender?.user_id) === Number(currentUserId) ||
      Number(message.sender_id) === Number(currentUserId)
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("thread.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b bg-linear-to-r from-primary/5 via-primary/3 to-transparent p-4 dark:from-primary/10 dark:via-primary/5 dark:to-transparent">
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
          <AvatarImage
            src={chat.course_course_name.toLowerCase().charAt(0)}
            alt={chat.course_course_name}
          />
          <AvatarFallback className="bg-linear-to-br from-primary to-primary/70 font-semibold text-primary-foreground">
            {chat.course_course_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start">
            <h2 className="truncate font-semibold">{chat.course_course_name}</h2>
            <p className="text-sm text-muted-foreground">
              {chat.course_course_code}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            isSearchOpen ? closeSearch() : setIsSearchOpen(true)
          }
          aria-label={t("thread.searchPlaceholder")}
          className={cn(isSearchOpen && "bg-muted")}
        >
          {isSearchOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isSearchOpen && (
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("thread.searchPlaceholder")}
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  closeSearch();
                } else if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  goToPrevMatch();
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  goToNextMatch();
                }
              }}
            />
          </div>
          {isSearching && (
            <>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {matchingMessages.length === 0
                  ? t("thread.noMatches")
                  : t("thread.matchCount", {
                      current: activeMatchIndex + 1,
                      total: matchingMessages.length,
                    })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevMatch}
                disabled={matchingMessages.length === 0}
                aria-label={t("thread.previousMatch")}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMatch}
                disabled={matchingMessages.length === 0}
                aria-label={t("thread.nextMatch")}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="mx-auto w-fit rounded-full bg-accent p-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="font-medium text-muted-foreground">
                {t("thread.empty")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("thread.emptyDescription")}
              </p>
            </div>
          </div>
        ) : matchingMessages.length === 0 && isSearching ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">{t("thread.noMatches")}</p>
          </div>
        ) : (
          messagesWithDates.map((item) => {
            if ("type" in item && item.type === "date") {
              return (
                <div
                  key={`date-${item.date}`}
                  className="flex items-center justify-center py-4"
                >
                  <div className="rounded-full bg-primary px-4 py-1.5 shadow-sm">
                    <span className="text-xs font-medium text-white">
                      {item.date}
                    </span>
                  </div>
                </div>
              );
            }

            const message = item as ForumMessage;
            const isSent = isOwnMessage(message);
            const messageDate = new Date(message.created_at);
            const timeString = format(messageDate, "MMM d, HH:mm");
            const senderDisplayName = isSent
              ? getCurrentUserDisplayName(user, message.sender)
              : getForumSenderDisplayName(message.sender);
            const avatarInitial =
              senderDisplayName[0]?.toUpperCase() || "U";
            const isActiveMatch =
              isSearching &&
              String(matchingMessages[activeMatchIndex]?.id) ===
                String(message.id);
            const status = message.delivery_status ?? "sent";

            return (
              <div
                key={message.id}
                ref={(el) => {
                  if (el) {
                    messageRefs.current.set(String(message.id), el);
                  } else {
                    messageRefs.current.delete(String(message.id));
                  }
                }}
                className={cn(
                  "flex gap-3",
                  isSent ? "justify-end" : "justify-start"
                )}
              >
                {!isSent && (
                  <Avatar className="size-8 shrink-0 shadow-sm">
                    <AvatarImage
                      src={message.sender.avatar?.url}
                      alt={senderDisplayName}
                    />
                    <AvatarFallback className="bg-accent text-xs font-semibold text-white">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2 shadow-sm",
                    isSent
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted",
                    isActiveMatch &&
                      "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background",
                    status === "failed" && "opacity-80"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isSent
                        ? "text-primary-foreground/90"
                        : "text-accent-foreground dark:text-accent"
                    )}
                  >
                    {isSearching
                      ? highlightMatch(senderDisplayName, trimmedSearch)
                      : senderDisplayName}
                  </span>
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
                      <span className="text-sm">
                        {isSearching
                          ? highlightMatch(message.file.name, trimmedSearch)
                          : message.file.name}
                      </span>
                    </a>
                  )}
                  {message.message && (
                    <p className="wrap-break-word text-sm whitespace-pre-wrap">
                      {isSearching
                        ? highlightMatch(message.message, trimmedSearch)
                        : message.message}
                    </p>
                  )}
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 text-xs",
                      isSent
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    <span>{timeString}</span>
                    {isSent &&
                      (status === "failed" ? (
                        <AlertCircle
                          className="h-3.5 w-3.5 text-red-300"
                          aria-label="Failed"
                        />
                      ) : status === "pending" ? (
                        <Check className="h-3.5 w-3.5" aria-label="Sending" />
                      ) : (
                        <CheckCheck
                          className="h-3.5 w-3.5"
                          aria-label="Sent"
                        />
                      ))}
                  </div>
                </div>
                {isSent && (
                  <Avatar className="size-8 shrink-0 shadow-sm">
                    <AvatarFallback className="bg-linear-to-br from-primary/80 to-primary text-xs font-semibold text-primary-foreground">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t bg-linear-to-r from-muted/30 to-transparent p-4">
        <ForumMessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
