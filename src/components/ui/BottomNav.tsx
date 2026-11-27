import type { TabDefinition, TabId } from '../../types'
import { navIcons } from './navIcons'

type BottomNavProps = {
  activeTab: TabId
  onChange: (tabId: TabId) => void
  tabs: Array<TabDefinition<TabId>>
}

export function BottomNav({ activeTab, onChange, tabs }: BottomNavProps) {
  const primaryTabs = tabs.filter((tab) => tab.id !== 'settings')

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {primaryTabs.map((tab) => {
        const Icon = navIcons[tab.id]

        return (
          <button
            key={tab.id}
            type="button"
            className="bottom-nav__item"
            aria-current={tab.id === activeTab ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
          >
            <Icon aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
