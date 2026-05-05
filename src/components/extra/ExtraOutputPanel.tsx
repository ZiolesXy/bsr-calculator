import type { ExtraTabId, MaterialRecommendation } from '../../types'
import { formatNumber } from '../../utils/formatter'
import { RecommendationCard } from '../common/RecommendationCard'
import { StatCard } from '../common/StatCard'

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
  totals: {
    totalKansCombined: number
    totalExpMissing: number
  }
}

export function ExtraOutputPanel({ activeExtraTab, character, weapon, skill, totals }: ExtraOutputPanelProps) {
  return (
    <section className="panel stats-panel">
      <p className="section-tag">Extra Output</p>
      {activeExtraTab === 'total-planner' && (
        <>
          <StatCard label="Character Missing EXP" value={formatNumber(character.missingExp)} />
          <RecommendationCard label="Books to prepare" recommendation={character.recommendation} />
          <StatCard label="Need Essences (green value)" value={formatNumber(character.essenceNeeded.green)} />
          <StatCard label="Weapon Missing EXP" value={formatNumber(weapon.missingExp)} />
          <RecommendationCard label="Tamahagane to prepare" recommendation={weapon.recommendation} />
          <StatCard label="Need Hammers (green value)" value={formatNumber(weapon.hammerNeeded.green)} />
          <StatCard label="Need Arts (green value)" value={formatNumber(skill.needed.green)} />
          <StatCard label="Total Kans All" value={formatNumber(totals.totalKansCombined)} />
          <StatCard label="Weapon Gold" value={formatNumber(weapon.gold)} />
          <StatCard label="Missing Omamori" value={formatNumber(skill.passiveMissingOmamori)} />
          <StatCard label="Skill Types Selected" value={formatNumber(skill.skillMultiplier)} />
        </>
      )}
      {activeExtraTab === 'overview' && (
        <>
          <StatCard label="Total Missing EXP" value={formatNumber(totals.totalExpMissing)} />
          <StatCard label="Total Kans All" value={formatNumber(totals.totalKansCombined)} />
          <StatCard label="Weapon Gold" value={formatNumber(weapon.gold)} />
          <StatCard label="Missing Omamori" value={formatNumber(skill.passiveMissingOmamori)} />
          <StatCard label="Books Extra EXP" value={formatNumber(character.recommendation.overshoot)} />
          <StatCard label="Tamahagane Extra EXP" value={formatNumber(weapon.recommendation.overshoot)} />
        </>
      )}
      {activeExtraTab === 'daily-schedule' && (
        <>
          <StatCard label="Storage" value="Local" />
          <StatCard label="Import / Export" value=".json" />
          <StatCard label="Progress Reset" value="Manual" />
        </>
      )}
    </section>
  )
}
