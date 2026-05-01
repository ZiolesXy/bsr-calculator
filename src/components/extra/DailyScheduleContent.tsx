import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import {
  totalPlannerCharacterPreset,
  totalPlannerSkillPreset,
  totalPlannerWeaponPreset,
} from '../../context/AppStateContext'
import characterPack from '../../data/character-pack.json'
import defaultSettings from '../../data/default-settings.json'
import farmingRewards from '../../data/farming-rewards.json'
import { useCharacterCalculator } from '../../hooks/useCharacterCalculator'
import { useSkillCalculator } from '../../hooks/useSkillCalculator'
import { useWeaponCalculator } from '../../hooks/useWeaponCalculator'
import type { CharacterState, ResourceColor, SkillState, WeaponState } from '../../types'
import { levelMilestones, skillLevels } from '../../utils/calculator'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'

type FarmingCategory = keyof typeof farmingRewards
type FarmingLevel = keyof (typeof farmingRewards)[FarmingCategory]
type DailyView = 'entry' | 'setup' | 'schedule'
type SetupMode = 'manual' | 'character-pack'

type ScheduleItem = {
  category: FarmingCategory
  color: ResourceColor
  farmLevel: string
  id: string
  name: string
  progressUnit?: 'item' | 'farm'
  source: string
  target: number
  progress: number
}

type StoredSchedule = {
  schedule: ScheduleItem[]
  lastUpdated: string
}

type ExportResult = {
  data: string
  fileName: string
} | null

type ManualSelection = {
  category: FarmingCategory
  color: ResourceColor
  farmLevel: string
  target: number
}

const STORAGE_KEY = 'bsr-daily-farming-schedule'
const resourceColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']
const threeStarColors = ['green', 'blue', 'purple'] as const
const overflowCategories: FarmingCategory[] = ['art', 'essence', 'hammer']
const rarityFallbackOrder: ResourceColor[] = ['purple', 'blue', 'green']
const skillTypes = ['basic', 'skill', 'counter', 'ultimate']

const categoryLabels: Record<FarmingCategory, string> = {
  art: 'Art',
  book: 'Book',
  essence: 'Essence',
  hammer: 'Hammer',
  omamori: 'Omamori',
  tamahagane: 'Tamahagane',
}

function normalizeAmount(value: string, fallback: number) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return fallback
  return Math.max(0, Math.floor(amount))
}

function readSavedSchedule(): ScheduleItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<StoredSchedule>
    return Array.isArray(parsed.schedule) ? sanitizeImportedSchedule(parsed.schedule) : []
  } catch {
    return []
  }
}

function createItemId(category: FarmingCategory, farmLevel: string, color: ResourceColor) {
  return `${category}_${farmLevel}_${color}`
}

function createFarmItemId(category: FarmingCategory, farmLevel: string) {
  return `${category}_${farmLevel}_farm`
}

function createScheduleItem(category: FarmingCategory, farmLevel: string, color: ResourceColor, target: number, progress = 0): ScheduleItem {
  const reward = farmingRewards[category][farmLevel as FarmingLevel]
  const rewardAmount = reward[color] ?? 0

  return {
    category,
    color,
    farmLevel,
    id: createItemId(category, farmLevel, color),
    name: `${color} ${categoryLabels[category]}`,
    source: `${categoryLabels[category]} stage ${farmLevel} (${reward.stamina} stamina, avg ${rewardAmount})`,
    target,
    progress,
  }
}

function calculateRewardExp(category: 'book' | 'tamahagane', farmLevel: string) {
  const reward = farmingRewards[category][farmLevel as FarmingLevel]
  const values = category === 'book' ? defaultSettings.books : defaultSettings.weapon.tamahaganeExp

  return resourceColors.reduce((total, color) => total + (reward[color] ?? 0) * values[color], 0)
}

function createExpFarmScheduleItem(category: 'book' | 'tamahagane', farmLevel: string, missingExp: number): ScheduleItem | null {
  const reward = farmingRewards[category][farmLevel as FarmingLevel]
  const expPerFarm = calculateRewardExp(category, farmLevel)
  if (missingExp <= 0 || expPerFarm <= 0) return null

  return {
    category,
    color: 'yellow',
    farmLevel,
    id: createFarmItemId(category, farmLevel),
    name: `${categoryLabels[category]} farm`,
    progressUnit: 'farm',
    source: `${categoryLabels[category]} stage ${farmLevel} (${reward.stamina} stamina, avg ${expPerFarm} EXP/farm)`,
    target: Math.ceil(missingExp / expPerFarm),
    progress: 0,
  }
}

function parseScheduleItemId(id: string) {
  const [category, farmLevel, color] = id.split('_') as [FarmingCategory | undefined, string | undefined, ResourceColor | undefined]
  if (!category || !farmLevel || !color || !farmingRewards[category]?.[farmLevel as FarmingLevel]) return null
  return { category, color, farmLevel }
}

function getFarmRewardAmount(item: ScheduleItem) {
  if (item.progressUnit === 'farm') return 1

  const reward = farmingRewards[item.category]?.[item.farmLevel as FarmingLevel]
  return reward?.[item.color] ?? 0
}

