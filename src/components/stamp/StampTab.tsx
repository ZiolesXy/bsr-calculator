import { memo } from 'react'
import { useStampStates } from '../../context/AppStateContext'
import { useStampCalculator } from '../../hooks/useStampCalculator'
import type { ResourceColor, StampKind, TabDefinition } from '../../types'
import { ResultGroup, ResultPanel, ResultRow, RarityChips } from '../result/ResultPanel'
import { TabNavigation } from '../common/TabNavigation'
import { StampInputs } from './StampInputs'

type StampTabProps = {
  kind: StampKind
  showOutput?: boolean
  tabs?: Array<TabDefinition<StampKind>>
  onTabChange?: (kind: StampKind) => void
}

const cardColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']

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
            <h2>{label} cards, ectoplasm, and kans</h2>
            <p className="ui-section__description">
              {kind === 'set'
                ? 'Core costs are repeated for every set, plus the nexus stamp.'
                : 'Card EXP, ectoplasm, and kans for one core stamp.'}
            </p>
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
        <ResultPanel eyebrow={`${label} output`}>
          <ResultGroup title="EXP">
            <ResultRow label="Total EXP" value={result.expRequired} />
            <ResultRow label="Owned EXP" value={result.ownedExp} tone="muted" />
            <ResultRow label="Recommended" value={result.recommendation.totalExp} />
            <ResultRow label="Extra" value={result.recommendation.overshoot} tone="muted" />
          </ResultGroup>

          <ResultGroup title="Cards to prepare">
            <RarityChips
              items={cardColors.map((color) => ({
                color,
                value: result.recommendation.counts[color],
                percent: result.recommendation.percentages[color],
              }))}
            />
          </ResultGroup>

          <ResultGroup title="Other materials">
            <ResultRow label="Kans" value={result.kans} />
            <ResultRow label="Ectoplasm needed" value={result.ectoplasmNeeded} />
            {kind === 'set' && (
              <>
                <ResultRow label="Nexus required" value={result.nexusRequired} />
                <ResultRow
                  label="Nexus missing"
                  value={result.nexusMissing}
                  hint="unfarmable"
                  tone="danger"
                />
              </>
            )}
          </ResultGroup>
        </ResultPanel>
      )}
    </>
  )
}

export default memo(StampTab)
