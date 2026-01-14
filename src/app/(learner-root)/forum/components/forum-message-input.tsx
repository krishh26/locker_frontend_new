"use client";

import { useState, useRef } from "react";
import { Send, Smile, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSendMessageMutation } from "@/store/api/forum/forumApi";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamically import emoji picker to avoid SSR issues
// Note: Install emoji-picker-react: npm install emoji-picker-react
const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => null,
  }
);

interface ForumMessageInputProps {
  courseId: string;
}

export function ForumMessageInput({ courseId }: ForumMessageInputProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sendMessage, { isLoading }] = useSendMessageMutation();

  const handleSendMessage = async () => {
    if (!message.trim() && !file) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("course_id", courseId);
      formData.append("sender_id", user?.id || "");
      formData.append("message", message);
      if (file) {
        formData.append("file", file);
      }

      await sendMessage(formData).unwrap();
      setMessage("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowEmojiPicker(false);
      toast.success("Message sent successfully");
    } catch (error) {
      toast.error("Failed to send message");
    }
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

  const canSend = (message.trim() || file) && !isLoading;

  return (
    <div className="relative space-y-2">
      {/* File Preview */}
      {file && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted p-2">
          <FileText className="h-4 w-4" />
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

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none pr-20"
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isLoading}
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
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={!canSend}
          size="icon"
          className="h-[60px] w-[60px]"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-10">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
}

