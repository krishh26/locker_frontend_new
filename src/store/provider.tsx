"use client"

import { useEffect, useRef, useState } from "react"
import Cookies from "js-cookie"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { persistStore } from "redux-persist"

import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY, buildUser } from "@/store/api/auth/api"
import { setAuthError, setCredentials } from "@/store/slices/authSlice"
import type { LoginResult } from "@/store/api/auth/types"

import { makeStore } from "./index"
import type { AppStore } from "./index"

type ReduxProviderProps = {
  children: React.ReactNode
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  const storeRef = useRef<AppStore | null>(null)
  const persistorRef = useRef<ReturnType<typeof persistStore> | null>(null)
  const [isRehydrated, setIsRehydrated] = useState(false)

  if (!storeRef.current) {
    storeRef.current = makeStore()
    persistorRef.current = persistStore(storeRef.current)
  }

  // Restore from cookies after redux-persist rehydration completes
  // This ensures cookies take precedence over localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !isRehydrated || !storeRef.current) {
      return
    }

    try {
      const storedToken = Cookies.get(TOKEN_COOKIE_KEY)
      const storedUserRaw = Cookies.get(USER_COOKIE_KEY)

      if (storedToken && storedUserRaw) {
        // Parse the raw cookie data
        const parsedCookie = JSON.parse(storedUserRaw) as Record<string, unknown>
        
        // Use buildUser to properly transform cookie fields (user_id -> id, first_name -> firstName, etc.)
        const transformedUser = buildUser(parsedCookie)
        
        // Ensure id is a string (user_id from cookie might be a number)
        if (transformedUser.id !== undefined) {
          transformedUser.id = String(transformedUser.id)
        }
        
        // Check if we need to update (cookies might be more recent than localStorage)
        const currentState = storeRef.current.getState()
        const currentToken = currentState.auth.token
        const currentUser = currentState.auth.user

        // Only update if cookies differ or if store is empty
        // Convert IDs to strings for comparison to handle number/string differences
        const currentUserId = currentUser?.id?.toString()
        const transformedUserId = transformedUser.id?.toString()
        
        if (
          !currentToken ||
          !currentUser ||
          currentToken !== storedToken ||
          currentUserId !== transformedUserId
        ) {
          const result: LoginResult = {
            token: storedToken,
            user: transformedUser,
            passwordChanged: parsedCookie.password_changed as boolean ?? true,
            raw: { token: storedToken, user: parsedCookie },
          }
          storeRef.current.dispatch(setCredentials(result))
        }
      }
    } catch (error) {
      console.error("Failed to restore session from cookies:", error)
      if (storeRef.current) {
        storeRef.current.dispatch(
          setAuthError("Failed to restore your previous session."),
        )
      }
    }
  }, [isRehydrated])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const store = storeRef.current
    if (!store) {
      return
    }

    const unsubscribe = store.subscribe(() => {
      const state = store.getState()
      const { token, user } = state.auth

      try {
        if (token) {
          Cookies.set(TOKEN_COOKIE_KEY, token, {
            expires: 7,
            sameSite: "lax",
          })
        } else {
          Cookies.remove(TOKEN_COOKIE_KEY)
        }

        if (user) {
          Cookies.set(USER_COOKIE_KEY, JSON.stringify(user), {
            expires: 7,
            sameSite: "lax",
          })
        } else {
          Cookies.remove(USER_COOKIE_KEY)
        }
      } catch {
        // Ignore cookie write errors
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  if (!storeRef.current || !persistorRef.current) {
    return null
  }

  return (
    <Provider store={storeRef.current}>
      <PersistGate
        loading={null}
        persistor={persistorRef.current!}
        onBeforeLift={() => {
          // Mark as rehydrated so we can restore from cookies
          setIsRehydrated(true)
        }}
      >
        {children}
      </PersistGate>
    </Provider>
  )
}

