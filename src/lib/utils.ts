import { DEFAULT_ERROR_MESSAGE } from "@/store/api/auth/api"
import { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import type { SerializedError } from "@reduxjs/toolkit"
import type { ClassValue } from "clsx"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractBaseQueryErrorMessage(
  error: FetchBaseQueryError,
): string | null {
  if ("data" in error) {
    const { data } = error
    if (typeof data === "string" && data.trim().length > 0) {
      return data
    }
    if (typeof data === "object" && data !== null) {
      const record = data as Record<string, unknown>
      if (typeof record.error === "string") {
        return record.error
      }
      if (typeof record.message === "string") {
        return record.message
      }
    }
  }
  return null
}

export function getErrorMessage(
  error: unknown,
): string | null {
  if (!error) {
    return DEFAULT_ERROR_MESSAGE
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error
  }

  if (typeof error === "object") {
    if (
      "status" in (error as FetchBaseQueryError) &&
      typeof (error as FetchBaseQueryError).status !== "undefined"
    ) {
      const message = extractBaseQueryErrorMessage(
        error as FetchBaseQueryError,
      )
      if (message) {
        return message
      }
    }

    if ("message" in (error as { message?: unknown })) {
      const message = (error as { message?: unknown }).message
      if (typeof message === "string" && message.trim().length > 0) {
        return message
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  if ((error as SerializedError)?.message) {
    const message = (error as SerializedError).message
    if (message) {
      return message
    }
  }

  return DEFAULT_ERROR_MESSAGE
}
