import { memo } from 'react'
import type { TabDefinition } from '../../types'

type TabNavigationProps<T extends string> = {
  tabs: Array<TabDefinition<T>>
  activeTab: T
  onChange: (tabId: T) => void
  className?: string
}

function TabNavigationComponent<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = 'tab-bar',
}: TabNavigationProps<T>) {
  return (
    <nav className={className} aria-label="Navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${className === 'tab-bar' ? 'tab-chip' : 'mini-tab'} ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {className === 'tab-bar' && <small>{tab.eyebrow}</small>}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export const TabNavigation = memo(TabNavigationComponent) as typeof TabNavigationComponent
