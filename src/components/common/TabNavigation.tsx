import { memo } from 'react'
import type { TabDefinition } from '../../types'
import { Tabs } from '../ui/Tabs'

type TabNavigationProps<T extends string> = {
  tabs: Array<TabDefinition<T>>
  activeTab: T
  onChange: (tabId: T) => void
  variant?: 'default' | 'compact' | 'sidebar'
  className?: string
}

function TabNavigationComponent<T extends string>({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  className = 'tab-bar',
}: TabNavigationProps<T>) {
  return <Tabs tabs={tabs} activeTab={activeTab} onChange={onChange} variant={variant} className={className} />
}

export const TabNavigation = memo(TabNavigationComponent) as typeof TabNavigationComponent
