import { memo } from 'react'
import type { TabDefinition, TabId } from '../../types'
import { MobileNav } from '../ui/MobileNav'

type MobileMenuProps = {
  tabs: Array<TabDefinition<TabId>>
  onSelect: (tabId: TabId) => void
}

function MobileMenuComponent({ tabs, onSelect }: MobileMenuProps) {
  return (
    <section className="mobile-menu">
      <header className="mobile-menu__hero">
        <p className="ui-eyebrow">Main Menu</p>
        <h2>BSR Calculator</h2>
        <p>This is a material calculator app for character builds in the game Bleach: Soul Resonance.</p>
      </header>
      <MobileNav onChange={onSelect} tabs={tabs} />
    </section>
  )
}

export const MobileMenu = memo(MobileMenuComponent)
