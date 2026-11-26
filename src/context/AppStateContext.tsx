/* eslint-disable react-refresh/only-export-components -- this context module intentionally exports its provider, hooks, and presets together */
import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import defaultAppState from '../data/default-app-state.json'
import type { CharacterState, SkillState, StampState, WeaponState } from '../types'

const defaultCharacterState: CharacterState = defaultAppState.character as CharacterState

const defaultWeaponState: WeaponState = defaultAppState.weapon as WeaponState

const defaultSkillState: SkillState = defaultAppState.skill as SkillState

const defaultStampCoreState: StampState = defaultAppState.stampCore as StampState

const defaultStampSetState: StampState = defaultAppState.stampSet as StampState

export const totalPlannerCharacterPreset: CharacterState = defaultAppState.character as CharacterState

export const totalPlannerWeaponPreset: WeaponState = defaultAppState.weapon as WeaponState

export const totalPlannerSkillPreset: SkillState = defaultAppState.skill as SkillState

export const totalPlannerStampCorePreset: StampState = defaultAppState.stampCore as StampState

export const totalPlannerStampSetPreset: StampState = defaultAppState.stampSet as StampState

type StateContextValue<T> = {
  state: T
  setState: Dispatch<SetStateAction<T>>
}

const CharacterStateContext = createContext<StateContextValue<CharacterState> | null>(null)
const WeaponStateContext = createContext<StateContextValue<WeaponState> | null>(null)
const SkillStateContext = createContext<StateContextValue<SkillState> | null>(null)
const StampStatesContext = createContext<{
  core: StateContextValue<StampState>
  set: StateContextValue<StampState>
} | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [characterState, setCharacterState] = useState<CharacterState>(defaultCharacterState)
  const [weaponState, setWeaponState] = useState<WeaponState>(defaultWeaponState)
  const [skillState, setSkillState] = useState<SkillState>(defaultSkillState)
  const [stampCoreState, setStampCoreState] = useState<StampState>(defaultStampCoreState)
  const [stampSetState, setStampSetState] = useState<StampState>(defaultStampSetState)

  return (
    <CharacterStateContext.Provider value={{ state: characterState, setState: setCharacterState }}>
      <WeaponStateContext.Provider value={{ state: weaponState, setState: setWeaponState }}>
        <SkillStateContext.Provider value={{ state: skillState, setState: setSkillState }}>
          <StampStatesContext.Provider
            value={{
              core: { state: stampCoreState, setState: setStampCoreState },
              set: { state: stampSetState, setState: setStampSetState },
            }}
          >
            {children}
          </StampStatesContext.Provider>
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

export function useStampStates() {
  const context = useContext(StampStatesContext)
  if (!context) {
    throw new Error('useStampStates must be used within an AppStateProvider')
  }

  return {
    stampCoreState: context.core.state,
    setStampCoreState: context.core.setState,
    stampSetState: context.set.state,
    setStampSetState: context.set.setState,
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
