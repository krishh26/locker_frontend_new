import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from '@/store/api/baseQuery'
import { DEFAULT_ERROR_MESSAGE } from '../auth/api'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export type SessionReminderRecipient = 'Learner' | 'Trainer'

export type SessionReminderSetting = {
  id: number
  organisation_id?: number | null
  days_before: number
  label?: string | null
  is_active: boolean
  recipient: SessionReminderRecipient
}

type ApiEnvelope<T> = {
  status?: boolean
  data?: T
  message?: string
  error?: string
}

type ApiMaybeEnvelope<T> = ApiEnvelope<T> | T

function unwrapEnvelope<T>(input: ApiMaybeEnvelope<T>): {
  data: T
  errorMessage?: string
} {
  if (
    input &&
    typeof input === 'object' &&
    !Array.isArray(input) &&
    'status' in input
  ) {
    const env = input as ApiEnvelope<T>
    if (env.status === false) {
      return {
        data: env.data as T,
        errorMessage: env.error ?? env.message ?? DEFAULT_ERROR_MESSAGE,
      }
    }
    return { data: (env.data as T) ?? (undefined as unknown as T) }
  }
  return { data: input as T }
}

export type ListSessionReminderSettingsArg = {
  organisation_id?: number
}

export type CreateSessionReminderSettingRequest = {
  organisation_id?: number
  days_before: number
  label?: string
  is_active?: boolean
  recipient?: SessionReminderRecipient
}

export type UpdateSessionReminderSettingRequest = {
  id: number
  organisation_id?: number
  days_before?: number
  label?: string
  is_active?: boolean
  recipient?: SessionReminderRecipient
}

