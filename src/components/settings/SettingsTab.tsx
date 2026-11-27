import type { ThemeDefinition } from '../../types'

type SettingsTabProps = {
  themes: ThemeDefinition[]
  activeTheme: ThemeDefinition
  onThemeChange: (themeId: string) => void
}

export function SettingsTab({ themes, activeTheme, onThemeChange }: SettingsTabProps) {
  return (
    <section className="panel settings-panel">
      <div className="panel__header">
        <div>
          <p className="section-tag">Settings</p>
          <h2>Themes</h2>
          <p className="ui-section__description">
            Pick a character palette. Layout, contrast, and surfaces adapt automatically.
          </p>
        </div>

        <div className="settings-active">
          <span
            className="settings-active__dot"
            style={{ background: activeTheme.colors['--brand'] }}
          />
          <div>
            <span>Active theme</span>
            <strong>{activeTheme.label}</strong>
          </div>
        </div>
      </div>

      <div className="theme-grid">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-card ${theme.id === activeTheme.id ? 'is-active' : ''}`}
            aria-pressed={theme.id === activeTheme.id}
            onClick={() => onThemeChange(theme.id)}
          >
            <div className="theme-card__swatches">
              <span style={{ background: theme.colors['--surface-primary'] }} />
              <span style={{ background: theme.colors['--brand'] }} />
              <span style={{ background: theme.colors['--surface-accent'] }} />
            </div>
            <strong>{theme.label}</strong>
            <p>{theme.description}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