function getHighestRewardRarity(category: FarmingCategory, farmLevel: string) {
  const reward = farmingRewards[category]?.[farmLevel as FarmingLevel]
  return rarityFallbackOrder.find((color) => (reward?.[color] ?? 0) > 0)
}

function canUseFarmAddButton(item: ScheduleItem) {
  if (item.progressUnit === 'farm') return true
  if (!overflowCategories.includes(item.category)) return getFarmRewardAmount(item) > 0

  return item.color === getHighestRewardRarity(item.category, item.farmLevel)
}

function getFallbackRarities(color: ResourceColor) {
  const colorIndex = rarityFallbackOrder.indexOf(color)
  if (colorIndex < 0) return [color]
  return rarityFallbackOrder.slice(colorIndex)
}

function convertOverflowAmount(fromColor: ResourceColor, toColor: ResourceColor, amount: number) {
  const fromIndex = rarityFallbackOrder.indexOf(fromColor)
  const toIndex = rarityFallbackOrder.indexOf(toColor)
  if (fromIndex < 0 || toIndex < 0) return amount
  if (toIndex === fromIndex) return amount
  if (toIndex > fromIndex) return amount * 3 ** (toIndex - fromIndex)
  return amount / 3 ** (fromIndex - toIndex)
}

function formatProgressAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
}

function getConversionRarities(color: ResourceColor) {
  const colorIndex = rarityFallbackOrder.indexOf(color)
  if (colorIndex < 0) return [color]

  return [
    ...rarityFallbackOrder.slice(colorIndex),
    ...rarityFallbackOrder.slice(0, colorIndex).reverse(),
  ]
}

function applyConvertedProgress(
  schedule: ScheduleItem[],
  sourceItem: ScheduleItem,
  sourceColor: ResourceColor,
  amount: number,
) {
  let remainingAmount = amount
  let previousColor = sourceColor
  let didApply = false
  const conversionColors = getConversionRarities(sourceColor)

  conversionColors.forEach((color) => {
    if (remainingAmount <= 0) return

    const convertedAmount = convertOverflowAmount(previousColor, color, remainingAmount)
    if (convertedAmount <= 0) {
      remainingAmount = 0
      previousColor = color
      return
    }

    const targetItem = schedule.find(
      (item) =>
        item.category === sourceItem.category &&
        item.farmLevel === sourceItem.farmLevel &&
        item.color === color &&
        item.progress < item.target,
    )
    if (!targetItem) {
      remainingAmount = convertedAmount
      previousColor = color
      return
    }

    const capacity = targetItem.target - targetItem.progress
    const appliedAmount = Math.min(capacity, convertedAmount)
    targetItem.progress += appliedAmount
    didApply = didApply || appliedAmount > 0
    remainingAmount = Math.max(0, convertedAmount - appliedAmount)
    previousColor = color
  })

  return didApply
}

function applyProgressWithOverflow(schedule: ScheduleItem[], id: string, amount: number, includeStageRewards = false) {
  const sourceItem = schedule.find((item) => item.id === id)
  if (!sourceItem) return { didApply: false, nextSchedule: schedule }

  if (!overflowCategories.includes(sourceItem.category)) {
    return {
      didApply: sourceItem.progress < sourceItem.target && amount > 0,
      nextSchedule: schedule.map((item) =>
        item.id === id ? { ...item, progress: Math.min(item.target, item.progress + amount) } : item,
      ),
    }
  }

  const rewardColors = includeStageRewards ? getFallbackRarities(sourceItem.color) : [sourceItem.color]
  const nextSchedule = schedule.map((item) => ({ ...item }))
  const reward = farmingRewards[sourceItem.category]?.[sourceItem.farmLevel as FarmingLevel]
  let didApply = false

  rewardColors.forEach((color) => {
    const rewardAmount = color === sourceItem.color ? amount : reward?.[color] ?? 0
    didApply = rewardAmount > 0 && applyConvertedProgress(nextSchedule, sourceItem, color, rewardAmount) || didApply
  })

  return { didApply, nextSchedule }
}

function mergeSchedule(current: ScheduleItem[], incoming: ScheduleItem[]) {
  return incoming.reduce<ScheduleItem[]>((merged, item) => {
    const existingItem = merged.find((entry) => entry.id === item.id)
    if (!existingItem) return [...merged, item]

    return merged.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            name: item.name,
            source: item.source,
            target: entry.target + item.target,
            progress: 0,
          }
        : entry,
    )
  }, current)
}

function createStoredSchedule(schedule: ScheduleItem[]): StoredSchedule {
  return {
    schedule,
    lastUpdated: new Date().toISOString(),
  }
}

