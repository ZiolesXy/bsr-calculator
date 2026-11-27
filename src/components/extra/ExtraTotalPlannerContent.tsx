import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { CharacterTab } from '../character/CharacterTab'
import { SkillTab } from '../skill/SkillTab'
import { StampTab } from '../stamp/StampTab'
import { WeaponTab } from '../weapon/WeaponTab'

type LoadoutBlock = {
  id: string
  title: string
  hint: string
  content: ReactNode
}

const blocks: LoadoutBlock[] = [
  {
    id: 'character',
    title: 'Character',
    hint: 'Level, books, essence',
    content: <CharacterTab showOutput={false} />,
  },
  {
    id: 'weapon',
    title: 'Weapon',
    hint: 'Tamahagane, hammers, gold',
    content: <WeaponTab showOutput={false} />,
  },
  {
    id: 'skill',
    title: 'Skill',
    hint: 'Arts, omamori, passive boosts',
    content: <SkillTab showOutput={false} />,
  },
  {
    id: 'stamp-core',
    title: 'Core Stamp',
    hint: 'Cards, ectoplasm, kans',
    content: <StampTab kind="core" showOutput={false} />,
  },
  {
    id: 'stamp-set',
    title: 'Set Stamp',
    hint: 'Core costs plus nexus stamp',
    content: <StampTab kind="set" showOutput={false} />,
  },
]

export function ExtraTotalPlannerContent() {
  const [openId, setOpenId] = useState('character')

  return (
    <div className="loadout-list">
      {blocks.map((block) => {
        const open = openId === block.id

        return (
          <section key={block.id} className="loadout-block" data-open={open}>
            <button
              type="button"
              className="loadout-block__head"
              aria-expanded={open}
              onClick={() => setOpenId(open ? '' : block.id)}
            >
              <div>
                <strong>{block.title}</strong>
                <span>{block.hint}</span>
              </div>
              <ChevronDown aria-hidden="true" />
            </button>

            {open && <div className="loadout-block__body">{block.content}</div>}
          </section>
        )
      })}
    </div>
  )
}
