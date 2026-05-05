import defaultSettings from '../data/default-settings.json'
import type { CharacterState, ThreeColorCounts } from '../types'
import {
  calculateCharacterExp,
  calculateOwnedExp,
  calculateRecommendedMaterials,
  calculateThreeColorGreenEquivalent,
  sumRangeCosts,
} from '../utils/calculator'

const bookValues = defaultSettings.books
const characterEssenceCosts = defaultSettings.essences
const characterKans = defaultSettings.character.kans
const characterAscensionKans = defaultSettings.character.ascensionKans

export function useCharacterCalculator(state: CharacterState) {
  const ownedExp = calculateOwnedExp(bookValues, state.ownedBooks)
  const expRequired = calculateCharacterExp(state.current, state.target)
  const missingExp = Math.max(0, expRequired - ownedExp)
  const recommendation = calculateRecommendedMaterials(missingExp, bookValues, state.bookMode)
  const levelKans = sumRangeCosts(characterKans, state.current, state.target)
  const ascensionKans = sumRangeCosts(characterAscensionKans, state.current, state.target)

  const essenceTotal = Object.entries(characterEssenceCosts).reduce<ThreeColorCounts>(
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
  const essenceTotalGreen = calculateThreeColorGreenEquivalent(essenceTotal)
  const ownedEssenceGreen = calculateThreeColorGreenEquivalent(state.ownedEssences)
  const missingEssenceGreen = Math.max(0, essenceTotalGreen - ownedEssenceGreen)

  return {
    bookValues,
    ownedExp,
    expRequired,
    missingExp,
    recommendation,
    levelKans,
    ascensionKans,
    essenceTotal,
    essenceTotalGreen,
    ownedEssenceGreen,
    essenceNeeded: {
      green: missingEssenceGreen,
      blue: 0,
      purple: 0,
    },
  }
}
