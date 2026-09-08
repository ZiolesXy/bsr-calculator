import type { TabDefinition } from '../../types'

type MobileNavProps<T extends string> = {
  activeTab?: T
  onChange: (tabId: T) => void
  tabs: Array<TabDefinition<T>>
}

export function MobileNav<T extends string>({ activeTab, onChange, tabs }: MobileNavProps<T>) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`mobile-nav__card ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <div className="mobile-nav__content">
            <small>{tab.eyebrow}</small>
            <strong>{tab.label}</strong>
          </div>
          <span className="mobile-nav__chevron" aria-hidden="true">
            &gt;
          </span>
        </button>
      ))}
    </nav>
  )
}
