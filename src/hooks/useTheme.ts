import { useEffect, useMemo, useState } from 'react'
import themes from '../data/themes.json'
import type { ThemeDefinition } from '../types'

const themeCatalog = themes as ThemeDefinition[]
const defaultThemeId = themeCatalog.find((theme) => theme.id === 'rukia')?.id ?? themeCatalog[0]?.id ?? 'light'

export function useTheme() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('bsr-theme') || defaultThemeId)

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
