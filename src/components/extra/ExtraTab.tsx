import { memo, useMemo } from 'react'
import { useCharacterState, useSkillState, useWeaponState } from '../../context/AppStateContext'
import { useCharacterCalculator } from '../../hooks/useCharacterCalculator'
import { useSkillCalculator } from '../../hooks/useSkillCalculator'
import { useWeaponCalculator } from '../../hooks/useWeaponCalculator'
import type { ExtraTabId, TabDefinition } from '../../types'
import { TabNavigation } from '../common/TabNavigation'
import { ExtraOutputPanel } from './ExtraOutputPanel'
import { ExtraOverviewContent } from './ExtraOverviewContent'
import { ExtraTotalPlannerContent } from './ExtraTotalPlannerContent'

type ExtraTabProps = {
  activeExtraTab: ExtraTabId
  onExtraTabChange: (tabId: ExtraTabId) => void
  extraTabs: Array<TabDefinition<ExtraTabId>>
}

export function ExtraTab(props: ExtraTabProps) {
  const { characterState } = useCharacterState()
  const { weaponState } = useWeaponState()
  const { skillState } = useSkillState()
  const character = useCharacterCalculator(characterState)
  const weapon = useWeaponCalculator(weaponState)
  const skill = useSkillCalculator(skillState)
  const totals = useMemo(
    () => ({
      totalKansCombined:
        character.levelKans + character.ascensionKans + weapon.ascension + skill.totals.kans + skill.passiveTotalKans,
      totalExpMissing: character.missingExp + weapon.missingExp,
    }),
    [
      character.ascensionKans,
      character.levelKans,
      character.missingExp,
      skill.passiveTotalKans,
      skill.totals.kans,
      weapon.ascension,
      weapon.missingExp,
    ],
  )

  const activeContent = useMemo(() => {
    if (props.activeExtraTab === 'total-planner') {
      return <ExtraTotalPlannerContent />
    }

    return <ExtraOverviewContent character={character} weapon={weapon} skill={skill} />
  }, [character, props.activeExtraTab, skill, weapon])

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Extra</p>
            <h2>Extra tools</h2>
          </div>
        </div>

        <TabNavigation tabs={props.extraTabs} activeTab={props.activeExtraTab} onChange={props.onExtraTabChange} className="mini-tab-bar" />

        {activeContent}
      </section>

      <ExtraOutputPanel
        activeExtraTab={props.activeExtraTab}
        character={character}
        weapon={weapon}
        skill={skill}
        totals={totals}
      />
    </>
  )
}

export default memo(ExtraTab)
