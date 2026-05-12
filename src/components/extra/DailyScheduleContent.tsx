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
import { formatNumber } from '../../utils/formatter'
import { PillInput } from '../common/PillInput'
import { StatCard } from '../common/StatCard'
import { SelectField } from '../common/SelectField'

type FarmingCategory = keyof typeof farmingRewards
type FarmingLevel = keyof (typeof farmingRewards)[FarmingCategory]
type FarmingRewardRow = { green: number; blue: number; purple: number; yellow: number; stamina: number }
type FarmingRewardTable = Record<string, FarmingRewardRow>
type KansRewardTable = Record<string, number>
type DailyView = 'entry' | 'setup' | 'schedule'
type SetupMode = 'manual' | 'character-pack'

type ScheduleItem = {
  category: FarmingCategory
  color: ResourceColor
  farmLevel: string
  id: string
  name: string
  progressUnit?: 'item' | 'value' | 'farm'
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
const autoConvertCategories: FarmingCategory[] = ['art', 'essence', 'hammer']
const skillTypes = ['basic', 'skill', 'counter', 'ultimate']

const categoryLabels: Record<FarmingCategory, string> = {
  art: 'Art',
  book: 'Book',
  essence: 'Essence',
  kans: 'Kans',
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

function isAutoConvertCategory(category: FarmingCategory) {
  return autoConvertCategories.includes(category)
}

function toGreenEquivalent(values: Partial<Record<ResourceColor, number>>) {
  return (values.green ?? 0) + (values.blue ?? 0) * 3 + (values.purple ?? 0) * 9
}

function getGreenEquivalentReward(category: FarmingCategory, farmLevel: string) {
  const reward = farmingRewards[category]
  if (typeof reward !== 'object' || reward === null) return 0
  const row = (reward as FarmingRewardTable)[farmLevel]
  return row ? toGreenEquivalent(row) : 0
}

function createScheduleItem(category: FarmingCategory, farmLevel: string, color: ResourceColor, target: number, progress = 0): ScheduleItem {
  const reward = farmingRewards[category]
  if ((category as string) === 'kans') {
    const kansPerFarm = (farmingRewards.kans as unknown as KansRewardTable)[farmLevel] ?? 0
    return {
      category,
      color: 'green',
      farmLevel,
      id: createItemId(category, farmLevel, 'green'),
      name: 'Kans value',
      progressUnit: 'value',
      source: `Kans stage ${farmLevel} (${kansPerFarm} kans/farm)`,
      target,
      progress,
    }
  }
  const row = typeof reward === 'object' && reward !== null ? (reward as FarmingRewardTable)[farmLevel] : undefined
  if (!row) {
    return {
      category,
      color,
      farmLevel,
      id: createItemId(category, farmLevel, color),
      name: `${categoryLabels[category]} value`,
      progressUnit: 'value',
      source: `${categoryLabels[category]} stage ${farmLevel}`,
      target,
      progress,
    }
  }
  const normalizedColor = isAutoConvertCategory(category) ? 'green' : color
  const rewardAmount = isAutoConvertCategory(category) ? getGreenEquivalentReward(category, farmLevel) : (row[normalizedColor] ?? 0)
  const normalizedTarget = isAutoConvertCategory(category) ? toGreenEquivalent({ [color]: target }) : target
  const normalizedProgress = isAutoConvertCategory(category) ? toGreenEquivalent({ [color]: progress }) : progress
  const isKans = category === 'kans'

  return {
    category,
    color: normalizedColor,
    farmLevel,
    id: createItemId(category, farmLevel, normalizedColor),
    name: isKans || isAutoConvertCategory(category) ? `${categoryLabels[category]} value` : `${normalizedColor} ${categoryLabels[category]}`,
    progressUnit: isKans || isAutoConvertCategory(category) ? 'value' : 'item',
    source: `${categoryLabels[category]} stage ${farmLevel} (${row.stamina} stamina, avg ${rewardAmount}${isKans || isAutoConvertCategory(category) ? ' value' : ''})`,
    target: normalizedTarget,
    progress: normalizedProgress,
  }
}

function calculateRewardExp(category: 'book' | 'tamahagane', farmLevel: string) {
  const reward = (farmingRewards[category] as FarmingRewardTable)[farmLevel]
  const values = category === 'book' ? defaultSettings.books : defaultSettings.weapon.tamahaganeExp

  return resourceColors.reduce((total, color) => total + (reward?.[color] ?? 0) * values[color], 0)
}

function getRewardSummary(category: FarmingCategory, farmLevel: string, color: ResourceColor) {
  if (category === 'book' || category === 'tamahagane') {
    return {
      amount: calculateRewardExp(category, farmLevel),
      unit: 'EXP/farm',
    }
  }

  if (category === 'kans') {
    return {
      amount: (farmingRewards.kans as unknown as KansRewardTable)[farmLevel] ?? 0,
      unit: 'kans/farm',
    }
  }

  const reward = (farmingRewards[category] as unknown as FarmingRewardTable)[farmLevel]
  return {
    amount: reward?.[color] ?? 0,
    unit: color,
  }
}

function createExpFarmScheduleItem(category: 'book' | 'tamahagane', farmLevel: string, missingExp: number): ScheduleItem | null {
  const reward = (farmingRewards[category] as unknown as FarmingRewardTable)[farmLevel]
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

function createKansScheduleItem(farmLevel: string, missingKans: number): ScheduleItem | null {
  const kansPerFarm = (farmingRewards.kans as unknown as KansRewardTable)[farmLevel] ?? 0
  if (missingKans <= 0 || kansPerFarm <= 0) return null

  return {
    category: 'kans',
    color: 'green',
    farmLevel,
    id: createItemId('kans', farmLevel, 'green'),
    name: 'Kans value',
    progressUnit: 'value',
    source: `Kans stage ${farmLevel} (${kansPerFarm} kans/farm)`,
    target: missingKans,
    progress: 0,
  }
}

function parseScheduleItemId(id: string) {
  const [category, farmLevel, color] = id.split('_') as [FarmingCategory | undefined, string | undefined, ResourceColor | undefined]
  const reward = category ? farmingRewards[category] : null
  if (!category || !farmLevel || !color) return null
  if (category === 'kans') return (farmingRewards.kans as unknown as KansRewardTable)[farmLevel] !== undefined ? { category, color, farmLevel } : null
  if (typeof reward !== 'object' || reward === null || !(farmLevel in reward)) return null
  return { category, color, farmLevel }
}

function getFarmRewardAmount(item: ScheduleItem) {
  if (item.progressUnit === 'farm') return 1
  if (item.category === 'kans') return (farmingRewards.kans as unknown as KansRewardTable)[item.farmLevel] ?? 0
  if (isAutoConvertCategory(item.category)) return getGreenEquivalentReward(item.category, item.farmLevel)

  const reward = (farmingRewards[item.category] as unknown as FarmingRewardTable | undefined)?.[item.farmLevel]
  return reward?.[item.color] ?? 0
}

function canUseFarmAddButton(item: ScheduleItem) {
  if (item.progressUnit === 'farm') return true
  return getFarmRewardAmount(item) > 0
}

function applyProgress(schedule: ScheduleItem[], id: string, amount: number, includeStageRewards = false) {
  const sourceItem = schedule.find((item) => item.id === id)
  if (!sourceItem) return { didApply: false, nextSchedule: schedule }

  const progressAmount = includeStageRewards && isAutoConvertCategory(sourceItem.category)
    ? getGreenEquivalentReward(sourceItem.category, sourceItem.farmLevel)
    : amount

  return {
    didApply: sourceItem.progress < sourceItem.target && progressAmount > 0,
    nextSchedule: schedule.map((item) =>
      item.id === id ? { ...item, progress: Math.min(item.target, item.progress + progressAmount) } : item,
    ),
  }
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

  const sanitized: ScheduleItem[] = schedule.map((rawItem) => {
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
      category: 'book' as FarmingCategory,
      color: 'yellow' as ResourceColor,
      farmLevel: '6',
      id: String(item.id),
      name: String(item.name),
      source: String(item.source),
      target: normalizeAmount(String(item.target), 0),
      progress: normalizeAmount(String(item.progress), 0),
    }
  })

  return sanitized.reduce<ScheduleItem[]>((merged, item) => {
    const existingItem = merged.find((entry) => entry.id === item.id)
    if (!existingItem) return [...merged, item]

    return merged.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            name: item.name,
            source: item.source,
            target: entry.target + item.target,
            progress: entry.progress + item.progress,
          }
        : entry,
    )
  }, [])
}

