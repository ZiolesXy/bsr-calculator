import { useLayoutEffect, useMemo, useState } from 'react'
import themes from '../data/themes.json'
import type { ThemeDefinition } from '../types'
import {
  contrastRatio,
  isDarkColor,
  mixColors,
  pickOnColor,
  readableBrand,
} from '../utils/color'

const themeCatalog = themes as ThemeDefinition[]
const defaultThemeId = themeCatalog.find((theme) => theme.id === 'rukia')?.id ?? themeCatalog[0]?.id ?? 'light'
const STORAGE_KEY = 'bsr-theme'

export function useTheme() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem(STORAGE_KEY) || defaultThemeId)

  const activeTheme = useMemo(
    () => themeCatalog.find((theme) => theme.id === themeId) ?? themeCatalog[0],
    [themeId],
  )

  const isDark = useMemo(
    () => isDarkColor(activeTheme.colors['--app-bg'] ?? '#f4f8fb'),
    [activeTheme],
  )

  useLayoutEffect(() => {
    const root = document.documentElement
    const colors = activeTheme.colors
    const background = colors['--app-bg'] ?? '#f4f8fb'
    const surface = colors['--surface-primary'] ?? '#ffffff'
    const accent = colors['--surface-accent'] ?? background
    const brand = colors['--brand'] ?? '#b84d23'

    localStorage.setItem(STORAGE_KEY, activeTheme.id)
    Object.entries(colors).forEach(([token, value]) => {
      root.style.setProperty(token, value)
    })

    // Derived tokens: the palette stays exactly as authored in themes.json.
    const ground = isDark
      ? mixColors(background, '#ffffff', 0.05)
      : mixColors(background, accent, 0.38)

    root.dataset.themeMode = isDark ? 'dark' : 'light'
    root.style.colorScheme = isDark ? 'dark' : 'light'
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', background)
    root.style.setProperty('--app-bg-2', ground)
    root.style.setProperty('--brand-ink', readableBrand(brand, surface, 4.5))
    root.style.setProperty('--on-brand', pickOnColor(brand))
    root.style.setProperty('--brand-line', mixColors(brand, surface, 0.45))
    root.style.setProperty(
      '--surface-raised',
      isDark ? mixColors(surface, '#ffffff', 0.06) : mixColors(surface, background, 0.6),
    )
    root.style.setProperty(
      '--shadow-float',
      `0 24px 60px ${isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(18, 24, 32, 0.12)'}`,
    )
    root.style.setProperty('--brand-contrast', contrastRatio(brand, surface).toFixed(2))
  }, [activeTheme, isDark])

  return { themeCatalog, activeTheme, themeId, isDark, setThemeId }
}