export const sessionReminderSettingsApi = createApi({
  reducerPath: 'sessionReminderSettingsApi',
  baseQuery,
  tagTypes: ['SessionReminderSettings'],
  endpoints: (builder) => ({
    listSessionReminderSettings: builder.query<
      ApiEnvelope<SessionReminderSetting[]>,
      ListSessionReminderSettingsArg | void
    >({
      query: (arg) => ({
        url: '/session/settings/reminders',
        method: 'GET',
        params:
          arg && arg.organisation_id != null
            ? { organisation_id: arg.organisation_id }
            : undefined,
      }),
      providesTags: ['SessionReminderSettings'],
      transformResponse: (
        response: ApiMaybeEnvelope<SessionReminderSetting[]>,
      ) => {
        const unwrapped = unwrapEnvelope(response)
        if (unwrapped.errorMessage) throw new Error(unwrapped.errorMessage)
        return { status: true, data: unwrapped.data }
      },
    }),

    createSessionReminderSetting: builder.mutation<
      ApiEnvelope<SessionReminderSetting>,
      CreateSessionReminderSettingRequest
    >({
      query: (body) => ({
        url: '/session/settings/reminders',
        method: 'POST',
        body: {
          ...body,
          recipient: body.recipient ?? 'Learner',
        },
      }),
      invalidatesTags: ['SessionReminderSettings'],
      transformResponse: (
        response: ApiMaybeEnvelope<SessionReminderSetting>,
      ) => {
        const unwrapped = unwrapEnvelope(response)
        if (unwrapped.errorMessage) throw new Error(unwrapped.errorMessage)
        return { status: true, data: unwrapped.data }
      },
    }),

    updateSessionReminderSetting: builder.mutation<
      ApiEnvelope<SessionReminderSetting>,
      UpdateSessionReminderSettingRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/session/settings/reminders/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['SessionReminderSettings'],
      transformResponse: (
        response: ApiMaybeEnvelope<SessionReminderSetting>,
      ) => {
        const unwrapped = unwrapEnvelope(response)
        if (unwrapped.errorMessage) throw new Error(unwrapped.errorMessage)
        return { status: true, data: unwrapped.data }
      },
    }),

    deleteSessionReminderSetting: builder.mutation<
      ApiEnvelope<unknown>,
      { id: number }
    >({
      query: ({ id }) => ({
        url: `/session/settings/reminders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SessionReminderSettings'],
      transformResponse: (response: ApiMaybeEnvelope<unknown>) => {
        const unwrapped = unwrapEnvelope(response)
        if (unwrapped.errorMessage) throw new Error(unwrapped.errorMessage)
        return { status: true, data: unwrapped.data }
      },
    }),

    setActiveSessionReminderDays: builder.mutation<
      { activeDays: number },
      {
        days_before: number
        organisation_id?: number
        recipient?: SessionReminderRecipient
      }
    >({
      async queryFn(arg, api, extraOptions, baseQueryImpl) {
        const runBaseQuery = (args: Parameters<typeof baseQuery>[0]) =>
          baseQueryImpl(args)

        const organisation_id = arg.organisation_id
        const recipient = arg.recipient ?? 'Learner'

        const listParams =
          organisation_id != null ? { organisation_id } : undefined

        type FetchListResult =
          | {
              ok: true
              settings: SessionReminderSetting[]
            }
          | {
              ok: false
              error: FetchBaseQueryError
            }

        const fetchList = async (): Promise<FetchListResult> => {
          const res = await runBaseQuery({
            url: '/session/settings/reminders',
            method: 'GET',
            params: listParams,
          })

          if (res.error) return { ok: false, error: res.error }

          const unwrapped = unwrapEnvelope(
            res.data as ApiMaybeEnvelope<SessionReminderSetting[]>,
          )

          if (unwrapped.errorMessage) {
            return {
              ok: false,
              error: {
                status: 'CUSTOM_ERROR' as const,
                data: unwrapped.errorMessage,
                error: unwrapped.errorMessage,
              },
            }
          }

          return {
            ok: true,
            settings: (unwrapped.data ?? []) as SessionReminderSetting[],
          }
        }

        const list1 = await fetchList()
        if (!list1.ok) return { error: list1.error }

        const current = list1.settings.filter((s) => s.recipient === recipient)
        const desiredDays = arg.days_before

        let desired = current.find(
          (s) => Number(s.days_before) === Number(desiredDays),
        )

        if (!desired) {
          const createRes = await runBaseQuery({
            url: '/session/settings/reminders',
            method: 'POST',
            body: {
              ...(organisation_id != null ? { organisation_id } : {}),
              days_before: desiredDays,
              label:
                desiredDays === 1
                  ? '1 day before'
                  : `${desiredDays} days before`,
              is_active: true,
              recipient,
            },
          })

          if (createRes.error) return { error: createRes.error }

          const created = unwrapEnvelope(
            createRes.data as ApiMaybeEnvelope<SessionReminderSetting>,
          )

          if (created.errorMessage) {
            return {
              error: {
                status: 'CUSTOM_ERROR' as const,
                data: created.errorMessage,
                error: created.errorMessage,
              },
            }
          }
        }

        const list2 = await fetchList()
        if (!list2.ok) return { error: list2.error }

        const allSettings = list2.settings.filter(
          (s) => s.recipient === recipient,
        )

        desired = allSettings.find(
          (s) => Number(s.days_before) === Number(desiredDays),
        )
        const desiredId = desired?.id

        if (!desiredId) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              data: DEFAULT_ERROR_MESSAGE,
              error: DEFAULT_ERROR_MESSAGE,
            },
          }
        }

        for (const s of allSettings) {
          const shouldBeActive = s.id === desiredId
          if (!!s.is_active !== shouldBeActive) {
            const patchRes = await runBaseQuery({
              url: `/session/settings/reminders/${s.id}`,
              method: 'PATCH',
              body: { is_active: shouldBeActive },
            })

            if (patchRes.error) return { error: patchRes.error }
          }
        }

        return { data: { activeDays: desiredDays } }
      },
      invalidatesTags: ['SessionReminderSettings'],
    }),
  }),
})

export const {
  useListSessionReminderSettingsQuery,
  useCreateSessionReminderSettingMutation,
  useUpdateSessionReminderSettingMutation,
  useDeleteSessionReminderSettingMutation,
  useSetActiveSessionReminderDaysMutation,
} = sessionReminderSettingsApi
