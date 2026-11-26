/* eslint-disable react-refresh/only-export-components -- this context module intentionally exports its provider, hooks, and presets together */
import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import defaultAppState from '../data/default-app-state.json'
import type { CharacterState, SkillState, WeaponState } from '../types'

const defaultCharacterState: CharacterState = defaultAppState.character as CharacterState

const defaultWeaponState: WeaponState = defaultAppState.weapon as WeaponState

const defaultSkillState: SkillState = defaultAppState.skill as SkillState

export const totalPlannerCharacterPreset: CharacterState = defaultAppState.character as CharacterState

export const totalPlannerWeaponPreset: WeaponState = defaultAppState.weapon as WeaponState

export const totalPlannerSkillPreset: SkillState = defaultAppState.skill as SkillState

type StateContextValue<T> = {
  state: T
  setState: Dispatch<SetStateAction<T>>
}

const CharacterStateContext = createContext<StateContextValue<CharacterState> | null>(null)
const WeaponStateContext = createContext<StateContextValue<WeaponState> | null>(null)
const SkillStateContext = createContext<StateContextValue<SkillState> | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [characterState, setCharacterState] = useState<CharacterState>(defaultCharacterState)
  const [weaponState, setWeaponState] = useState<WeaponState>(defaultWeaponState)
  const [skillState, setSkillState] = useState<SkillState>(defaultSkillState)

  return (
    <CharacterStateContext.Provider value={{ state: characterState, setState: setCharacterState }}>
      <WeaponStateContext.Provider value={{ state: weaponState, setState: setWeaponState }}>
        <SkillStateContext.Provider value={{ state: skillState, setState: setSkillState }}>
          {children}
        </SkillStateContext.Provider>
      </WeaponStateContext.Provider>
    </CharacterStateContext.Provider>
  )
}

function useTypedStateContext<T>(context: React.Context<StateContextValue<T> | null>, name: string) {
  const value = useContext(context)
  if (!value) {
    throw new Error(`${name} must be used within an AppStateProvider`)
  }
  return value
}

export function useCharacterState() {
  const context = useTypedStateContext(CharacterStateContext, 'useCharacterState')
  return {
    characterState: context.state,
    setCharacterState: context.setState,
  }
}

export function useWeaponState() {
  const context = useTypedStateContext(WeaponStateContext, 'useWeaponState')
  return {
    weaponState: context.state,
    setWeaponState: context.setState,
  }
}

export function useSkillState() {
  const context = useTypedStateContext(SkillStateContext, 'useSkillState')
  return {
    skillState: context.state,
    setSkillState: context.setState,
  }
}

export function useAppState() {
  const { characterState, setCharacterState } = useCharacterState()
  const { weaponState, setWeaponState } = useWeaponState()
  const { skillState, setSkillState } = useSkillState()

  return {
    characterState,
    setCharacterState,
    weaponState,
    setWeaponState,
    skillState,
    setSkillState,
  }
}
