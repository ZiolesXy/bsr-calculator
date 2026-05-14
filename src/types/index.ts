export type TabId = 'character' | 'weapon' | 'skill' | 'extra' | 'settings'
export type SettingsTabId = 'theme'
export type ExtraTabId = 'total-planner' | 'overview' | 'daily-schedule'

export type ResourceColor = 'green' | 'blue' | 'purple' | 'yellow'
export type ThreeColor = 'green' | 'blue' | 'purple'
export type MaterialMode = ResourceColor | 'mixed'

export type MaterialCounts = Record<ResourceColor, number>
export type ThreeColorCounts = Record<ThreeColor, number>

export type ThemeDefinition = {
  id: string
  label: string
  description: string
  colors: Record<string, string>
}

export type PassiveLevelState = {
  current: number
  target: number
}

export type PassiveLevelsState = {
  passive1: PassiveLevelState
  passive2: PassiveLevelState
  passive3: PassiveLevelState
}

export type PassiveResult = {
  omamori: number
  kans: number
}

export type MaterialRecommendation = {
  counts: MaterialCounts
  totalExp: number
  overshoot: number
  percentages: MaterialCounts
}

export type TabDefinition<T extends string = string> = {
  id: T
  label: string
  eyebrow: string
}

export type CharacterState = {
  current: number
  target: number
  ownedBooks: MaterialCounts
  ownedEssences: ThreeColorCounts
  bookMode: MaterialMode
}

export type WeaponState = {
  current: number
  target: number
  ownedTamahagane: MaterialCounts
  ownedHammers: ThreeColorCounts
  tamahaganeMode: MaterialMode
}

export type SkillState = {
  current: number
  target: number
  selectedTypes: Array<'basic' | 'skill' | 'counter' | 'ultimate' | 'battlefield-skill'>
  ownedArts: ThreeColorCounts
  ownedOmamori: number
  passiveLevels: PassiveLevelsState
}

export type DailyScheduleInputState = {
  setupMode: 'manual' | 'character-pack'
  manualSelection: {
    category: 'art' | 'book' | 'essence' | 'kans' | 'hammer' | 'omamori' | 'tamahagane'
    color: ResourceColor
    farmLevel: string
    target: number
  }
  characterFarmLevel: string
  selectedCharacterId: string | null
  packKansOwned: number
  dailyStamina: number
}
