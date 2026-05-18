import { useState, useEffect } from 'react'

const THEMES = {
  "rosepine-dawn": {
    id: "rosepine-dawn",
    label: "Rosé Pine Dawn",
    emoji: "🌸",
    preview: ["#d7827a", "#907aa9", "#56949f"]
  },
  "catppuccin-latte": {
    id: "catppuccin-latte",
    label: "Catppuccin Latte",
    emoji: "☕",
    preview: ["#fe640b", "#8839ef", "#1e66f5"]
  },
  "neutral-soft": {
    id: "neutral-soft",
    label: "Neutral Soft",
    emoji: "🪨",
    preview: ["#ea580c", "#7c3aed", "#3b82f6"]
  }
}

const DEFAULT_THEME = "rosepine-dawn"
const STORAGE_KEY = "devradar_theme"

export function useTheme() {
  const [theme, setThemeState] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) || DEFAULT_THEME
  )

  // Apply theme attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function setTheme(id) {
    if (!THEMES[id]) return
    localStorage.setItem(STORAGE_KEY, id)
    document.documentElement.setAttribute('data-theme', id)
    setThemeState(id)
  }

  return { theme, setTheme, themes: THEMES }
}

export { THEMES, DEFAULT_THEME }
