"use client";

import { useState, useRef } from "react";
import { Send, Smile, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => null,
  }
);

export type ForumSendPayload = {
  message: string;
  file: File | null;
};

interface ForumMessageInputProps {
  onSend: (payload: ForumSendPayload) => void;
  disabled?: boolean;
}

export function ForumMessageInput({
  onSend,
  disabled = false,
}: ForumMessageInputProps) {
  const t = useTranslations("forum");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    const trimmed = message.trim();
    if ((!trimmed && !file) || disabled) {
      return;
    }

    onSend({ message: trimmed, file });

    setMessage("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleFileRemove = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSend = Boolean(message.trim() || file) && !disabled;

  return (
    <div className="relative space-y-2">
      {file && (
        <div className="flex items-center gap-2 rounded-lg border border-accent bg-accent p-2">
          <FileText className="h-4 w-4 text-white" />
          <span className="flex-1 truncate text-sm">{file.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleFileRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("messageInput.placeholder")}
            className="min-h-[60px] resize-none border border-primary/30 pr-20 focus-visible:ring-primary/30"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={!canSend}
          size="icon"
          className="h-[60px] w-[60px] bg-linear-to-br from-primary to-primary/80 shadow-md transition-all duration-200 hover:from-primary/90 hover:to-primary hover:shadow-lg"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {showEmojiPicker && (
        <div className="absolute right-0 bottom-full z-10 mb-2">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
}
