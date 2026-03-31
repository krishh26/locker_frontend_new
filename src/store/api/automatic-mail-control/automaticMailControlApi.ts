import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AutomaticMailControlConfigResponse,
  SaveAutomaticMailControlConfigRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const automaticMailControlApi = createApi({
  reducerPath: "automaticMailControlApi",
  baseQuery,
  tagTypes: ["AutomaticMailControl"],
  endpoints: (builder) => ({
    getAutomaticMailControlConfig: builder.query<
      AutomaticMailControlConfigResponse,
      void
    >({
      query: () => "/automatic-mail-control/get",
      providesTags: ["AutomaticMailControl"],
      transformResponse: (response: AutomaticMailControlConfigResponse) => {
        if (response.status === false) {
          throw new Error(
            response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE
          );
        }
        return response;
      },
    }),
    saveAutomaticMailControlConfig: builder.mutation<
      AutomaticMailControlConfigResponse,
      SaveAutomaticMailControlConfigRequest
    >({
      query: (body) => ({
        url: "/automatic-mail-control/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AutomaticMailControl"],
      transformResponse: (response: AutomaticMailControlConfigResponse) => {
        if (response.status === false) {
          throw new Error(
            response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE
          );
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetAutomaticMailControlConfigQuery,
  useSaveAutomaticMailControlConfigMutation,
} = automaticMailControlApi;

