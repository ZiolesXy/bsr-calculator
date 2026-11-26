import { useState } from 'react'
import type { StampKind, TabDefinition } from '../../types'
import { StampTab } from './StampTab'

const stampTabs: Array<TabDefinition<StampKind>> = [
  { id: 'core', label: 'Core Stamp', eyebrow: 'Cards, ectoplasm, and kans' },
  { id: 'set', label: 'Set Stamp', eyebrow: 'Core costs plus nexus stamp' },
]

export function StampPage() {
  const [activeStampTab, setActiveStampTab] = useState<StampKind>('core')

  return (
    <StampTab
      kind={activeStampTab}
      tabs={stampTabs}
      onTabChange={setActiveStampTab}
    />
  )
}
