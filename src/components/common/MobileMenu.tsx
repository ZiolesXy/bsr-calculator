import { memo } from 'react'
import type { TabDefinition, TabId } from '../../types'

type MobileMenuProps = {
  tabs: Array<TabDefinition<TabId>>
  onSelect: (tabId: TabId) => void
}

function MobileMenuComponent({ tabs, onSelect }: MobileMenuProps) {
  return (
    <section className="mobile-menu panel">
      <div className="panel__header">
        <div>
          <p className="section-tag">Main Menu</p>
          <h2>Pilih halaman kalkulator</h2>
        </div>
      </div>
      <div className="mobile-menu__grid">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className="mobile-menu__card" onClick={() => onSelect(tab.id)}>
            <small>{tab.eyebrow}</small>
            <strong>{tab.label}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}

export const MobileMenu = memo(MobileMenuComponent)
