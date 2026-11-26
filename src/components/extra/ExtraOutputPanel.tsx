import type { ExtraTabId, MaterialRecommendation } from '../../types'
import { formatNumber } from '../../utils/formatter'
import { RecommendationCard } from '../common/RecommendationCard'
import { StatCard } from '../common/StatCard'

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

export function ExtraOutputPanel({ activeExtraTab, character, weapon, skill, stampCore, stampSet, totals }: ExtraOutputPanelProps) {
  return (
    <section className="panel stats-panel">
      <p className="section-tag">Extra Output</p>
      {activeExtraTab === 'total-planner' && (
        <>
          <StatCard label="Character Missing EXP" value={formatNumber(character.missingExp)} />
          <RecommendationCard label="Books to prepare" recommendation={character.recommendation} />
          <StatCard label="Need Essences" value={`${formatNumber(character.essenceNeeded.green)} / ${formatNumber(character.essenceNeeded.blue)} / ${formatNumber(character.essenceNeeded.purple)}`} />
          <StatCard label="Weapon Missing EXP" value={formatNumber(weapon.missingExp)} />
          <RecommendationCard label="Tamahagane to prepare" recommendation={weapon.recommendation} />
          <StatCard label="Need Hammers" value={`${formatNumber(weapon.hammerNeeded.green)} / ${formatNumber(weapon.hammerNeeded.blue)} / ${formatNumber(weapon.hammerNeeded.purple)}`} />
          <StatCard label="Need Arts" value={`${formatNumber(skill.needed.green)} / ${formatNumber(skill.needed.blue)} / ${formatNumber(skill.needed.purple)}`} />
          <StatCard label="Total Kans All" value={formatNumber(totals.totalKansCombined)} />
          <StatCard label="Weapon Gold" value={formatNumber(weapon.gold)} />
          <StatCard label="Missing Omamori" value={formatNumber(skill.passiveMissingOmamori)} />
          <StatCard label="Skill Types Selected" value={formatNumber(skill.skillMultiplier)} />
          <StatCard label="Core Stamp Missing EXP" value={formatNumber(stampCore.missingExp)} />
          <RecommendationCard label="Core cards to prepare" recommendation={stampCore.recommendation} />
          <StatCard label="Set Stamp Missing EXP" value={formatNumber(stampSet.missingExp)} />
          <RecommendationCard label="Set cards to prepare" recommendation={stampSet.recommendation} />
          <StatCard label="Stamp Kans" value={formatNumber(stampCore.kans + stampSet.kans)} />
          <StatCard label="Nexus Missing" value={formatNumber(stampSet.nexusMissing)} />
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
          <StatCard label="Core Stamp Missing EXP" value={formatNumber(stampCore.missingExp)} />
          <StatCard label="Set Stamp Missing EXP" value={formatNumber(stampSet.missingExp)} />
          <StatCard label="Nexus Missing" value={formatNumber(stampSet.nexusMissing)} />
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
