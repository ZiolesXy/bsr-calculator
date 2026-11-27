import type { ExtraTabId, MaterialRecommendation, ResourceColor } from '../../types'
import { ResultGroup, ResultPanel, ResultRow, RarityChips } from '../result/ResultPanel'

type StampSummary = {
  missingExp: number
  kans: number
  recommendation: MaterialRecommendation
  nexusMissing: number
  ectoplasmNeeded: number
}

type ExtraOutputPanelProps = {
  activeExtraTab: ExtraTabId
  character: {
    missingExp: number
    recommendation: MaterialRecommendation
    essenceNeeded: { green: number; blue: number; purple: number }
  }
  weapon: {
    missingExp: number
    recommendation: MaterialRecommendation
    hammerNeeded: { green: number; blue: number; purple: number }
    gold: number
  }
  skill: {
    needed: { green: number; blue: number; purple: number }
    passiveMissingOmamori: number
    skillMultiplier: number
  }
  stampCore: StampSummary
  stampSet: StampSummary
  totals: {
    totalKansCombined: number
    totalExpMissing: number
  }
}

const fourColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']
const threeColors: Array<'green' | 'blue' | 'purple'> = ['green', 'blue', 'purple']

function MaterialLine({
  label,
  items,
}: {
  label: string
  items: Array<{ color: ResourceColor; value: number }>
}) {
  return (
    <div className="material-line">
      <span className="material-line__label">{label}</span>
      <RarityChips items={items} />
    </div>
  )
}

export function ExtraOutputPanel({
  activeExtraTab,
  character,
  weapon,
  skill,
  stampCore,
  stampSet,
  totals,
}: ExtraOutputPanelProps) {
  if (activeExtraTab === 'daily-schedule') {
    return (
      <section className="panel stats-panel" aria-label="Schedule details">
        <p className="section-tag">Schedule storage</p>
        <ResultGroup title="This device">
          <ResultRow label="Storage" value="Local storage" />
          <ResultRow label="Import / export" value=".json" />
          <ResultRow label="Progress reset" value="Manual" />
        </ResultGroup>
      </section>
    )
  }

  const combinedCards = fourColors.map((color) => ({
    color,
    value: stampCore.recommendation.counts[color] + stampSet.recommendation.counts[color],
  }))

  return (
    <ResultPanel
      eyebrow={activeExtraTab === 'overview' ? 'Combined overview' : 'Total planner output'}
    >
      <ResultGroup title="Missing EXP by source">
        <ResultRow label="Character" value={character.missingExp} />
        <ResultRow label="Weapon" value={weapon.missingExp} />
        <ResultRow label="Core stamp" value={stampCore.missingExp} />
        <ResultRow label="Set stamp" value={stampSet.missingExp} />
      </ResultGroup>

      <ResultGroup title="Materials">
        <MaterialLine
          label="Books"
          items={fourColors.map((color) => ({
            color,
            value: character.recommendation.counts[color],
          }))}
        />
        <MaterialLine
          label="Tamahagane"
          items={fourColors.map((color) => ({
            color,
            value: weapon.recommendation.counts[color],
          }))}
        />
        <MaterialLine
          label="Cards"
          items={combinedCards}
        />
        <MaterialLine
          label="Arts"
          items={threeColors.map((color) => ({ color, value: skill.needed[color] }))}
        />
        <MaterialLine
          label="Essence"
          items={threeColors.map((color) => ({ color, value: character.essenceNeeded[color] }))}
        />
        <MaterialLine
          label="Hammers"
          items={threeColors.map((color) => ({ color, value: weapon.hammerNeeded[color] }))}
        />
      </ResultGroup>

      <ResultGroup title="Costs">
        <ResultRow label="Kans (all sources)" value={totals.totalKansCombined} />
        <ResultRow label="Weapon gold" value={weapon.gold} />
        <ResultRow label="Missing omamori" value={skill.passiveMissingOmamori} />
        <ResultRow
          label="Nexus missing"
          value={stampSet.nexusMissing}
          hint="unfarmable"
          tone={stampSet.nexusMissing > 0 ? 'danger' : 'muted'}
        />
        <ResultRow label="Skill types selected" value={skill.skillMultiplier} tone="muted" />
      </ResultGroup>
    </ResultPanel>
  )
}
