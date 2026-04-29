import type { MaterialRecommendation } from '../../types'
import { formatNumber } from '../../utils/formatter'
import { RecommendationCard } from '../common/RecommendationCard'
import { StatCard } from '../common/StatCard'

type ExtraOverviewContentProps = {
  character: {
    missingExp: number
    levelKans: number
    ascensionKans: number
    recommendation: MaterialRecommendation
    essenceNeeded: { green: number; blue: number; purple: number }
  }
  weapon: {
    missingExp: number
    gold: number
    ascension: number
    recommendation: MaterialRecommendation
    hammerNeeded: { green: number; blue: number; purple: number }
  }
  skill: {
    needed: { green: number; blue: number; purple: number }
    totals: { kans: number }
    passiveTotalKans: number
    passiveMissingOmamori: number
    skillMultiplier: number
  }
}

export function ExtraOverviewContent({ character, weapon, skill }: ExtraOverviewContentProps) {
  return (
    <div className="overview-stack">
      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Character</p>
          <strong>Character summary</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard label="Missing EXP" value={formatNumber(character.missingExp)} />
          <StatCard label="Level Kans" value={formatNumber(character.levelKans)} />
          <StatCard label="Ascension Kans" value={formatNumber(character.ascensionKans)} />
        </div>
        <RecommendationCard label="Books to prepare" recommendation={character.recommendation} />
        <StatCard
          label="Need Essences"
          value={`${formatNumber(character.essenceNeeded.green)} / ${formatNumber(character.essenceNeeded.blue)} / ${formatNumber(character.essenceNeeded.purple)}`}
        />
      </article>

      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Weapon</p>
          <strong>Weapon summary</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard label="Missing EXP" value={formatNumber(weapon.missingExp)} />
          <StatCard label="Gold" value={formatNumber(weapon.gold)} />
          <StatCard label="Ascension Kans" value={formatNumber(weapon.ascension)} />
        </div>
        <RecommendationCard label="Tamahagane to prepare" recommendation={weapon.recommendation} />
        <StatCard
          label="Need Hammers"
          value={`${formatNumber(weapon.hammerNeeded.green)} / ${formatNumber(weapon.hammerNeeded.blue)} / ${formatNumber(weapon.hammerNeeded.purple)}`}
        />
      </article>

      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Skill</p>
          <strong>Skill summary</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard label="Need Arts" value={`${formatNumber(skill.needed.green)} / ${formatNumber(skill.needed.blue)} / ${formatNumber(skill.needed.purple)}`} />
          <StatCard label="Skill Kans" value={formatNumber(skill.totals.kans)} />
          <StatCard label="Passive Kans" value={formatNumber(skill.passiveTotalKans)} />
        </div>
        <StatCard label="Missing Omamori" value={formatNumber(skill.passiveMissingOmamori)} />
        <StatCard label="Skill Types Selected" value={formatNumber(skill.skillMultiplier)} />
      </article>
    </div>
  )
}
