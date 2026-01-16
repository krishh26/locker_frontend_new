import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  NotificationListResponse,
  NotificationFilters,
  ReadNotificationRequest,
  ReadNotificationResponse,
  DeleteNotificationRequest,
  DeleteNotificationResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery,
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    // Get notifications list with polling and refetch on focus
    getNotifications: builder.query<NotificationListResponse, NotificationFilters | void>({
      query: (filters) => {
        const filterParams = filters || {};
        const { page = 1, page_size = 10, type = "all", read = "all" } = filterParams;
        let url = `/notification/list?page=${page}&limit=${page_size}&meta=true`;
        
        if (type && type !== "all") {
          url += `&type=${encodeURIComponent(type)}`;
        }
        
        if (read !== "all") {
          url += `&read=${read}`;
        }
        
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ notification_id }) => ({
                type: "Notification" as const,
                id: notification_id,
              })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
      transformResponse: (response: NotificationListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // Mark single notification as read
    readNotification: builder.mutation<ReadNotificationResponse, ReadNotificationRequest>({
      query: ({ notification_id }) => ({
        url: notification_id ? `/notification/read/${notification_id}` : `/notification/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, arg) => {
        if (error) return [];
        // If notification_id provided, invalidate that specific notification
        if (arg.notification_id) {
          return [
            { type: "Notification", id: arg.notification_id },
            { type: "Notification", id: "LIST" },
          ];
        }
        // Otherwise invalidate all notifications
        return [{ type: "Notification", id: "LIST" }];
      },
      transformResponse: (response: ReadNotificationResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // Mark all notifications as read
    readAllNotifications: builder.mutation<ReadNotificationResponse, void>({
      query: () => ({
        url: `/notification/read`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
      transformResponse: (response: ReadNotificationResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // Delete single notification
    deleteNotification: builder.mutation<DeleteNotificationResponse, DeleteNotificationRequest>({
      query: ({ notification_id }) => ({
        url: notification_id ? `/notification/delete/${notification_id}` : `/notification/delete`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => {
        if (error) return [];
        // If notification_id provided, invalidate that specific notification
        if (arg.notification_id) {
          return [
            { type: "Notification", id: arg.notification_id },
            { type: "Notification", id: "LIST" },
          ];
        }
        // Otherwise invalidate all notifications
        return [{ type: "Notification", id: "LIST" }];
      },
      transformResponse: (response: DeleteNotificationResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // Delete all notifications
    deleteAllNotifications: builder.mutation<DeleteNotificationResponse, void>({
      query: () => ({
        url: `/notification/delete`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
      transformResponse: (response: DeleteNotificationResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useReadNotificationMutation,
  useReadAllNotificationsMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} = notificationApi;

