"use client";

import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ForumChatList } from "./forum-chat-list";
import { ForumMessageThread } from "./forum-message-thread";
import { useState, useEffect } from "react";
import type { ForumChat } from "@/store/api/forum/types";
import { useTranslations } from "next-intl";

export function ForumPageContent() {
  const t = useTranslations("forum");
  const [selectedChat, setSelectedChat] = useState<ForumChat | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleChatSelect = (chat: ForumChat) => {
    setSelectedChat(chat);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={MessageSquare}
      />

      <div className="flex h-[calc(100vh-12rem)] gap-0 overflow-hidden rounded-xl border shadow-sm bg-linear-to-br from-background via-background to-muted/30">
        {/* Chat List - Show on desktop or when no chat selected on mobile */}
        {(!isMobile || !selectedChat) && (
          <div className="w-full border-r md:w-[30%] bg-linear-to-b from-muted/20 to-background">
            <ForumChatList
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChat?.course_course_id}
            />
          </div>
        )}

        {/* Message Thread - Show on desktop or when chat selected on mobile */}
        {(!isMobile || selectedChat) && (
          <div className="flex-1">
            {selectedChat ? (
              <ForumMessageThread
                chat={selectedChat}
                onClose={isMobile ? handleCloseChat : undefined}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-primary p-6">
                  <MessageSquare className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {t("empty.noChatSelected")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t("empty.noChatSelectedDescription")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

