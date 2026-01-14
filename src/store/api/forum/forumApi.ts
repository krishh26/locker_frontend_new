import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  ForumChatListResponse,
  ForumMessagesResponse,
  SendMessageResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const forumApi = createApi({
  reducerPath: "forumApi",
  baseQuery,
  tagTypes: ["ForumChat", "ForumMessage"],
  endpoints: (builder) => ({
    getChatList: builder.query<ForumChatListResponse, string | undefined>({
      query: (userId) => {
        const params = userId ? `?user_id=${userId}` : "";
        return `/forum/list${params}`;
      },
      providesTags: ["ForumChat"],
      transformResponse: (response: ForumChatListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getMessages: builder.query<
      ForumMessagesResponse,
      { page: number; page_size: number; course_id: string }
    >({
      query: ({ course_id }) =>
        `/forum/messages/${course_id}?meta=true&page=1&limit=500`,
      providesTags: ["ForumMessage"],
      transformResponse: (response: ForumMessagesResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    sendMessage: builder.mutation<SendMessageResponse, FormData>({
      query: (formData) => ({
        url: "/forum/send",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ForumMessage", "ForumChat"],
      transformResponse: (response: SendMessageResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetChatListQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = forumApi;

