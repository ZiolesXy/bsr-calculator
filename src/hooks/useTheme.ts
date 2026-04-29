import { useEffect, useMemo, useState } from 'react'
import themes from '../data/themes.json'
import type { ThemeDefinition } from '../types'

const themeCatalog = themes as ThemeDefinition[]

export function useTheme() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('bsr-theme') || 'light')

  const activeTheme = useMemo(
    () => themeCatalog.find((theme) => theme.id === themeId) ?? themeCatalog[0],
    [themeId],
  )

  useEffect(() => {
    localStorage.setItem('bsr-theme', activeTheme.id)
    Object.entries(activeTheme.colors).forEach(([token, value]) => {
      document.documentElement.style.setProperty(token, value)
    })
  }, [activeTheme])

  return { themeCatalog, activeTheme, themeId, setThemeId }
}
