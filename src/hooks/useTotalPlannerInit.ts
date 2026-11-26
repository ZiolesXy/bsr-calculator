import { useEffect, useRef } from 'react'
import {
  useAppState,
  useStampStates,
  totalPlannerCharacterPreset,
  totalPlannerSkillPreset,
  totalPlannerStampCorePreset,
  totalPlannerStampSetPreset,
  totalPlannerWeaponPreset,
} from '../context/AppStateContext'
import type { ExtraTabId, StampState, TabId } from '../types'

function isCharacterPresetApplied(
  current: ReturnType<typeof useAppState>['characterState'],
) {
  return (
    current.current === totalPlannerCharacterPreset.current &&
    current.target === totalPlannerCharacterPreset.target &&
    current.bookMode === totalPlannerCharacterPreset.bookMode &&
    current.ownedBooks.green === totalPlannerCharacterPreset.ownedBooks.green &&
    current.ownedBooks.blue === totalPlannerCharacterPreset.ownedBooks.blue &&
    current.ownedBooks.purple === totalPlannerCharacterPreset.ownedBooks.purple &&
    current.ownedBooks.yellow === totalPlannerCharacterPreset.ownedBooks.yellow &&
    current.ownedEssences.green === totalPlannerCharacterPreset.ownedEssences.green &&
    current.ownedEssences.blue === totalPlannerCharacterPreset.ownedEssences.blue &&
    current.ownedEssences.purple === totalPlannerCharacterPreset.ownedEssences.purple
  )
}

function isWeaponPresetApplied(
  current: ReturnType<typeof useAppState>['weaponState'],
) {
  return (
    current.current === totalPlannerWeaponPreset.current &&
    current.target === totalPlannerWeaponPreset.target &&
    current.tamahaganeMode === totalPlannerWeaponPreset.tamahaganeMode &&
    current.ownedTamahagane.green === totalPlannerWeaponPreset.ownedTamahagane.green &&
    current.ownedTamahagane.blue === totalPlannerWeaponPreset.ownedTamahagane.blue &&
    current.ownedTamahagane.purple === totalPlannerWeaponPreset.ownedTamahagane.purple &&
    current.ownedTamahagane.yellow === totalPlannerWeaponPreset.ownedTamahagane.yellow &&
    current.ownedHammers.green === totalPlannerWeaponPreset.ownedHammers.green &&
    current.ownedHammers.blue === totalPlannerWeaponPreset.ownedHammers.blue &&
    current.ownedHammers.purple === totalPlannerWeaponPreset.ownedHammers.purple
  )
}

function isSkillPresetApplied(
  current: ReturnType<typeof useAppState>['skillState'],
) {
  return (
    current.current === totalPlannerSkillPreset.current &&
    current.target === totalPlannerSkillPreset.target &&
    current.selectedTypes.length === totalPlannerSkillPreset.selectedTypes.length &&
    current.selectedTypes.every((type, index) => type === totalPlannerSkillPreset.selectedTypes[index]) &&
    current.ownedArts.green === totalPlannerSkillPreset.ownedArts.green &&
    current.ownedArts.blue === totalPlannerSkillPreset.ownedArts.blue &&
    current.ownedArts.purple === totalPlannerSkillPreset.ownedArts.purple &&
    current.ownedOmamori === totalPlannerSkillPreset.ownedOmamori &&
    current.passiveLevels.passive1.current === totalPlannerSkillPreset.passiveLevels.passive1.current &&
    current.passiveLevels.passive1.target === totalPlannerSkillPreset.passiveLevels.passive1.target &&
    current.passiveLevels.passive2.current === totalPlannerSkillPreset.passiveLevels.passive2.current &&
    current.passiveLevels.passive2.target === totalPlannerSkillPreset.passiveLevels.passive2.target &&
    current.passiveLevels.passive3.current === totalPlannerSkillPreset.passiveLevels.passive3.current &&
    current.passiveLevels.passive3.target === totalPlannerSkillPreset.passiveLevels.passive3.target
  )
}

function isStampPresetApplied(current: StampState, preset: StampState) {
  return (
    current.current === preset.current &&
    current.target === preset.target &&
    current.cardMode === preset.cardMode &&
    current.ownedCards.green === preset.ownedCards.green &&
    current.ownedCards.blue === preset.ownedCards.blue &&
    current.ownedCards.purple === preset.ownedCards.purple &&
    current.ownedCards.yellow === preset.ownedCards.yellow &&
    current.ownedEctoplasm === preset.ownedEctoplasm &&
    current.nexusCurrent === preset.nexusCurrent &&
    current.nexusTarget === preset.nexusTarget &&
    current.ownedNexus === preset.ownedNexus &&
    (current.setCount ?? 1) === (preset.setCount ?? 1)
  )
}

export function useTotalPlannerInit(activeTab: TabId, activeExtraTab: ExtraTabId) {
  const { characterState, setCharacterState, weaponState, setWeaponState, skillState, setSkillState } = useAppState()
  const { stampCoreState, setStampCoreState, stampSetState, setStampSetState } = useStampStates()
  const hasInitializedTotalPlanner = useRef(false)

  useEffect(() => {
    if (activeTab !== 'extra' || activeExtraTab !== 'total-planner' || hasInitializedTotalPlanner.current) {
      return
    }

    const hasCharacterPreset = isCharacterPresetApplied(characterState)
    const hasWeaponPreset = isWeaponPresetApplied(weaponState)
    const hasSkillPreset = isSkillPresetApplied(skillState)
    const hasCoreStampPreset = isStampPresetApplied(stampCoreState, totalPlannerStampCorePreset)
    const hasSetStampPreset = isStampPresetApplied(stampSetState, totalPlannerStampSetPreset)

    if (!hasCharacterPreset) {
      setCharacterState(totalPlannerCharacterPreset)
    }
    if (!hasWeaponPreset) {
      setWeaponState(totalPlannerWeaponPreset)
    }
    if (!hasSkillPreset) {
      setSkillState(totalPlannerSkillPreset)
    }
    if (!hasCoreStampPreset) {
      setStampCoreState(totalPlannerStampCorePreset)
    }
    if (!hasSetStampPreset) {
      setStampSetState(totalPlannerStampSetPreset)
    }

    hasInitializedTotalPlanner.current = true
  }, [
    activeExtraTab,
    activeTab,
    characterState,
    setCharacterState,
    setSkillState,
    setStampCoreState,
    setStampSetState,
    setWeaponState,
    skillState,
    stampCoreState,
    stampSetState,
    weaponState,
  ])
}
