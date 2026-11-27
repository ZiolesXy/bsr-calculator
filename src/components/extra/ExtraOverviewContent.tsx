import type { MaterialRecommendation, ResourceColor } from '../../types'
import { formatNumber } from '../../utils/formatter'
import { StatCard } from '../common/StatCard'
import { RarityChips } from '../result/ResultPanel'

type StampSummary = {
  missingExp: number
  kans: number
  recommendation: MaterialRecommendation
  ectoplasmNeeded: number
  nexusMissing: number
}

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
  stampCore: StampSummary
  stampSet: StampSummary
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

export function ExtraOverviewContent({
  character,
  weapon,
  skill,
  stampCore,
  stampSet,
}: ExtraOverviewContentProps) {
  return (
    <div className="overview-stack">
      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Character</p>
          <strong>Level, books, essence</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard label="Missing EXP" value={formatNumber(character.missingExp)} />
          <StatCard
            label="Kans"
            value={formatNumber(character.levelKans + character.ascensionKans)}
          />
          <StatCard
            label="Essence"
            value={formatNumber(
              character.essenceNeeded.green +
                character.essenceNeeded.blue +
                character.essenceNeeded.purple,
            )}
          />
        </div>
        <MaterialLine
          label="Books"
          items={fourColors.map((color) => ({
            color,
            value: character.recommendation.counts[color],
          }))}
        />
        <MaterialLine
          label="Essence"
          items={threeColors.map((color) => ({ color, value: character.essenceNeeded[color] }))}
        />
      </article>

      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Weapon</p>
          <strong>Tamahagane, hammers, gold</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard label="Missing EXP" value={formatNumber(weapon.missingExp)} />
          <StatCard label="Gold" value={formatNumber(weapon.gold)} />
          <StatCard label="Ascension kans" value={formatNumber(weapon.ascension)} />
        </div>
        <MaterialLine
          label="Tamahagane"
          items={fourColors.map((color) => ({
            color,
            value: weapon.recommendation.counts[color],
          }))}
        />
        <MaterialLine
          label="Hammers"
          items={threeColors.map((color) => ({ color, value: weapon.hammerNeeded[color] }))}
        />
      </article>

      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Skill</p>
          <strong>Arts, omamori, passive boosts</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard
            label="Kans"
            value={formatNumber(skill.totals.kans + skill.passiveTotalKans)}
          />
          <StatCard label="Missing omamori" value={formatNumber(skill.passiveMissingOmamori)} />
          <StatCard label="Skill types" value={formatNumber(skill.skillMultiplier)} />
        </div>
        <MaterialLine
          label="Arts"
          items={threeColors.map((color) => ({ color, value: skill.needed[color] }))}
        />
      </article>

      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Core Stamp</p>
          <strong>Cards, ectoplasm, kans</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard label="Missing EXP" value={formatNumber(stampCore.missingExp)} />
          <StatCard label="Kans" value={formatNumber(stampCore.kans)} />
          <StatCard label="Ectoplasm" value={formatNumber(stampCore.ectoplasmNeeded)} />
        </div>
        <MaterialLine
          label="Cards"
          items={fourColors.map((color) => ({
            color,
            value: stampCore.recommendation.counts[color],
          }))}
        />
      </article>

      <article className="overview-block">
        <div className="overview-block__header">
          <p className="section-tag">Set Stamp</p>
          <strong>Core costs plus nexus stamp</strong>
        </div>
        <div className="overview-inline-stats">
          <StatCard label="Missing EXP" value={formatNumber(stampSet.missingExp)} />
          <StatCard label="Kans" value={formatNumber(stampSet.kans)} />
          <StatCard label="Nexus missing" value={formatNumber(stampSet.nexusMissing)} />
        </div>
        <MaterialLine
          label="Cards"
          items={fourColors.map((color) => ({
            color,
            value: stampSet.recommendation.counts[color],
          }))}
        />
        <div className="material-line">
          <span className="material-line__label">Ectoplasm</span>
          <span className="overview-value num">{formatNumber(stampSet.ectoplasmNeeded)}</span>
        </div>
      </article>
    </div>
  )
}
