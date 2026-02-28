export type TicketUser = {
  user_id: number;
  user_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: { key: string; url: string } | null;
};

export type TicketComment = {
  id: number;
  ticket_id: number;
  user_id: number;
  user?: TicketUser;
  message: string;
  created_at: string;
};

export type TicketAttachment = {
  id: number;
  ticket_id: number;
  file_url: string;
  uploaded_by?: TicketUser;
  created_at: string;
};

export type TicketStatus = "Open" | "InProgress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type Ticket = {
  ticket_id: number;
  ticket_number: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  raised_by: TicketUser;
  organisation_id: number;
  centre_id: number | null;
  assigned_to: TicketUser | null;
  due_date: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
};

export type TicketListResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Ticket[];
  meta_data?: {
    page: number;
    items: number;
    page_size: number;
    pages: number;
  };
};

export type CreateTicketRequest = {
  title: string;
  description: string;
  priority?: TicketPriority;
  centre_id?: number | null;
};

export type CreateTicketResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Ticket;
};

export type UpdateTicketRequest = {
  ticket_id: number;
  status?: TicketStatus;
  assigned_to?: number | null;
  priority?: TicketPriority;
};

export type UpdateTicketResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Ticket;
};

export type DeleteTicketRequest = {
  ticket_id: number;
};

export type DeleteTicketResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

export type AddCommentRequest = {
  ticket_id: number;
  message: string;
};

export type AddCommentResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: TicketComment;
};

export type AddAttachmentRequest = {
  ticket_id: number;
  file_url?: string;
  file?: File;
};

export type AddAttachmentResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: TicketAttachment;
};

export type AssignableUsersResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: TicketUser[];
};
