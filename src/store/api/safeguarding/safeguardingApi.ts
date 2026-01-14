import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  SafeguardingContactListResponse,
  SafeguardingContactResponse,
  CreateSafeguardingContactPayload,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const safeguardingApi = createApi({
  reducerPath: "safeguardingApi",
  baseQuery,
  tagTypes: ["SafeguardingContact"],
  endpoints: (builder) => ({
    getSafeguardingContacts: builder.query<SafeguardingContactListResponse, void>({
      query: () => "/safeguarding-contact/admin/contacts",
      providesTags: ["SafeguardingContact"],
      transformResponse: (response: SafeguardingContactListResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getSafeguardingContactById: builder.query<SafeguardingContactResponse, string>({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return `/safeguarding-contact/admin/contacts/${encodedId}`;
      },
      providesTags: (result, error, id) => [{ type: "SafeguardingContact", id }],
      transformResponse: (response: SafeguardingContactResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    saveSafeguardingContact: builder.mutation<
      SafeguardingContactResponse,
      CreateSafeguardingContactPayload
    >({
      query: (payload) => ({
        url: "/safeguarding-contact/admin/contacts",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["SafeguardingContact"],
      transformResponse: (response: SafeguardingContactResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetSafeguardingContactsQuery,
  useGetSafeguardingContactByIdQuery,
  useSaveSafeguardingContactMutation,
} = safeguardingApi;
