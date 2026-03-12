import * as React from "react"

export const FONT_SCALE_STORAGE_KEY = "locker-font-scale"
export const DEFAULT_FONT_SCALE = 1
export const MIN_FONT_SCALE = 0.7
export const MAX_FONT_SCALE = 1.3

export function clampFontScale(scale: number) {
  if (!Number.isFinite(scale)) return DEFAULT_FONT_SCALE
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, scale))
}

export function getStoredFontScale() {
  if (typeof window === "undefined") return DEFAULT_FONT_SCALE
  try {
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY)
    if (raw == null) return DEFAULT_FONT_SCALE
    return clampFontScale(Number(raw))
  } catch {
    return DEFAULT_FONT_SCALE
  }
}

export function setStoredFontScale(scale: number) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clampFontScale(scale)))
  } catch {
    // ignore
  }
}

export function applyFontScale(scale: number) {
  if (typeof document === "undefined") return
  const clamped = clampFontScale(scale)
  document.documentElement.style.fontSize = `${clamped * 100}%`
}

export function resetFontScale() {
  setStoredFontScale(DEFAULT_FONT_SCALE)
  applyFontScale(DEFAULT_FONT_SCALE)
}

export function useFontScale() {
  const [scale, setScaleState] = React.useState<number>(() => getStoredFontScale())

  // Keep UI in sync if another tab changes the value
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FONT_SCALE_STORAGE_KEY) return
      setScaleState(getStoredFontScale())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  React.useEffect(() => {
    applyFontScale(scale)
  }, [scale])

  const setScale = React.useCallback((next: number) => {
    setScaleState(clampFontScale(next))
  }, [])

  const commitScale = React.useCallback((next?: number) => {
    const value = clampFontScale(next ?? scale)
    setScaleState(value)
    setStoredFontScale(value)
    applyFontScale(value)
  }, [scale])

  const reset = React.useCallback(() => {
    setScaleState(DEFAULT_FONT_SCALE)
    setStoredFontScale(DEFAULT_FONT_SCALE)
    applyFontScale(DEFAULT_FONT_SCALE)
  }, [])

  return { scale, setScale, commitScale, reset }
}

