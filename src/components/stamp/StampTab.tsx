import { memo } from 'react'
import { useStampStates } from '../../context/AppStateContext'
import { useStampCalculator } from '../../hooks/useStampCalculator'
import type { StampKind, TabDefinition } from '../../types'
import { formatNumber } from '../../utils/formatter'
import { RecommendationCard } from '../common/RecommendationCard'
import { StatCard } from '../common/StatCard'
import { TabNavigation } from '../common/TabNavigation'
import { StampInputs } from './StampInputs'

type StampTabProps = {
  kind: StampKind
  showOutput?: boolean
  tabs?: Array<TabDefinition<StampKind>>
  onTabChange?: (kind: StampKind) => void
}

export function StampTab({ kind, showOutput = true, tabs, onTabChange }: StampTabProps) {
  const { stampCoreState, setStampCoreState, stampSetState, setStampSetState } = useStampStates()
  const state = kind === 'core' ? stampCoreState : stampSetState
  const setState = kind === 'core' ? setStampCoreState : setStampSetState
  const result = useStampCalculator(kind, state)
  const label = kind === 'core' ? 'Core Stamp' : 'Set Stamp'

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">{tabs ? 'Stamp' : label}</p>
            <h2>{label} card, ectoplasm, and kans calculator</h2>
          </div>
        </div>
        {tabs && onTabChange && (
          <TabNavigation
            tabs={tabs}
            activeTab={kind}
            onChange={onTabChange}
            className="mini-tab-bar"
            variant="compact"
          />
        )}
        <StampInputs kind={kind} state={state} onChange={setState} />
      </section>
      {showOutput && (
        <section className="panel stats-panel">
          <p className="section-tag">Output</p>
          <StatCard label="Total EXP" value={formatNumber(result.expRequired)} />
          <StatCard label="Owned EXP" value={formatNumber(result.ownedExp)} />
          <StatCard label="Missing EXP" value={formatNumber(result.missingExp)} />
          <RecommendationCard label="Card recommendation" recommendation={result.recommendation} />
          <StatCard label="Recommended EXP" value={formatNumber(result.recommendation.totalExp)} />
          <StatCard label="Extra EXP" value={formatNumber(result.recommendation.overshoot)} />
          <StatCard label="Kans" value={formatNumber(result.kans)} />
          <StatCard
            label="Need Ectoplasm"
            value={formatNumber(result.ectoplasmNeeded)}
          />
          {kind === 'set' && (
            <>
              <StatCard label="Nexus Required" value={formatNumber(result.nexusRequired)} />
              <StatCard label="Nexus Missing (unfarmable)" value={formatNumber(result.nexusMissing)} />
            </>
          )}
        </section>
      )}
    </>
  )
}

export default memo(StampTab)