function createGreenValueScheduleItem(category: 'art' | 'essence' | 'hammer', farmLevel: string, target: number) {
  return target > 0 ? createScheduleItem(category, farmLevel, 'green', target) : null
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
  selectedRewardUnit: string
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
  selectedRewardUnit,
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
        Source: {categoryLabels[selection.category]} stage {selection.farmLevel}, {selectedStamina} stamina, reward rata-rata {selectedRewardAmount} {selectedRewardUnit}.
      </p>
    </section>
  )
})

type CharacterPackSetupProps = {
  characterState: CharacterState
  farmLevel: string
  farmLevels: string[]
  kansOwned: number
  totalKansNeeded: number
  selectedCharacterId: string | null
  skillState: SkillState
  weaponState: WeaponState
  onCharacterChange: React.Dispatch<React.SetStateAction<CharacterState>>
  onFarmLevelChange: (farmLevel: string) => void
  onGenerate: () => void
  onKansOwnedChange: React.Dispatch<React.SetStateAction<number>>
  onSelectCharacter: (characterId: string) => void
  onSkillChange: React.Dispatch<React.SetStateAction<SkillState>>
  onWeaponChange: React.Dispatch<React.SetStateAction<WeaponState>>
}

const CharacterPackSetup = memo(function CharacterPackSetup({
  characterState,
  farmLevel,
  farmLevels,
  kansOwned,
  totalKansNeeded,
  selectedCharacterId,
  skillState,
  weaponState,
  onCharacterChange,
  onFarmLevelChange,
  onGenerate,
  onKansOwnedChange,
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
            <section className="overview-block">
              <div className="overview-block__header">
                <strong>Kans Calculator</strong>
                <span>Hitung kebutuhan kans dari Character Pack lalu kurangi owned kans.</span>
              </div>
              <div className="overview-inline-stats">
                <StatCard label="Total Kans Needed" value={formatNumber(totalKansNeeded)} />
                <StatCard label="Owned Kans" value={formatNumber(kansOwned)} />
                <StatCard label="Missing Kans" value={formatNumber(Math.max(0, totalKansNeeded - kansOwned))} />
              </div>
              <div className="token-grid">
                <PillInput label="Kans owned" color="yellow" value={kansOwned} onChange={onKansOwnedChange} />
              </div>
              <p className="farming-hint">Formula: total kebutuhan kans dari input pack - kans owned = kans yang masuk schedule.</p>
            </section>
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
  isManualAutoConvertCategory: boolean
  characterFarmLevel: string
  kansOwned: number
  totalKansNeeded: number
  manualSelection: ManualSelection
  selectedCharacterId: string | null
  selectedColor: ResourceColor
  selectedRewardAmount: number
  selectedRewardUnit: string
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
  onKansOwnedChange: React.Dispatch<React.SetStateAction<number>>
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
          selectedRewardUnit={props.selectedRewardUnit}
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
          kansOwned={props.kansOwned}
          totalKansNeeded={props.totalKansNeeded}
          selectedCharacterId={props.selectedCharacterId}
          skillState={props.skillState}
          weaponState={props.weaponState}
          onCharacterChange={props.onCharacterChange}
          onFarmLevelChange={props.onCharacterFarmLevelChange}
          onGenerate={props.onGenerateCharacterPack}
          onKansOwnedChange={props.onKansOwnedChange}
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
  isMobileView: boolean
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
  isMobileView,
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
  const exportDate = new Date().toISOString().split('T')[0]

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
              {isMobileView && <span>Lokasi export: Documents/bsr-calc/Exports/{exportDate}/{exportResult.fileName}</span>}
            </div>
            <div className="farming-actions">
              {!isMobileView && (
                <button type="button" className="mini-tab is-active" onClick={onShareExport}>Share</button>
              )}
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
  const canAddProgress = canUseFarmAddButton(item)
  const progressUnitLabel = item.progressUnit === 'farm' ? ' farm' : ''
  const customRewardAmount = getFarmRewardAmount(item)

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
        <span>{formatNumber(item.progress)} / {formatNumber(item.target)}{progressUnitLabel}</span>
        {canAddProgress && (
          <>
            <button type="button" className="mini-tab" onClick={() => onUpdateProgress(item.id, 1)}>+1</button>
            {item.progressUnit !== 'farm' && (
              <button type="button" className="mini-tab" onClick={() => onUpdateProgress(item.id, customRewardAmount, true)}>+Custom ({formatNumber(customRewardAmount)})</button>
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
  const [isMobileView, setIsMobileView] = useState(false)
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
  const [packKansOwned, setPackKansOwned] = useState(0)
  const [message, setMessage] = useState('')
  const [exportResult, setExportResult] = useState<ExportResult>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const packCharacterResult = useCharacterCalculator(packCharacterState)
  const packWeaponResult = useWeaponCalculator(packWeaponState)
  const packSkillResult = useSkillCalculator(packSkillState)
  const totalKansNeeded = useMemo(
    () => packCharacterResult.levelKans + packCharacterResult.ascensionKans + packWeaponResult.ascension + packSkillResult.totals.kans + packSkillResult.passiveTotalKans,
    [packCharacterResult.ascensionKans, packCharacterResult.levelKans, packSkillResult.passiveTotalKans, packSkillResult.totals.kans, packWeaponResult.ascension],
  )

  const availableLevels = useMemo(() => Object.keys(farmingRewards[manualSelection.category]), [manualSelection.category])
  const selectedFarmLevel = availableLevels.includes(manualSelection.farmLevel) ? manualSelection.farmLevel : availableLevels[0] ?? '1'
  const selectedRewardBase = farmingRewards[manualSelection.category]
  const selectedKansReward = manualSelection.category === 'kans'
    ? (farmingRewards.kans as unknown as KansRewardTable)[selectedFarmLevel] ?? (farmingRewards.kans as unknown as KansRewardTable)[availableLevels[0]] ?? 0
    : 0
  const selectedReward = typeof selectedRewardBase === 'object' && selectedRewardBase !== null
    ? (selectedRewardBase as unknown as FarmingRewardTable)[selectedFarmLevel] ?? (selectedRewardBase as unknown as FarmingRewardTable)[availableLevels[0]]
    : undefined
  const isManualAutoConvertCategory = isAutoConvertCategory(manualSelection.category)
  const availableColors = useMemo<ResourceColor[]>(
    () => manualSelection.category === 'kans'
      ? ['green']
      : isManualAutoConvertCategory
        ? ['green', 'blue', 'purple']
        : resourceColors.filter((resourceColor) => (selectedReward?.[resourceColor] ?? 0) > 0),
    [isManualAutoConvertCategory, selectedReward],
  )
  const selectedColor: ResourceColor = availableColors.includes(manualSelection.color) ? manualSelection.color : availableColors[0] ?? 'green'
  const selectedRewardSummary = manualSelection.category === 'kans'
    ? { amount: selectedKansReward, unit: 'kans/farm' }
    : getRewardSummary(manualSelection.category, selectedFarmLevel, selectedColor)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 960px)')
    const updateMobileView = () => setIsMobileView(mediaQuery.matches)

    updateMobileView()
    mediaQuery.addEventListener('change', updateMobileView)

    return () => mediaQuery.removeEventListener('change', updateMobileView)
  }, [])

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
        const date = new Date().toISOString().split('T')[0]
        const fileName = `schadule-${Date.now()}.json`
        await Filesystem.writeFile({
          path: `bsr-calc/Exports/${date}/${fileName}` ,
          data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
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
    const item = createScheduleItem(manualSelection.category, selectedFarmLevel, selectedColor, manualSelection.target, 0)
    setSchedule((current) => mergeSchedule(current, [item]))
    setView('schedule')
    setMessage('Target added.')
  }, [manualSelection.category, manualSelection.target, selectedColor, selectedFarmLevel])

  const updateProgress = useCallback((id: string, amount: number, includeStageRewards = false) => {
    let isCompleted = false

    setSchedule((current) => {
      const { didApply, nextSchedule } = applyProgress(current, id, amount, includeStageRewards)
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
    const missingKans = Math.max(0, totalKansNeeded - packKansOwned)
    const missingEssenceGreen = Math.max(0, toGreenEquivalent(packCharacterResult.essenceTotal) - toGreenEquivalent(packCharacterState.ownedEssences))
    const missingHammerGreen = Math.max(0, toGreenEquivalent(packWeaponResult.hammerTotal) - toGreenEquivalent(packWeaponState.ownedHammers))
    const missingArtGreen = Math.max(0, toGreenEquivalent(packSkillResult.totals) - toGreenEquivalent(packSkillState.ownedArts))

    const autoConvertItems = [
      createGreenValueScheduleItem('essence', characterFarmLevel, missingEssenceGreen),
      createGreenValueScheduleItem('hammer', characterFarmLevel, missingHammerGreen),
      createGreenValueScheduleItem('art', characterFarmLevel, missingArtGreen),
      createKansScheduleItem(characterFarmLevel, missingKans),
    ].filter((item): item is ScheduleItem => item !== null)

    const generatedItems: ScheduleItem[] = [
      ...expFarmItems,
      ...autoConvertItems,
      ...(packSkillResult.passiveMissingOmamori > 0 ? [createScheduleItem('omamori', characterFarmLevel, 'yellow', packSkillResult.passiveMissingOmamori)] : []),
    ]

    setSchedule((current) => mergeSchedule(current, generatedItems))
    setView('schedule')
    setMessage(`${character.name} pack generated.`)
  }, [
    packCharacterResult.essenceTotal,
    packCharacterResult.missingExp,
    packCharacterResult.levelKans,
    packCharacterResult.ascensionKans,
    packSkillResult.passiveMissingOmamori,
    packSkillResult.passiveTotalKans,
    packSkillResult.totals,
    packCharacterState.ownedEssences,
    packKansOwned,
    totalKansNeeded,
    packSkillState.ownedArts,
    packWeaponResult.hammerTotal,
    packWeaponResult.ascension,
    packWeaponResult.missingExp,
    packWeaponState.ownedHammers,
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
          isManualAutoConvertCategory={isManualAutoConvertCategory}
          kansOwned={packKansOwned}
          totalKansNeeded={totalKansNeeded}
          manualSelection={{ ...manualSelection, color: selectedColor, farmLevel: selectedFarmLevel }}
          selectedCharacterId={selectedCharacterId}
          selectedColor={selectedColor}
          selectedRewardAmount={selectedRewardSummary.amount}
          selectedRewardUnit={selectedRewardSummary.unit}
          selectedStamina={manualSelection.category === 'kans' ? 0 : selectedReward?.stamina ?? 0}
          setupMode={setupMode}
          characterState={packCharacterState}
          skillState={packSkillState}
          weaponState={packWeaponState}
          onBack={goToEntry}
          onCharacterChange={setPackCharacterState}
          onCharacterFarmLevelChange={setCharacterFarmLevel}
          onKansOwnedChange={setPackKansOwned}
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
          isMobileView={isMobileView}
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
