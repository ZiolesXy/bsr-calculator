import defaultSettings from '../data/default-settings.json'
import type { StampKind, StampState } from '../types'
import { calculateOwnedExp, calculateRecommendedMaterials, sumRangeCosts } from '../utils/calculator'

const stampSettings = defaultSettings.stamp

export const stampMilestones: number[] = stampSettings.levelMilestones
export const stampCardValues = stampSettings.cardValues

export function useStampCalculator(kind: StampKind, state: StampState) {
  const costs = stampSettings[kind]
  const setCount = kind === 'set' ? Math.min(3, Math.max(1, state.setCount ?? 1)) : 1
  const ownedExp = calculateOwnedExp(stampCardValues, state.ownedCards)
  const expRequired = sumRangeCosts(costs.expCosts, state.current, state.target, stampMilestones) * setCount
  const missingExp = Math.max(0, expRequired - ownedExp)
  const recommendation = calculateRecommendedMaterials(missingExp, stampCardValues, state.cardMode)
  const kans = sumRangeCosts(costs.kans, state.current, state.target, stampMilestones) * setCount

  const ectoplasmTotal = Object.entries(costs.ectoplasm).reduce<number>(
    (acc, [key, value]) => {
      const [from, to] = key.split('-').map(Number)
      if (from >= state.current && to <= state.target) {
        acc += value
      }
      return acc
    },
    0,
  ) * setCount

  const ectoplasmNeeded = Math.max(0, ectoplasmTotal - state.ownedEctoplasm)

  const nexusRequired = kind === 'set'
    ? sumRangeCosts(stampSettings.nexus.costs, state.nexusCurrent, state.nexusTarget, stampMilestones) * setCount
    : 0
  const nexusMissing = Math.max(0, nexusRequired - state.ownedNexus)

  return {
    ownedExp,
    expRequired,
    missingExp,
    recommendation,
    kans,
    ectoplasmTotal,
    ectoplasmNeeded,
    nexusRequired,
    nexusMissing,
    setCount,
  }
}