function sanitizeImportedSchedule(schedule: unknown): ScheduleItem[] {
  if (!Array.isArray(schedule)) throw new Error('Invalid schedule')

  return schedule.map((rawItem) => {
    const item = rawItem as Partial<ScheduleItem>
    const parsedId = parseScheduleItemId(String(item.id))
    const category = (String(item.category || parsedId?.category || 'book')) as FarmingCategory
    const color = (String(item.color || parsedId?.color || 'yellow')) as ResourceColor
    const farmLevel = String(item.farmLevel || parsedId?.farmLevel || '6')

    if (farmingRewards[category]?.[farmLevel as FarmingLevel]) {
      if ((item.progressUnit === 'farm' || String(item.id).endsWith('_farm')) && (category === 'book' || category === 'tamahagane')) {
        const expFarmItem = createExpFarmScheduleItem(
          category,
          farmLevel,
          normalizeAmount(String(item.target), 0) * calculateRewardExp(category, farmLevel),
        )
        return expFarmItem
          ? {
              ...expFarmItem,
              target: normalizeAmount(String(item.target), expFarmItem.target),
              progress: normalizeAmount(String(item.progress), 0),
            }
          : createScheduleItem(category, farmLevel, color, normalizeAmount(String(item.target), 0), normalizeAmount(String(item.progress), 0))
      }

      return createScheduleItem(
        category,
        farmLevel,
        color,
        normalizeAmount(String(item.target), 0),
        normalizeAmount(String(item.progress), 0),
      )
    }

    return {
      category: 'book',
      color: 'yellow',
      farmLevel: '6',
      id: String(item.id),
      name: String(item.name),
      source: String(item.source),
      target: normalizeAmount(String(item.target), 0),
      progress: normalizeAmount(String(item.progress), 0),
    }
  })
}

function getPositiveItems<T extends string>(
  values: Record<T, number>,
  colors: readonly T[],
  createItem: (color: T, amount: number) => ScheduleItem,
) {
  return colors.flatMap((color) => (values[color] > 0 ? [createItem(color, values[color])] : []))
}

type EntryViewProps = {
  importInput: React.ReactNode
  message: string
  onImportClick: () => void
  onLoad: () => void
  onSetup: () => void
}

const EntryView = memo(function EntryView({ importInput, message, onImportClick, onLoad, onSetup }: EntryViewProps) {
  return (
    <div className="overview-stack">
      <section className="overview-block">
        <div className="overview-block__header">
          <strong>Daily Schedule</strong>
          <span>Pilih cara mulai sebelum masuk ke schedule utama.</span>
        </div>
        <div className="farming-choice-grid">
          <button type="button" className="mobile-menu__card" onClick={onLoad}>
            <small>Local storage</small>
            <strong>Load Data</strong>
          </button>
          <button type="button" className="mobile-menu__card" onClick={onImportClick}>
            <small>Upload</small>
            <strong>Import Data</strong>
          </button>
          <button type="button" className="mobile-menu__card" onClick={onSetup}>
            <small>Manual atau pack</small>
            <strong>Pilih Kebutuhan</strong>
          </button>
        </div>
        {message && <p className="farming-hint">{message}</p>}
        {importInput}
      </section>
    </div>
  )
})

type ManualSetupProps = {
  availableColors: ResourceColor[]
  availableLevels: string[]
  selectedColor: ResourceColor
  selectedRewardAmount: number
  selectedStamina: number
  selection: ManualSelection
  onGenerate: () => void
  onSelectionChange: (selection: Partial<ManualSelection>) => void
}

