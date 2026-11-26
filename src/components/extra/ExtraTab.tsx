import { memo, useMemo } from 'react'
import { useCharacterState, useSkillState, useStampStates, useWeaponState } from '../../context/AppStateContext'
import { useCharacterCalculator } from '../../hooks/useCharacterCalculator'
import { useSkillCalculator } from '../../hooks/useSkillCalculator'
import { useStampCalculator } from '../../hooks/useStampCalculator'
import { useWeaponCalculator } from '../../hooks/useWeaponCalculator'
import type { ExtraTabId, TabDefinition } from '../../types'
import { TabNavigation } from '../common/TabNavigation'
import { DailyScheduleContent } from './DailyScheduleContent'
import { ExtraOutputPanel } from './ExtraOutputPanel'
import { ExtraOverviewContent } from './ExtraOverviewContent'
import { ExtraTotalPlannerContent } from './ExtraTotalPlannerContent'

type ExtraTabProps = {
  activeExtraTab: ExtraTabId
  onExtraTabChange: (tabId: ExtraTabId) => void
  extraTabs: Array<TabDefinition<ExtraTabId>>
  showExtraTabNavigation?: boolean
}

export function ExtraTab(props: ExtraTabProps) {
  const { characterState } = useCharacterState()
  const { weaponState } = useWeaponState()
  const { skillState } = useSkillState()
  const { stampCoreState, stampSetState } = useStampStates()
  const character = useCharacterCalculator(characterState)
  const weapon = useWeaponCalculator(weaponState)
  const skill = useSkillCalculator(skillState)
  const stampCore = useStampCalculator('core', stampCoreState)
  const stampSet = useStampCalculator('set', stampSetState)
  const totals = useMemo(
    () => ({
      totalKansCombined:
        character.levelKans +
        character.ascensionKans +
        weapon.ascension +
        skill.totals.kans +
        skill.passiveTotalKans +
        stampCore.kans +
        stampSet.kans,
      totalExpMissing: character.missingExp + weapon.missingExp + stampCore.missingExp + stampSet.missingExp,
    }),
    [
      character.ascensionKans,
      character.levelKans,
      character.missingExp,
      skill.passiveTotalKans,
      skill.totals.kans,
      stampCore.kans,
      stampCore.missingExp,
      stampSet.kans,
      stampSet.missingExp,
      weapon.ascension,
      weapon.missingExp,
    ],
  )

  const activeContent = useMemo(() => {
    if (props.activeExtraTab === 'total-planner') {
      return <ExtraTotalPlannerContent />
    }

    if (props.activeExtraTab === 'daily-schedule') {
      return <DailyScheduleContent />
    }

    return (
      <ExtraOverviewContent
        character={character}
        weapon={weapon}
        skill={skill}
        stampCore={stampCore}
        stampSet={stampSet}
      />
    )
  }, [character, props.activeExtraTab, skill, stampCore, stampSet, weapon])

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Extra</p>
            <h2>Extra tools</h2>
          </div>
        </div>

        {props.showExtraTabNavigation !== false && (
          <TabNavigation
            tabs={props.extraTabs}
            activeTab={props.activeExtraTab}
            onChange={props.onExtraTabChange}
            className="mini-tab-bar"
            variant="compact"
          />
        )}

        {activeContent}
      </section>

      <ExtraOutputPanel
        activeExtraTab={props.activeExtraTab}
        character={character}
        weapon={weapon}
        skill={skill}
        stampCore={stampCore}
        stampSet={stampSet}
        totals={totals}
      />
    </>
  )
}

export default memo(ExtraTab)
