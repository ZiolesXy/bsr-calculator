import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { CharacterState, PassiveLevelsState, SkillState, WeaponState } from '../types'

const defaultPassiveLevels: PassiveLevelsState = {
  passive1: { current: 0, target: 3 },
  passive2: { current: 0, target: 3 },
  passive3: { current: 0, target: 3 },
}

const defaultCharacterState: CharacterState = {
  current: 1,
  target: 100,
  ownedBooks: { green: 0, blue: 0, purple: 0, yellow: 0 },
  ownedEssences: { green: 0, blue: 0, purple: 0 },
  bookMode: 'yellow',
}

const defaultWeaponState: WeaponState = {
  current: 1,
  target: 100,
  ownedTamahagane: { green: 0, blue: 0, purple: 0, yellow: 0 },
  ownedHammers: { green: 0, blue: 0, purple: 0 },
  tamahaganeMode: 'yellow',
}

const defaultSkillState: SkillState = {
  current: 1,
  target: 9,
  selectedTypes: ['basic', 'skill', 'counter', 'ultimate'],
  ownedArts: { green: 0, blue: 0, purple: 0 },
  ownedOmamori: 0,
  passiveLevels: defaultPassiveLevels,
}

export const totalPlannerCharacterPreset: CharacterState = {
  current: 1,
  target: 100,
  ownedBooks: { green: 0, blue: 0, purple: 0, yellow: 0 },
  ownedEssences: { green: 0, blue: 0, purple: 0 },
  bookMode: 'yellow',
}

export const totalPlannerWeaponPreset: WeaponState = {
  current: 1,
  target: 100,
  ownedTamahagane: { green: 0, blue: 0, purple: 0, yellow: 0 },
  ownedHammers: { green: 0, blue: 0, purple: 0 },
  tamahaganeMode: 'yellow',
}

export const totalPlannerSkillPreset: SkillState = {
  current: 1,
  target: 9,
  selectedTypes: ['basic', 'skill', 'counter', 'ultimate'],
  ownedArts: { green: 0, blue: 0, purple: 0 },
  ownedOmamori: 0,
  passiveLevels: defaultPassiveLevels,
}

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
