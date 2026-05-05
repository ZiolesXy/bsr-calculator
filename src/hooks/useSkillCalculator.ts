import defaultSettings from '../data/default-settings.json'
import type { PassiveResult, SkillState } from '../types'
import { calculatePassiveTotals, calculateThreeColorGreenEquivalent, skillLevels } from '../utils/calculator'

const skillArtCosts = defaultSettings.skill.artCosts
const passiveCosts = defaultSettings.passives

export function useSkillCalculator(state: SkillState) {
  const skillMultiplier = Math.max(state.selectedTypes.length, 1)
  const totals = skillLevels.reduce(
    (acc, level) => {
      if (level <= state.current || level > state.target) return acc
      const row = skillArtCosts[String(level) as keyof typeof skillArtCosts]
      acc.green += row.greenArt * skillMultiplier
      acc.blue += row.blueArt * skillMultiplier
      acc.purple += row.purpleArt * skillMultiplier
      acc.kans += row.kans * skillMultiplier
      return acc
    },
    { green: 0, blue: 0, purple: 0, kans: 0 },
  )

  const totalArtGreen = calculateThreeColorGreenEquivalent(totals)
  const ownedArtGreen = calculateThreeColorGreenEquivalent(state.ownedArts)
  const missingArtGreen = Math.max(0, totalArtGreen - ownedArtGreen)

  const needed = {
    green: missingArtGreen,
    blue: 0,
    purple: 0,
  }

  const passiveResults = {
    passive1: calculatePassiveTotals(passiveCosts.passive1, state.passiveLevels.passive1.current, state.passiveLevels.passive1.target),
    passive2: calculatePassiveTotals(passiveCosts.passive2, state.passiveLevels.passive2.current, state.passiveLevels.passive2.target),
    passive3: calculatePassiveTotals(passiveCosts.passive3, state.passiveLevels.passive3.current, state.passiveLevels.passive3.target),
  } satisfies Record<keyof SkillState['passiveLevels'], PassiveResult>

  const passiveTotalOmamori =
    passiveResults.passive1.omamori + passiveResults.passive2.omamori + passiveResults.passive3.omamori
  const passiveTotalKans =
    passiveResults.passive1.kans + passiveResults.passive2.kans + passiveResults.passive3.kans

  return {
    skillMultiplier,
    totals,
    totalArtGreen,
    ownedArtGreen,
    needed,
    passiveResults,
    passiveTotalOmamori,
    passiveTotalKans,
    passiveMissingOmamori: Math.max(0, passiveTotalOmamori - state.ownedOmamori),
  }
}
