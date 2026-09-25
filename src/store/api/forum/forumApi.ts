import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  ForumChatListResponse,
  ForumMessage,
  ForumMessagesResponse,
  SendMessageResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

/** Always string so cache keys match across list items + thread + mutations. */
function normalizeCourseId(courseId: string | number): string {
  return String(courseId);
}

export function normalizeForumMessage(
  raw: unknown,
  fallback?: Partial<ForumMessage>
): ForumMessage | null {
  if (!raw || typeof raw !== "object") {
    if (!fallback?.id) return null;
    return {
      id: String(fallback.id),
      course_id: String(fallback.course_id || ""),
      sender_id: String(fallback.sender_id || ""),
      message: fallback.message,
      file: fallback.file,
      created_at: fallback.created_at || new Date().toISOString(),
      sender: fallback.sender || {
        user_id: String(fallback.sender_id || ""),
        user_name: "You",
      },
      delivery_status: fallback.delivery_status ?? "sent",
    };
  }

  const data = raw as Record<string, unknown>;
  const course =
    data.course && typeof data.course === "object"
      ? (data.course as Record<string, unknown>)
      : null;
  const sender =
    data.sender && typeof data.sender === "object"
      ? (data.sender as ForumMessage["sender"])
      : fallback?.sender;

  const id = data.id ?? fallback?.id;
  if (id == null) return null;

  return {
    id: String(id),
    course_id: String(
      data.course_id ?? course?.course_id ?? fallback?.course_id ?? ""
    ),
    sender_id: String(
      data.sender_id ?? sender?.user_id ?? fallback?.sender_id ?? ""
    ),
    message:
      typeof data.message === "string"
        ? data.message
        : fallback?.message,
    file:
      data.file && typeof data.file === "object"
        ? (data.file as ForumMessage["file"])
        : fallback?.file,
    created_at:
      typeof data.created_at === "string"
        ? data.created_at
        : fallback?.created_at || new Date().toISOString(),
    sender: sender || {
      user_id: String(fallback?.sender_id || ""),
      user_name: "You",
    },
    delivery_status: fallback?.delivery_status ?? "sent",
  };
}

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
        `/forum/messages/${normalizeCourseId(course_id)}?meta=true&page=1&limit=500`,
      // Force stable cache key regardless of number vs string course_id
      serializeQueryArgs: ({ queryArgs }) =>
        `getMessages-${normalizeCourseId(queryArgs.course_id)}`,
      providesTags: (_result, _error, arg) => [
        { type: "ForumMessage", id: normalizeCourseId(arg.course_id) },
      ],
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
      // Chat list preview only — message thread owns optimistic UI.
      invalidatesTags: ["ForumChat"],
      transformResponse: (response: SendMessageResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
      async onQueryStarted(formData, { dispatch, queryFulfilled }) {
        const courseId = normalizeCourseId(
          String(formData.get("course_id") || "")
        );
        if (!courseId) return;

        try {
          const { data } = await queryFulfilled;
          const normalized = normalizeForumMessage(data.data, {
            delivery_status: "sent",
            course_id: courseId,
          });
          if (!normalized) return;

          dispatch(
            forumApi.util.updateQueryData(
              "getMessages",
              { page: 1, page_size: 25, course_id: courseId },
              (draft) => {
                if (!draft.data) draft.data = [];
                const index = draft.data.findIndex(
                  (m) => String(m.id) === String(normalized.id)
                );
                if (index >= 0) {
                  draft.data[index] = {
                    ...normalized,
                    delivery_status: "sent",
                  };
                } else {
                  draft.data.push({
                    ...normalized,
                    delivery_status: "sent",
                  });
                }
              }
            )
          );
        } catch {
          // Failure UI is handled by the thread optimistic state.
        }
      },
    }),
  }),
});

export const {
  useGetChatListQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = forumApi;
