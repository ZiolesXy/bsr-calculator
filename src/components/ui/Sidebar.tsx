import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { TabDefinition, TabId, ThemeDefinition } from '../../types'
import { BrandMark } from './BrandMark'
import { navIcons } from './navIcons'

type SidebarProps = {
  activeTab: TabId
  onChange: (tabId: TabId) => void
  onOpenTheme: () => void
  onToggle: () => void
  open: boolean
  tabs: Array<TabDefinition<TabId>>
  theme: ThemeDefinition
}

export function Sidebar({
  activeTab,
  onChange,
  onOpenTheme,
  onToggle,
  open,
  tabs,
  theme,
}: SidebarProps) {
  const primaryTabs = tabs.filter((tab) => tab.id !== 'settings')
  const settingsTab = tabs.find((tab) => tab.id === 'settings')
  const SettingsIcon = navIcons.settings

  return (
    <aside className="app-rail" aria-label="Workspace">
      <div className="rail__head">
        <span className="rail__logo">
          <BrandMark />
        </span>
        <div className="rail__brand">
          <strong>BSR</strong>
          <span>Resource Planner</span>
        </div>
      </div>

      <nav className="rail__nav" aria-label="Main navigation">
        <span className="rail__group">Calculators</span>
        {primaryTabs.map((tab) => {
          const Icon = navIcons[tab.id]
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              type="button"
              className="rail__item"
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              title={open ? undefined : tab.label}
              onClick={() => onChange(tab.id)}
            >
              <Icon aria-hidden="true" />
              <span className="rail__label">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="rail__foot">
        {settingsTab && (
          <button
            type="button"
            className="rail__item"
            aria-current={activeTab === settingsTab.id ? 'page' : undefined}
            aria-label={settingsTab.label}
            title={open ? undefined : settingsTab.label}
            onClick={() => onChange(settingsTab.id)}
          >
            <SettingsIcon aria-hidden="true" />
            <span className="rail__label">{settingsTab.label}</span>
          </button>
        )}

        <button
          type="button"
          className="rail__theme"
          onClick={onOpenTheme}
          aria-label={`Theme: ${theme.label}. Open settings`}
          title={open ? undefined : `Theme: ${theme.label}`}
        >
          <span className="rail__theme-dot" style={{ background: theme.colors['--brand'] }} />
          <span className="rail__theme-copy">
            <strong>{theme.label}</strong>
            <span>Theme</span>
          </span>
        </button>

        <button
          type="button"
          className="rail__toggle"
          aria-expanded={open}
          aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
          onClick={onToggle}
        >
          {open ? <PanelLeftClose aria-hidden="true" /> : <PanelLeftOpen aria-hidden="true" />}
          <span>{open ? 'Collapse' : 'Expand'}</span>
        </button>
      </div>
    </aside>
  )
}