const ManualSetup = memo(function ManualSetup({
  availableColors,
  availableLevels,
  selectedColor,
  selectedRewardAmount,
  selectedStamina,
  selection,
  onGenerate,
  onSelectionChange,
}: ManualSetupProps) {
  return (
    <section className="overview-block">
      <div className="overview-block__header">
        <strong>Manual Setup</strong>
        <span>Data source mengikuti farming-rewards.json.</span>
      </div>
      <div className="control-grid">
        <label className="field">
          Farm level
          <select value={selection.farmLevel} onChange={(event) => onSelectionChange({ farmLevel: event.target.value })}>
            {availableLevels.map((availableLevel) => (
              <option key={availableLevel} value={availableLevel}>Level {availableLevel}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Material
          <select value={selection.category} onChange={(event) => onSelectionChange({ category: event.target.value as FarmingCategory })}>
            {(Object.keys(categoryLabels) as FarmingCategory[]).map((materialCategory) => (
              <option key={materialCategory} value={materialCategory}>{categoryLabels[materialCategory]}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Rarity
          <select value={selectedColor} onChange={(event) => onSelectionChange({ color: event.target.value as ResourceColor })}>
            {availableColors.map((availableColor) => (
              <option key={availableColor} value={availableColor}>{availableColor}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Target
          <input value={selection.target} min={0} type="number" onChange={(event) => onSelectionChange({ target: normalizeAmount(event.target.value, 0) })} />
        </label>
        <div className="farming-actions">
          <button type="button" className="mini-tab is-active" onClick={onGenerate}>
            Generate Schedule
          </button>
        </div>
      </div>
      <p className="farming-hint">
        Source: {categoryLabels[selection.category]} stage {selection.farmLevel}, {selectedStamina} stamina, reward rata-rata {selectedRewardAmount} {selectedColor}.
      </p>
    </section>
  )
})

type CharacterPackSetupProps = {
  characterState: CharacterState
  farmLevel: string
  farmLevels: string[]
  selectedCharacterId: string | null
  skillState: SkillState
  weaponState: WeaponState
  onCharacterChange: React.Dispatch<React.SetStateAction<CharacterState>>
  onFarmLevelChange: (farmLevel: string) => void
  onGenerate: () => void
  onSelectCharacter: (characterId: string) => void
  onSkillChange: React.Dispatch<React.SetStateAction<SkillState>>
  onWeaponChange: React.Dispatch<React.SetStateAction<WeaponState>>
}

const CharacterPackSetup = memo(function CharacterPackSetup({
  characterState,
  farmLevel,
  farmLevels,
  selectedCharacterId,
  skillState,
  weaponState,
  onCharacterChange,
  onFarmLevelChange,
  onGenerate,
  onSelectCharacter,
  onSkillChange,
  onWeaponChange,
}: CharacterPackSetupProps) {
  return (
    <section className="overview-block">
      <div className="overview-block__header">
        <strong>Character Pack</strong>
        <span>Pilih character, isi kebutuhan seperti Total Planner, lalu generate schedule.</span>
      </div>
      <div className="farming-choice-grid">
        {characterPack.characters.map((character) => (
          <button key={character.id} type="button" className="mobile-menu__card" onClick={() => onSelectCharacter(character.id)}>
            <small>{character.description}</small>
            <strong>{character.name}</strong>
          </button>
        ))}
      </div>
      {selectedCharacterId && (
        <>
          <div className="control-grid">
            <label className="field">
              Farm level
              <select value={farmLevel} onChange={(event) => onFarmLevelChange(event.target.value)}>
                {farmLevels.map((level) => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="farming-actions">
            <button type="button" className="mini-tab is-active" onClick={onGenerate}>
              Generate Schedule
            </button>
          </div>
          <div className="overview-stack">
            <CharacterPlannerInputs state={characterState} onChange={onCharacterChange} />
            <WeaponPlannerInputs state={weaponState} onChange={onWeaponChange} />
            <SkillPlannerInputs state={skillState} onChange={onSkillChange} />
          </div>
        </>
      )}
    </section>
  )
})

type CharacterPlannerInputsProps = {
  state: CharacterState
  onChange: React.Dispatch<React.SetStateAction<CharacterState>>
}

const CharacterPlannerInputs = memo(function CharacterPlannerInputs({ state, onChange }: CharacterPlannerInputsProps) {
  return (
    <section className="overview-block">
      <div className="overview-block__header">
        <strong>Character input</strong>
        <span>Input sama seperti Character di Total Planner.</span>
      </div>
      <div className="control-grid">
        <SelectField label="Current level" value={state.current} options={levelMilestones.slice(0, -1)} onChange={(value) => onChange((prev) => ({ ...prev, current: Number(value) }))} />
        <SelectField label="Target level" value={state.target} options={levelMilestones.slice(1)} onChange={(value) => onChange((prev) => ({ ...prev, target: Number(value) }))} />
      </div>
      <div className="token-grid">
        <PillInput label="Green books" color="green" value={state.ownedBooks.green} onChange={(value) => onChange((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, green: value } }))} />
        <PillInput label="Blue books" color="blue" value={state.ownedBooks.blue} onChange={(value) => onChange((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, blue: value } }))} />
        <PillInput label="Purple books" color="purple" value={state.ownedBooks.purple} onChange={(value) => onChange((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, purple: value } }))} />
        <PillInput label="Yellow books" color="yellow" value={state.ownedBooks.yellow} onChange={(value) => onChange((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, yellow: value } }))} />
        <PillInput label="Green essence" color="green" value={state.ownedEssences.green} onChange={(value) => onChange((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, green: value } }))} />
        <PillInput label="Blue essence" color="blue" value={state.ownedEssences.blue} onChange={(value) => onChange((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, blue: value } }))} />
        <PillInput label="Purple essence" color="purple" value={state.ownedEssences.purple} onChange={(value) => onChange((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, purple: value } }))} />
      </div>
    </section>
  )
})

type WeaponPlannerInputsProps = {
  state: WeaponState
  onChange: React.Dispatch<React.SetStateAction<WeaponState>>
}

const WeaponPlannerInputs = memo(function WeaponPlannerInputs({ state, onChange }: WeaponPlannerInputsProps) {
  return (
    <section className="overview-block">
      <div className="overview-block__header">
        <strong>Weapon input</strong>
        <span>Input sama seperti Weapon di Total Planner.</span>
      </div>
      <div className="control-grid">
        <SelectField label="Current level" value={state.current} options={levelMilestones.slice(0, -1)} onChange={(value) => onChange((prev) => ({ ...prev, current: Number(value) }))} />
        <SelectField label="Target level" value={state.target} options={levelMilestones.slice(1)} onChange={(value) => onChange((prev) => ({ ...prev, target: Number(value) }))} />
      </div>
      <div className="token-grid">
        <PillInput label="Green tamahagane" color="green" value={state.ownedTamahagane.green} onChange={(value) => onChange((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, green: value } }))} />
        <PillInput label="Blue tamahagane" color="blue" value={state.ownedTamahagane.blue} onChange={(value) => onChange((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, blue: value } }))} />
        <PillInput label="Purple tamahagane" color="purple" value={state.ownedTamahagane.purple} onChange={(value) => onChange((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, purple: value } }))} />
        <PillInput label="Yellow tamahagane" color="yellow" value={state.ownedTamahagane.yellow} onChange={(value) => onChange((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, yellow: value } }))} />
        <PillInput label="Green hammer" color="green" value={state.ownedHammers.green} onChange={(value) => onChange((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, green: value } }))} />
        <PillInput label="Blue hammer" color="blue" value={state.ownedHammers.blue} onChange={(value) => onChange((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, blue: value } }))} />
        <PillInput label="Purple hammer" color="purple" value={state.ownedHammers.purple} onChange={(value) => onChange((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, purple: value } }))} />
      </div>
    </section>
  )
})

