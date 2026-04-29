import type { ThemeDefinition } from '../../types'
import { StatCard } from '../common/StatCard'

type SettingsTabProps = {
  themes: ThemeDefinition[]
  activeTheme: ThemeDefinition
  onThemeChange: (themeId: string) => void
}

export function SettingsTab({ themes, activeTheme, onThemeChange }: SettingsTabProps) {
  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Settings</p>
            <h2>Theme and future options</h2>
          </div>
        </div>
        <div className="mini-tab-bar">
          <button type="button" className="mini-tab is-active">
            Change Theme
          </button>
        </div>
        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`theme-card ${theme.id === activeTheme.id ? 'is-active' : ''}`}
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
      <section className="panel stats-panel">
        <p className="section-tag">Current theme</p>
        <StatCard label="Active theme" value={activeTheme.label} />
        <StatCard label="Description" value={activeTheme.description} />
      </section>
    </>
  )
}
