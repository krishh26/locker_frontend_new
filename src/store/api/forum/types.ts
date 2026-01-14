export type ForumChat = {
  course_course_id: string;
  course_course_name: string;
  course_course_code: string;
  latest_forum_created_at?: string;
};

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
  sender: {
    user_id: string;
    user_name: string;
    avatar?: {
      url: string;
    };
  };
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

