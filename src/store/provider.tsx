"use client"

import { useEffect, useRef } from "react"
import Cookies from "js-cookie"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { persistStore } from "redux-persist"

import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/store/api/auth/api"
import { setAuthError, setCredentials } from "@/store/slices/authSlice"
import type { AuthUser, LoginResult } from "@/store/api/auth/types"

import { makeStore } from "./index"
import type { AppStore } from "./index"

type ReduxProviderProps = {
  children: React.ReactNode
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  const storeRef = useRef<AppStore | null>(null)
  const persistorRef = useRef<ReturnType<typeof persistStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = makeStore()
    persistorRef.current = persistStore(storeRef.current)

    if (typeof window !== "undefined") {
      try {
        const storedToken = Cookies.get(TOKEN_COOKIE_KEY)
        const storedUserRaw = Cookies.get(USER_COOKIE_KEY)

        if (storedToken && storedUserRaw) {
          const storedUser = JSON.parse(storedUserRaw) as AuthUser
          const result: LoginResult = {
            token: storedToken,
            user: storedUser,
            passwordChanged: true,
            raw: { token: storedToken, user: storedUser },
          }
          storeRef.current.dispatch(setCredentials(result))
        }
      } catch {
        storeRef.current.dispatch(
          setAuthError("Failed to restore your previous session."),
        )
      }
    }
  }

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
      <PersistGate loading={null} persistor={persistorRef.current}>
        {children}
      </PersistGate>
    </Provider>
  )
}

