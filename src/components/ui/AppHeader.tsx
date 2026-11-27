import { ArrowLeft, Settings2 } from 'lucide-react'
import type { ThemeDefinition } from '../../types'

type AppHeaderProps = {
  backLabel?: string
  context?: string
  onBack?: () => void
  onOpenSettings: () => void
  settingsActive: boolean
  theme: ThemeDefinition
  title: string
}

export function AppHeader({
  backLabel,
  context,
  onBack,
  onOpenSettings,
  settingsActive,
  theme,
  title,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__lead">
        {onBack && (
          <button type="button" className="icon-button" onClick={onBack} aria-label={backLabel ?? 'Go back'}>
            <ArrowLeft aria-hidden="true" />
          </button>
        )}
        <div className="app-header__titles">
          <h1>{title}</h1>
          {context && <span className="app-header__context">{context}</span>}
        </div>
      </div>

      <div className="app-header__actions">
        <button
          type="button"
          className="theme-chip"
          onClick={onOpenSettings}
          aria-label={`Theme: ${theme.label}. Open settings`}
        >
          <span className="theme-chip__dot" style={{ background: theme.colors['--brand'] }} />
          <span className="theme-chip__label">{theme.label}</span>
        </button>

        <button
          type="button"
          className="icon-button app-header__settings"
          onClick={onOpenSettings}
          aria-current={settingsActive ? 'page' : undefined}
          aria-label="Settings"
        >
          <Settings2 aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
