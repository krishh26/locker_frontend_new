export type ForumChat = {
  course_course_id: string;
  course_course_name: string;
  course_course_code: string;
  latest_forum_created_at?: string;
  latest_forum_message?: string;
  /** Latest message sender (when provided by /forum/list). */
  latest_forum_sender?: ForumMessageSender;
  sender?: ForumMessageSender;
  /** Flat name fields some list payloads include. */
  first_name?: string;
  last_name?: string;
  latest_forum_sender_first_name?: string;
  latest_forum_sender_last_name?: string;
  latest_forum_sender_user_name?: string;
};

export type ForumMessageSender = {
  user_id: string;
  user_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: {
    url: string;
  };
};

/** Client-side delivery state for WhatsApp-style ticks. */
export type ForumMessageDeliveryStatus = "pending" | "sent" | "failed";

export type ForumMessage = {
  id: string;
  course_id: string;
  sender_id: string;
  message?: string;
  file?: {
    url: string;
    name: string;
  };
  created_at: string;
  sender: ForumMessageSender;
  /** Present for optimistic local sends; server messages are treated as sent. */
  delivery_status?: ForumMessageDeliveryStatus;
};

export type ForumChatListResponse = {
  status: boolean;
  data?: ForumChat[];
  message?: string;
  error?: string;
};

export type ForumMessagesResponse = {
  status: boolean;
  data?: ForumMessage[];
  meta?: {
    current_page: number;
    total_pages: number;
    total: number;
  };
  message?: string;
  error?: string;
};

export type SendMessageRequest = {
  course_id: string;
  sender_id: string;
  message?: string;
  file?: File;
};

export type SendMessageResponse = {
  status: boolean;
  data?: ForumMessage;
  message?: string;
  error?: string;
};

