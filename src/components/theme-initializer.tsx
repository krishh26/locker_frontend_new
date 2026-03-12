"use client"

import * as React from "react"
import { tweakcnPresets } from "@/utils/tweakcn-theme-presets"
import { useTheme } from "@/hooks/use-theme"

const THEME_PRESET_STORAGE_KEY = "nextjs-ui-theme-preset"
const DEFAULT_THEME = "theme-Locker-Pro"
const FONT_SCALE_STORAGE_KEY = "locker-font-scale"
const DEFAULT_FONT_SCALE = 1

function getStoredPreset() {
  if (typeof window === "undefined") return null
  try {
    const s = localStorage.getItem(THEME_PRESET_STORAGE_KEY)
    if (!s) return null
    return JSON.parse(s) as { selectedTheme?: string; selectedTweakcnTheme?: string; selectedRadius?: string }
  } catch {
    return null
  }
}

function storePreset(selectedTheme: string, selectedTweakcnTheme: string, selectedRadius: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      THEME_PRESET_STORAGE_KEY,
      JSON.stringify({ selectedTheme, selectedTweakcnTheme, selectedRadius })
    )
  } catch {
    // ignore
  }
}

function getStoredFontScale() {
  if (typeof window === "undefined") return DEFAULT_FONT_SCALE
  try {
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY)
    const n = raw == null ? DEFAULT_FONT_SCALE : Number(raw)
    if (!Number.isFinite(n)) return DEFAULT_FONT_SCALE
    // Clamp to supported range (same as old project slider)
    return Math.min(1.3, Math.max(0.7, n))
  } catch {
    return DEFAULT_FONT_SCALE
  }
}

export function ThemeInitializer() {
  const { theme } = useTheme()
  const initialized = React.useRef(false)

  React.useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const stored = getStoredPreset()
    const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    
    // Determine which theme to apply
    let themeToApply: string | null = null
    
    if (stored?.selectedTweakcnTheme) {
      themeToApply = stored.selectedTweakcnTheme
    } else if (!stored?.selectedTheme) {
      // No theme stored, apply default theme-Locker
      themeToApply = DEFAULT_THEME
      storePreset("", DEFAULT_THEME, stored?.selectedRadius || "0.5rem")
    }

    // Apply tweakcn theme if needed
    if (themeToApply) {
      const preset = tweakcnPresets[themeToApply]
      if (preset) {
        const styles = isDarkMode ? preset.styles.dark : preset.styles.light
        const root = document.documentElement
        Object.entries(styles).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value)
        })
      }
    }

    // Apply stored radius if available
    if (stored?.selectedRadius) {
      document.documentElement.style.setProperty("--radius", stored.selectedRadius)
    }

    // Apply stored font scale (root html font-size)
    const scale = getStoredFontScale()
    document.documentElement.style.fontSize = `${scale * 100}%`
  }, [theme])

  return null
}
