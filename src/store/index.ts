import { configureStore } from "@reduxjs/toolkit"
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"
import storage from "redux-persist/lib/storage"

import { concatMiddleware, rootReducer } from "@/store/root-reducer"

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "cache", "course"], // Persist auth and cache slices
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
        thunk: true,
        immutableCheck: false,
      }).concat(concatMiddleware),
  })

  return store
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore["dispatch"]
export type RootState = ReturnType<AppStore["getState"]>
