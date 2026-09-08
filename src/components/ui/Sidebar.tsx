import type { ReactNode } from 'react'
import type { TabDefinition } from '../../types'
import { Card } from './Card'
import { Tabs } from './Tabs'

type SidebarProps<T extends string> = {
  activeTab: T
  description: string
  footer?: ReactNode
  onChange: (tabId: T) => void
  tabs: Array<TabDefinition<T>>
  title: string
}

export function Sidebar<T extends string>({
  activeTab,
  description,
  footer,
  onChange,
  tabs,
  title,
}: SidebarProps<T>) {
  return (
    <aside className="app-sidebar">
      <Card className="app-brand-card">
        <p className="ui-eyebrow">BSR Resource Planner</p>
        <h1>{title}</h1>
        <p className="app-brand-card__description">{description}</p>
      </Card>

      <Card className="app-sidebar__nav">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={onChange} variant="sidebar" />
      </Card>

      {footer && <Card className="app-sidebar__footer">{footer}</Card>}
    </aside>
  )
}
