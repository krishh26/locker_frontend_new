"use client"

import * as React from "react"
import { tweakcnPresets } from "@/utils/tweakcn-theme-presets"
import { useTheme } from "@/hooks/use-theme"

const THEME_PRESET_STORAGE_KEY = "nextjs-ui-theme-preset"
const DEFAULT_THEME = "theme-Locker-Pro"

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
  }, [theme])

  return null
}
