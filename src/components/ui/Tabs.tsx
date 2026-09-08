import { memo } from 'react'
import type { TabDefinition } from '../../types'

type TabsVariant = 'default' | 'compact' | 'sidebar'

type TabsProps<T extends string> = {
  activeTab: T
  className?: string
  onChange: (tabId: T) => void
  tabs: Array<TabDefinition<T>>
  variant?: TabsVariant
}

function TabsComponent<T extends string>({
  activeTab,
  className = '',
  onChange,
  tabs,
  variant = 'default',
}: TabsProps<T>) {
  return (
    <nav className={`ui-tabs ui-tabs--${variant} ${className}`.trim()} aria-label="Navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`ui-tab ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {variant !== 'compact' && <small>{tab.eyebrow}</small>}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export const Tabs = memo(TabsComponent) as typeof TabsComponent
