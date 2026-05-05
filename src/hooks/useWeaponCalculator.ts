import defaultSettings from '../data/default-settings.json'
import type { WeaponState, ThreeColorCounts } from '../types'
import { calculateOwnedExp, calculateRecommendedMaterials, calculateThreeColorGreenEquivalent, sumRangeCosts } from '../utils/calculator'

const weaponXpCosts = defaultSettings.weapon.tamahaganeXpCosts
const weaponAscensionKans = defaultSettings.weapon.ascensionKans
const weaponGoldCosts = defaultSettings.weapon.gold
const weaponHammerCosts = defaultSettings.weapon.hammers
const weaponTamahaganeValues = defaultSettings.weapon.tamahaganeExp

export function useWeaponCalculator(state: WeaponState) {
  const expRequired = sumRangeCosts(weaponXpCosts, state.current, state.target)
  const ownedExp = calculateOwnedExp(weaponTamahaganeValues, state.ownedTamahagane)
  const missingExp = Math.max(0, expRequired - ownedExp)
  const recommendation = calculateRecommendedMaterials(missingExp, weaponTamahaganeValues, state.tamahaganeMode)
  const gold = sumRangeCosts(weaponGoldCosts, Math.max(20, state.current), state.target)
  const ascension = sumRangeCosts(weaponAscensionKans, Math.max(20, state.current), state.target)

  const hammerTotal = Object.entries(weaponHammerCosts).reduce<ThreeColorCounts>(
    (acc, [key, value]) => {
      const [from, to] = key.split('-').map(Number)
      if (from >= state.current && to <= state.target) {
        acc.green += value.green
        acc.blue += value.blue
        acc.purple += value.purple
      }
      return acc
    },
    { green: 0, blue: 0, purple: 0 },
  )
  const hammerTotalGreen = calculateThreeColorGreenEquivalent(hammerTotal)
  const ownedHammerGreen = calculateThreeColorGreenEquivalent(state.ownedHammers)
  const missingHammerGreen = Math.max(0, hammerTotalGreen - ownedHammerGreen)

  return {
    ownedExp,
    expRequired,
    missingExp,
    recommendation,
    gold,
    ascension,
    hammerTotal,
    hammerTotalGreen,
    ownedHammerGreen,
    hammerNeeded: {
      green: missingHammerGreen,
      blue: 0,
      purple: 0,
    },
  }
}
