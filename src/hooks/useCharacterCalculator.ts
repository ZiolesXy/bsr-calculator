import { useMemo } from 'react'
import defaultSettings from '../data/default-settings.json'
import type { CharacterState, ThreeColorCounts } from '../types'
import {
  calculateCharacterExp,
  calculateOwnedExp,
  calculateRecommendedMaterials,
  sumRangeCosts,
} from '../utils/calculator'

const bookValues = defaultSettings.books
const characterEssenceCosts = defaultSettings.essences
const characterKans = defaultSettings.character.kans
const characterAscensionKans = defaultSettings.character.ascensionKans

export function useCharacterCalculator(state: CharacterState) {
  return useMemo(() => {
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

    return {
      bookValues,
      ownedExp,
      expRequired,
      missingExp,
      recommendation,
      levelKans,
      ascensionKans,
      essenceTotal,
      essenceNeeded: {
        green: Math.max(0, essenceTotal.green - state.ownedEssences.green),
        blue: Math.max(0, essenceTotal.blue - state.ownedEssences.blue),
        purple: Math.max(0, essenceTotal.purple - state.ownedEssences.purple),
      },
    }
  }, [state])
}