type SkillPlannerInputsProps = {
  state: SkillState
  onChange: React.Dispatch<React.SetStateAction<SkillState>>
}

const SkillPlannerInputs = memo(function SkillPlannerInputs({ state, onChange }: SkillPlannerInputsProps) {
  return (
    <section className="overview-block">
      <div className="overview-block__header">
        <strong>Skill input</strong>
        <span>Input sama seperti Skill di Total Planner.</span>
      </div>
      <div className="control-grid">
        <SelectField label="Current level" value={state.current} options={skillLevels.slice(0, -1)} onChange={(value) => onChange((prev) => ({ ...prev, current: Number(value) }))} />
        <SelectField label="Target level" value={state.target} options={skillLevels.slice(1)} onChange={(value) => onChange((prev) => ({ ...prev, target: Number(value) }))} />
      </div>
      <div className="toggle-grid">
        {skillTypes.map((type) => {
          const isActive = state.selectedTypes.includes(type)
          return (
            <button key={type} type="button" className={`toggle-card ${isActive ? 'is-active' : ''}`} onClick={() => onChange((prev) => ({ ...prev, selectedTypes: isActive ? prev.selectedTypes.filter((item) => item !== type) : [...prev.selectedTypes, type] }))}>
              {type}
            </button>
          )
        })}
      </div>
      <div className="token-grid">
        <PillInput label="Green art" color="green" value={state.ownedArts.green} onChange={(value) => onChange((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, green: value } }))} />
        <PillInput label="Blue art" color="blue" value={state.ownedArts.blue} onChange={(value) => onChange((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, blue: value } }))} />
        <PillInput label="Purple art" color="purple" value={state.ownedArts.purple} onChange={(value) => onChange((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, purple: value } }))} />
        <PillInput label="Omamori owned" color="yellow" value={state.ownedOmamori} onChange={(value) => onChange((prev) => ({ ...prev, ownedOmamori: value }))} />
      </div>
      <div className="passive-grid">
        {(['passive1', 'passive2', 'passive3'] as const).map((passiveKey, index) => (
          <article key={passiveKey} className="passive-card">
            <div className="passive-card__header">
              <p className="section-tag">Passive {index + 1}</p>
              <strong>{`Boost ${index + 1}`}</strong>
            </div>
            <div className="control-grid passive-card__controls">
              <SelectField label="Current" value={state.passiveLevels[passiveKey].current} options={[0, 1, 2, 3]} onChange={(value) => onChange((prev) => ({ ...prev, passiveLevels: { ...prev.passiveLevels, [passiveKey]: { ...prev.passiveLevels[passiveKey], current: Number(value) } } }))} />
              <SelectField label="Target" value={state.passiveLevels[passiveKey].target} options={[1, 2, 3]} onChange={(value) => onChange((prev) => ({ ...prev, passiveLevels: { ...prev.passiveLevels, [passiveKey]: { ...prev.passiveLevels[passiveKey], target: Number(value) } } }))} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
})

type SetupViewProps = {
  availableColors: ResourceColor[]
  availableLevels: string[]
  characterFarmLevel: string
  manualSelection: ManualSelection
  selectedCharacterId: string | null
  selectedColor: ResourceColor
  selectedRewardAmount: number
  selectedStamina: number
  setupMode: SetupMode
  characterState: CharacterState
  skillState: SkillState
  weaponState: WeaponState
  onBack: () => void
  onCharacterChange: React.Dispatch<React.SetStateAction<CharacterState>>
  onCharacterFarmLevelChange: (farmLevel: string) => void
  onGenerateCharacterPack: () => void
  onGenerateManual: () => void
  onManualSelectionChange: (selection: Partial<ManualSelection>) => void
  onSelectCharacter: (characterId: string) => void
  onSetupModeChange: (mode: SetupMode) => void
  onSkillChange: React.Dispatch<React.SetStateAction<SkillState>>
  onWeaponChange: React.Dispatch<React.SetStateAction<WeaponState>>
}

const SetupView = memo(function SetupView(props: SetupViewProps) {
  return (
    <div className="overview-stack">
      <section className="overview-block">
        <div className="overview-block__header">
          <strong>Pilih Kebutuhan</strong>
          <span>Setup manual atau generate otomatis dari Character Pack.</span>
        </div>
        <div className="farming-toolbar">
          <button type="button" className={`mini-tab ${props.setupMode === 'manual' ? 'is-active' : ''}`} onClick={() => props.onSetupModeChange('manual')}>
            Manual Setup
          </button>
          <button type="button" className={`mini-tab ${props.setupMode === 'character-pack' ? 'is-active' : ''}`} onClick={() => props.onSetupModeChange('character-pack')}>
            Character Pack
          </button>
          <button type="button" className="mini-tab" onClick={props.onBack}>
            Back
          </button>
        </div>
      </section>

      {props.setupMode === 'manual' ? (
        <ManualSetup
          availableColors={props.availableColors}
          availableLevels={props.availableLevels}
          selectedColor={props.selectedColor}
          selectedRewardAmount={props.selectedRewardAmount}
          selectedStamina={props.selectedStamina}
          selection={props.manualSelection}
          onGenerate={props.onGenerateManual}
          onSelectionChange={props.onManualSelectionChange}
        />
      ) : (
        <CharacterPackSetup
          characterState={props.characterState}
          farmLevel={props.characterFarmLevel}
          farmLevels={props.availableLevels}
          selectedCharacterId={props.selectedCharacterId}
          skillState={props.skillState}
          weaponState={props.weaponState}
          onCharacterChange={props.onCharacterChange}
          onFarmLevelChange={props.onCharacterFarmLevelChange}
          onGenerate={props.onGenerateCharacterPack}
          onSelectCharacter={props.onSelectCharacter}
          onSkillChange={props.onSkillChange}
          onWeaponChange={props.onWeaponChange}
        />
      )}
    </div>
  )
})

type ScheduleViewProps = {
  exportResult: ExportResult
  importInput: React.ReactNode
  message: string
  schedule: ScheduleItem[]
  onCloseExportResult: () => void
  onEntry: () => void
  onExport: () => void
  onImportClick: () => void
  onLoad: () => void
  onRemove: (id: string) => void
  onReset: () => void
  onSave: () => void
  onSetup: () => void
  onTargetEdit: (id: string) => void
  onUpdateProgress: (id: string, amount: number, includeStageRewards?: boolean) => void
  onShareExport: () => void
}

const ScheduleView = memo(function ScheduleView({
  exportResult,
  importInput,
  message,
  schedule,
  onCloseExportResult,
  onEntry,
  onExport,
  onImportClick,
  onLoad,
  onRemove,
  onReset,
  onSave,
  onSetup,
  onTargetEdit,
  onUpdateProgress,
  onShareExport,
}: ScheduleViewProps) {
  return (
    <div className="overview-stack">
      <section className="overview-block">
        <div className="overview-block__header">
          <strong>Daily progress</strong>
          <span>Progress tidak reset otomatis. Save untuk persist ke local storage.</span>
        </div>
        <div className="farming-toolbar">
          <button type="button" className="mini-tab" onClick={onEntry}>Entry</button>
          <button type="button" className="mini-tab" onClick={onSetup}>Tambah Kebutuhan</button>
          <button type="button" className="mini-tab" onClick={onReset}>Reset</button>
          <button type="button" className="mini-tab" onClick={onSave}>Save</button>
          <button type="button" className="mini-tab" onClick={onLoad}>Load</button>
          <button type="button" className="mini-tab" onClick={onExport}>Export</button>
          <button type="button" className="mini-tab" onClick={onImportClick}>Import</button>
          {importInput}
        </div>
        {message && <p className="farming-hint">{message}</p>}
        {exportResult && (
          <div className="farming-export-actions" role="status">
            <div>
              <strong>File disimpan di internal</strong>
              <span>{exportResult.fileName}</span>
            </div>
            <div className="farming-actions">
              <button type="button" className="mini-tab is-active" onClick={onShareExport}>Share</button>
              <button type="button" className="mini-tab" onClick={onCloseExportResult}>OK</button>
            </div>
          </div>
        )}
        <div className="farming-list">
          {schedule.length === 0 && <div className="coming-soon">Belum ada target farming.</div>}
          {schedule.map((item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              onRemove={onRemove}
              onTargetEdit={onTargetEdit}
              onUpdateProgress={onUpdateProgress}
            />
          ))}
        </div>
      </section>
    </div>
  )
})

type ScheduleCardProps = {
  item: ScheduleItem
  onRemove: (id: string) => void
  onTargetEdit: (id: string) => void
  onUpdateProgress: (id: string, amount: number, includeStageRewards?: boolean) => void
}

const ScheduleCard = memo(function ScheduleCard({ item, onRemove, onTargetEdit, onUpdateProgress }: ScheduleCardProps) {
  const progressPercent = item.target === 0 ? 100 : Math.min(100, Math.round((item.progress / item.target) * 100))
  const farmRewardAmount = getFarmRewardAmount(item)
  const canAddProgress = canUseFarmAddButton(item)
  const progressUnitLabel = item.progressUnit === 'farm' ? ' farm' : ''

  return (
    <article className="farming-card">
      <div className="farming-card__header">
        <div>
          <strong>{item.name}</strong>
          <span>{item.source}</span>
        </div>
        <button type="button" className="mini-tab" onClick={() => onRemove(item.id)}>Hapus</button>
      </div>
      <div className="farming-progress" aria-label={`${item.name} progress ${progressPercent}%`}>
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="farming-card__footer">
        <span>{formatProgressAmount(item.progress)} / {item.target}{progressUnitLabel}</span>
        {canAddProgress && (
          <>
            <button type="button" className="mini-tab" onClick={() => onUpdateProgress(item.id, 1)}>+1</button>
            {item.progressUnit !== 'farm' && (
              <button type="button" className="mini-tab" onClick={() => onUpdateProgress(item.id, farmRewardAmount, true)}>+Custom ({farmRewardAmount})</button>
            )}
          </>
        )}
        <button type="button" className="mini-tab" onClick={() => onTargetEdit(item.id)}>Edit target</button>
      </div>
    </article>
  )
})

export function DailyScheduleContent() {
  const [view, setView] = useState<DailyView>('entry')
  const [setupMode, setSetupMode] = useState<SetupMode>('manual')
  const [manualSelection, setManualSelection] = useState<ManualSelection>({
    category: 'book',
    color: 'yellow',
    farmLevel: '6',
    target: 20,
  })
  const [characterFarmLevel, setCharacterFarmLevel] = useState('6')
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [packCharacterState, setPackCharacterState] = useState(totalPlannerCharacterPreset)
  const [packWeaponState, setPackWeaponState] = useState(totalPlannerWeaponPreset)
  const [packSkillState, setPackSkillState] = useState(totalPlannerSkillPreset)
  const [message, setMessage] = useState('')
  const [exportResult, setExportResult] = useState<ExportResult>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const packCharacterResult = useCharacterCalculator(packCharacterState)
  const packWeaponResult = useWeaponCalculator(packWeaponState)
  const packSkillResult = useSkillCalculator(packSkillState)

  const availableLevels = useMemo(() => Object.keys(farmingRewards[manualSelection.category]), [manualSelection.category])
  const selectedReward = farmingRewards[manualSelection.category][manualSelection.farmLevel as FarmingLevel] ?? farmingRewards[manualSelection.category][availableLevels[0] as FarmingLevel]
  const availableColors = useMemo(
    () => resourceColors.filter((resourceColor) => selectedReward[resourceColor] > 0),
    [selectedReward],
  )
  const selectedColor = availableColors.includes(manualSelection.color) ? manualSelection.color : availableColors[0] ?? 'green'
  const selectedRewardAmount = selectedReward[selectedColor] ?? 0

  useEffect(() => {
    setManualSelection((current) => {
      const nextLevel = availableLevels.includes(current.farmLevel) ? current.farmLevel : availableLevels[0] ?? '1'
      const nextColor = availableColors.includes(current.color) ? current.color : availableColors[0] ?? 'green'
      if (nextLevel === current.farmLevel && nextColor === current.color) return current
      return { ...current, color: nextColor, farmLevel: nextLevel }
    })
  }, [availableColors, availableLevels])

  const openImportDialog = useCallback(() => importInputRef.current?.click(), [])
  const goToEntry = useCallback(() => setView('entry'), [])
  const goToSetup = useCallback(() => setView('setup'), [])

  const saveSchedule = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredSchedule(schedule)))
      setMessage('Schedule saved.')
    } catch {
      setMessage('Save failed. Storage is not available.')
    }
  }, [schedule])

  const loadFromStorage = useCallback(() => {
    const savedSchedule = readSavedSchedule()
    setSchedule(savedSchedule)
    setView('schedule')
    setMessage(savedSchedule.length > 0 ? 'Schedule loaded.' : 'Tidak ada data tersimpan.')
  }, [])

  const importSchedule = useCallback(async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<StoredSchedule>
      setSchedule(sanitizeImportedSchedule(parsed.schedule))
      setView('schedule')
      setMessage('Schedule imported.')
    } catch {
      setMessage('Import failed. File must contain valid schedule JSON.')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }, [])

  const importInput = (
    <input
      ref={importInputRef}
      className="visually-hidden"
      type="file"
      accept=".json,application/json"
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) void importSchedule(file)
      }}
    />
  )

  const exportSchedule = useCallback(async () => {
    try {
      const data = JSON.stringify(createStoredSchedule(schedule), null, 2)

      if (Capacitor.isNativePlatform()) {
        const fileName = `schedule-${Date.now()}.json`
        await Filesystem.writeFile({
          path: fileName,
          data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        })
        setExportResult({ data, fileName })
        setMessage('File disimpan di internal.')
        return
      }

      const blob = new Blob([data], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      try {
        const link = document.createElement('a')
        link.href = url
        link.download = 'schedule.json'
        link.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch {
      window.alert('Export failed.')
    }
  }, [schedule])

  const shareExport = useCallback(async () => {
    if (!exportResult) return

    const file = new File([exportResult.data], exportResult.fileName, { type: 'application/json' })
    const sharePayload: ShareData = {
      files: [file],
      title: 'Daily Schedule',
      text: 'BSR Daily Schedule export',
    }

    try {
      if (navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload)
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Daily Schedule',
          text: exportResult.data,
        })
        return
      }

      setMessage('Share tidak didukung di perangkat ini.')
    } catch {
      setMessage('Share dibatalkan atau gagal.')
    }
  }, [exportResult])

  const generateManualSchedule = useCallback(() => {
    const item = createScheduleItem(manualSelection.category, manualSelection.farmLevel, selectedColor, manualSelection.target, 0)
    setSchedule((current) => mergeSchedule(current, [item]))
    setView('schedule')
    setMessage('Target added.')
  }, [manualSelection.category, manualSelection.farmLevel, manualSelection.target, selectedColor])

  const updateProgress = useCallback((id: string, amount: number, includeStageRewards = false) => {
    let isCompleted = false

    setSchedule((current) => {
      const { didApply, nextSchedule } = applyProgressWithOverflow(current, id, amount, includeStageRewards)
      isCompleted = !didApply
      return nextSchedule
    })

    if (isCompleted) {
      window.alert('Farm item ini sudah selesai.')
    }
  }, [])

  const editTarget = useCallback((id: string) => {
    const nextTarget = window.prompt('Target baru?')
    if (nextTarget === null) return
    setSchedule((current) =>
      current.map((item) => (item.id === id ? { ...item, target: normalizeAmount(nextTarget, item.target) } : item)),
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setSchedule((current) => current.filter((item) => item.id !== id))
  }, [])

  const resetSchedule = useCallback(() => {
    setSchedule([])
    setMessage('Schedule reset. Press Save to persist this reset.')
  }, [])

  const selectCharacterPack = useCallback((characterId: string) => {
    const character = characterPack.characters.find((entry) => entry.id === characterId)
    if (character) setSelectedCharacterId(characterId)
  }, [])

  const generateCharacterPack = useCallback(() => {
    const character = characterPack.characters.find((entry) => entry.id === selectedCharacterId)
    if (!character) return

    const expFarmItems = [
      createExpFarmScheduleItem('book', characterFarmLevel, packCharacterResult.missingExp),
      createExpFarmScheduleItem('tamahagane', characterFarmLevel, packWeaponResult.missingExp),
    ].filter((item): item is ScheduleItem => item !== null)

    const generatedItems: ScheduleItem[] = [
      ...expFarmItems,
      ...getPositiveItems(packCharacterResult.essenceNeeded, threeStarColors, (color, amount) => createScheduleItem('essence', characterFarmLevel, color, amount)),
      ...getPositiveItems(packWeaponResult.hammerNeeded, threeStarColors, (color, amount) => createScheduleItem('hammer', characterFarmLevel, color, amount)),
      ...getPositiveItems(packSkillResult.needed, threeStarColors, (color, amount) => createScheduleItem('art', characterFarmLevel, color, amount)),
      ...(packSkillResult.passiveMissingOmamori > 0 ? [createScheduleItem('omamori', characterFarmLevel, 'yellow', packSkillResult.passiveMissingOmamori)] : []),
    ]

    setSchedule((current) => mergeSchedule(current, generatedItems))
    setView('schedule')
    setMessage(`${character.name} pack generated.`)
  }, [
    packCharacterResult.essenceNeeded,
    packCharacterResult.missingExp,
    packSkillResult.needed,
    packSkillResult.passiveMissingOmamori,
    packWeaponResult.hammerNeeded,
    packWeaponResult.missingExp,
    selectedCharacterId,
    characterFarmLevel,
  ])

  switch (view) {
    case 'entry':
      return (
        <EntryView
          importInput={importInput}
          message={message}
          onImportClick={openImportDialog}
          onLoad={loadFromStorage}
          onSetup={goToSetup}
        />
      )
    case 'setup':
      return (
        <SetupView
          availableColors={availableColors}
          availableLevels={availableLevels}
          characterFarmLevel={characterFarmLevel}
          manualSelection={manualSelection}
          selectedCharacterId={selectedCharacterId}
          selectedColor={selectedColor}
          selectedRewardAmount={selectedRewardAmount}
          selectedStamina={selectedReward.stamina}
          setupMode={setupMode}
          characterState={packCharacterState}
          skillState={packSkillState}
          weaponState={packWeaponState}
          onBack={goToEntry}
          onCharacterChange={setPackCharacterState}
          onCharacterFarmLevelChange={setCharacterFarmLevel}
          onGenerateCharacterPack={generateCharacterPack}
          onGenerateManual={generateManualSchedule}
          onManualSelectionChange={(selection) => setManualSelection((current) => ({ ...current, ...selection }))}
          onSelectCharacter={selectCharacterPack}
          onSetupModeChange={setSetupMode}
          onSkillChange={setPackSkillState}
          onWeaponChange={setPackWeaponState}
        />
      )
    case 'schedule':
      return (
        <ScheduleView
          exportResult={exportResult}
          importInput={importInput}
          message={message}
          schedule={schedule}
          onCloseExportResult={() => setExportResult(null)}
          onEntry={goToEntry}
          onExport={exportSchedule}
          onImportClick={openImportDialog}
          onLoad={loadFromStorage}
          onRemove={removeItem}
          onReset={resetSchedule}
          onSave={saveSchedule}
          onSetup={goToSetup}
          onTargetEdit={editTarget}
          onUpdateProgress={updateProgress}
          onShareExport={shareExport}
        />
      )
  }
}
