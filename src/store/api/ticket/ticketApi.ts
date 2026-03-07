import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  TicketListResponse,
  Ticket,
  CreateTicketRequest,
  CreateTicketResponse,
  UpdateTicketRequest,
  UpdateTicketResponse,
  DeleteTicketRequest,
  DeleteTicketResponse,
  AddCommentRequest,
  AddCommentResponse,
  AddAttachmentResponse,
  AssignableUsersResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const ticketApi = createApi({
  reducerPath: "ticketApi",
  baseQuery,
  tagTypes: ["Ticket"],
  endpoints: (builder) => ({
    getTicketList: builder.query<
      TicketListResponse,
      {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        assigned_to?: number;
        keyword?: string;
        raised_by_me?: boolean;
        scope_only_not_mine?: boolean;
      }
    >({
      query: ({ page = 1, limit = 10, status, priority, assigned_to, keyword, raised_by_me, scope_only_not_mine }) => {
        let url = `/ticket/list?meta=true&page=${page}&limit=${limit}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        if (priority) url += `&priority=${encodeURIComponent(priority)}`;
        if (assigned_to) url += `&assigned_to=${assigned_to}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        if (raised_by_me) url += `&raised_by_me=true`;
        if (scope_only_not_mine) url += `&scope_only_not_mine=true`;
        return url;
      },
      providesTags: ["Ticket"],
      transformResponse: (response: TicketListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    getTicketById: builder.query<{ status: boolean; data?: Ticket; message?: string; error?: string }, number>({
      query: (id) => `/ticket/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Ticket", id: String(id) }],
      transformResponse: (response: { status: boolean; data?: Ticket; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    createTicket: builder.mutation<CreateTicketResponse, CreateTicketRequest>({
      query: (body) => ({
        url: "/ticket/create",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      invalidatesTags: ["Ticket"],
      transformResponse: (response: CreateTicketResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    updateTicket: builder.mutation<UpdateTicketResponse, UpdateTicketRequest>({
      query: ({ ticket_id, ...body }) => ({
        url: `/ticket/update/${ticket_id}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      invalidatesTags: ["Ticket"],
      transformResponse: (response: UpdateTicketResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    deleteTicket: builder.mutation<DeleteTicketResponse, DeleteTicketRequest>({
      query: ({ ticket_id }) => ({
        url: `/ticket/delete/${ticket_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ticket"],
      transformResponse: (response: DeleteTicketResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    addComment: builder.mutation<AddCommentResponse, AddCommentRequest>({
      query: ({ ticket_id, message }) => ({
        url: `/ticket/${ticket_id}/comment`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { message },
      }),
      invalidatesTags: (_result, _err, { ticket_id }) => [{ type: "Ticket", id: String(ticket_id) }],
      transformResponse: (response: AddCommentResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    addAttachment: builder.mutation<
      AddAttachmentResponse,
      { ticket_id: number; file_url?: string; file?: File }
    >({
      query: ({ ticket_id, file_url, file }) => {
        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          if (file_url) formData.append("file_url", file_url);
          return {
            url: `/ticket/${ticket_id}/attachment`,
            method: "POST",
            body: formData,
          };
        }
        return {
          url: `/ticket/${ticket_id}/attachment`,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { file_url },
        };
      },
      invalidatesTags: (_result, _err, { ticket_id }) => [{ type: "Ticket", id: String(ticket_id) }],
      transformResponse: (response: AddAttachmentResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    getAssignableUsers: builder.query<
      AssignableUsersResponse,
      { ticket_id?: number }
    >({
      query: ({ ticket_id } = {}) => {
        let url = "/ticket/assignable-users";
        if (ticket_id != null) {
          url += `?ticket_id=${ticket_id}`;
        }
        return url;
      },
      transformResponse: (response: AssignableUsersResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetTicketListQuery,
  useGetTicketByIdQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
  useAddCommentMutation,
  useAddAttachmentMutation,
  useGetAssignableUsersQuery,
} = ticketApi;
