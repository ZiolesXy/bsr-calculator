import { useEffect, useMemo, useRef, useState } from 'react'
import characterPack from '../../data/character-pack.json'
import farmingRewards from '../../data/farming-rewards.json'
import {
  totalPlannerCharacterPreset,
  totalPlannerSkillPreset,
  totalPlannerWeaponPreset,
} from '../../context/AppStateContext'
import { useCharacterCalculator } from '../../hooks/useCharacterCalculator'
import { useSkillCalculator } from '../../hooks/useSkillCalculator'
import { useWeaponCalculator } from '../../hooks/useWeaponCalculator'
import type { ResourceColor } from '../../types'
import { levelMilestones, materialModes, skillLevels } from '../../utils/calculator'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'

type FarmingCategory = keyof typeof farmingRewards
type FarmingLevel = keyof (typeof farmingRewards)[FarmingCategory]
type DailyView = 'entry' | 'setup' | 'schedule'
type SetupMode = 'manual' | 'character-pack'

type ScheduleItem = {
  id: string
  name: string
  source: string
  target: number
  progress: number
}

type StoredSchedule = {
  schedule: ScheduleItem[]
  lastUpdated: string
}

const STORAGE_KEY = 'bsr-daily-farming-schedule'
const resourceColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']

const categoryLabels: Record<FarmingCategory, string> = {
  art: 'Art',
  book: 'Book',
  essence: 'Essence',
  hammer: 'Hammer',
  omamori: 'Omamori',
  tamahagane: 'Tamahagane',
}

function readSavedSchedule(): ScheduleItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<StoredSchedule>
    return Array.isArray(parsed.schedule) ? parsed.schedule : []
  } catch {
    return []
  }
}

function normalizeAmount(value: string, fallback: number) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return fallback
  return Math.max(0, Math.floor(amount))
}

function createItemId(category: FarmingCategory, level: string, color: ResourceColor) {
  return `${category}_${level}_${color}`
}

function createScheduleItem(category: FarmingCategory, level: string, color: ResourceColor, target: number, progress = 0): ScheduleItem {
  const reward = farmingRewards[category][level as FarmingLevel]
  const amount = reward[color] ?? 0
  return {
    id: createItemId(category, level, color),
    name: `${color} ${categoryLabels[category]}`,
    source: `${categoryLabels[category]} stage ${level} (${reward.stamina} stamina, avg ${amount})`,
    target,
    progress,
  }
}

function mergeSchedule(current: ScheduleItem[], incoming: ScheduleItem[]) {
  return incoming.reduce<ScheduleItem[]>((merged, item) => {
    const existing = merged.find((entry) => entry.id === item.id)
    if (!existing) return [...merged, item]
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

export function DailyScheduleContent() {
  const [view, setView] = useState<DailyView>('entry')
  const [setupMode, setSetupMode] = useState<SetupMode>('manual')
  const [level, setLevel] = useState('6')
  const [category, setCategory] = useState<FarmingCategory>('book')
  const [color, setColor] = useState<ResourceColor>('yellow')
  const [target, setTarget] = useState(20)
  const [customProgress, setCustomProgress] = useState(1)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [packCharacterState, setPackCharacterState] = useState(totalPlannerCharacterPreset)
  const [packWeaponState, setPackWeaponState] = useState(totalPlannerWeaponPreset)
  const [packSkillState, setPackSkillState] = useState(totalPlannerSkillPreset)
  const [message, setMessage] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)
  const packCharacterResult = useCharacterCalculator(packCharacterState)
  const packWeaponResult = useWeaponCalculator(packWeaponState)
  const packSkillResult = useSkillCalculator(packSkillState)

  const availableLevels = useMemo(() => Object.keys(farmingRewards[category]), [category])
  const selectedReward = farmingRewards[category][level as FarmingLevel] ?? farmingRewards[category][availableLevels[0] as FarmingLevel]
  const availableColors = resourceColors.filter((resourceColor) => selectedReward[resourceColor] > 0)
  const selectedColor = availableColors.includes(color) ? color : availableColors[0] ?? 'green'
  const selectedRewardAmount = selectedReward[selectedColor] ?? 0
  const selectedStamina = selectedReward.stamina

  useEffect(() => {
    if (!availableLevels.includes(level)) setLevel(availableLevels[0] ?? '1')
  }, [availableLevels, level])

  useEffect(() => {
    if (!availableColors.includes(color) && availableColors[0]) setColor(availableColors[0])
  }, [availableColors, color])

  const saveSchedule = () => {
    const payload: StoredSchedule = { schedule, lastUpdated: new Date().toISOString() }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      setMessage('Schedule saved.')
    } catch {
      setMessage('Save failed. Storage is not available.')
    }
  }

  const loadFromStorage = () => {
    const saved = readSavedSchedule()
    setSchedule(saved)
    setView('schedule')
    setMessage(saved.length > 0 ? 'Schedule loaded.' : 'Tidak ada data tersimpan.')
  }

  const addOrFarmItem = (progressAmount = 0) => {
    const item = createScheduleItem(category, level, selectedColor, target, progressAmount)
    setSchedule((current) => mergeSchedule(current, [item]))
    setView('schedule')
    setMessage(progressAmount > 0 ? 'Progress added.' : 'Target added.')
  }

  const updateProgress = (id: string, amount: number) => {
    setSchedule((current) =>
      current.map((item) => (item.id === id ? { ...item, progress: Math.max(0, item.progress + amount) } : item)),
    )
  }

  const updateTarget = (id: string) => {
    const nextTarget = window.prompt('Target baru?')
    if (nextTarget === null) return
    setSchedule((current) =>
      current.map((item) => (item.id === id ? { ...item, target: normalizeAmount(nextTarget, item.target) } : item)),
    )
  }

  const removeItem = (id: string) => setSchedule((current) => current.filter((item) => item.id !== id))

  const resetSchedule = () => {
    setSchedule([])
    setMessage('Schedule reset. Press Save to persist this reset.')
  }

  const exportSchedule = () => {
    const payload: StoredSchedule = { schedule, lastUpdated: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'daily-farming-schedule.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importSchedule = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<StoredSchedule>
      if (!Array.isArray(parsed.schedule)) throw new Error('Invalid schedule')
      setSchedule(
        parsed.schedule.map((item) => ({
          id: String(item.id),
          name: String(item.name),
          source: String(item.source),
          target: normalizeAmount(String(item.target), 0),
          progress: normalizeAmount(String(item.progress), 0),
        })),
      )
      setView('schedule')
      setMessage('Schedule imported.')
    } catch {
      setMessage('Import failed. File must contain valid schedule JSON.')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  const selectCharacterPack = (characterId: string) => {
    const character = characterPack.characters.find((entry) => entry.id === characterId)
    if (!character) return
    setSelectedCharacterId(characterId)
  }

  const generateCharacterPack = () => {
    const character = characterPack.characters.find((entry) => entry.id === selectedCharacterId)
    if (!character) return

    const generated: ScheduleItem[] = [
      ...resourceColors.flatMap((resourceColor) =>
        packCharacterResult.recommendation.counts[resourceColor] > 0
          ? [createScheduleItem('book', '6', resourceColor, packCharacterResult.recommendation.counts[resourceColor], 0)]
          : [],
      ),
      ...(['green', 'blue', 'purple'] as const).flatMap((resourceColor) =>
        packCharacterResult.essenceNeeded[resourceColor] > 0
          ? [createScheduleItem('essence', '6', resourceColor, packCharacterResult.essenceNeeded[resourceColor], 0)]
          : [],
      ),
      ...resourceColors.flatMap((resourceColor) =>
        packWeaponResult.recommendation.counts[resourceColor] > 0
          ? [createScheduleItem('tamahagane', '6', resourceColor, packWeaponResult.recommendation.counts[resourceColor], 0)]
          : [],
      ),
      ...(['green', 'blue', 'purple'] as const).flatMap((resourceColor) =>
        packWeaponResult.hammerNeeded[resourceColor] > 0
          ? [createScheduleItem('hammer', '6', resourceColor, packWeaponResult.hammerNeeded[resourceColor], 0)]
          : [],
      ),
      ...(['green', 'blue', 'purple'] as const).flatMap((resourceColor) =>
        packSkillResult.needed[resourceColor] > 0
          ? [createScheduleItem('art', '6', resourceColor, packSkillResult.needed[resourceColor], 0)]
          : [],
      ),
      ...(packSkillResult.passiveMissingOmamori > 0
        ? [createScheduleItem('omamori', '6', 'yellow', packSkillResult.passiveMissingOmamori, 0)]
        : []),
    ]

    setSchedule((current) => mergeSchedule(current, generated))
    setView('schedule')
    setMessage(`${character.name} pack generated.`)
  }

  const importInput = (
    <input
      ref={importInputRef}
      className="visually-hidden"
      type="file"
      accept=".txt,application/json,text/plain"
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) void importSchedule(file)
      }}
    />
  )

  if (view === 'entry') {
    return (
      <div className="overview-stack">
        <section className="overview-block">
          <div className="overview-block__header">
            <strong>Daily Schedule</strong>
            <span>Pilih cara mulai sebelum masuk ke schedule utama.</span>
          </div>
          <div className="farming-choice-grid">
            <button type="button" className="mobile-menu__card" onClick={loadFromStorage}>
              <small>Local storage</small>
              <strong>Load Data</strong>
            </button>
            <button type="button" className="mobile-menu__card" onClick={() => importInputRef.current?.click()}>
              <small>Upload .txt</small>
              <strong>Import Data</strong>
            </button>
            <button type="button" className="mobile-menu__card" onClick={() => setView('setup')}>
              <small>Manual atau pack</small>
              <strong>Pilih Kebutuhan</strong>
            </button>
          </div>
          {message && <p className="farming-hint">{message}</p>}
          {importInput}
        </section>
      </div>
    )
  }

  if (view === 'setup') {
    return (
      <div className="overview-stack">
        <section className="overview-block">
          <div className="overview-block__header">
            <strong>Pilih Kebutuhan</strong>
            <span>Setup manual atau generate otomatis dari Character Pack.</span>
          </div>
          <div className="farming-toolbar">
            <button type="button" className={`mini-tab ${setupMode === 'manual' ? 'is-active' : ''}`} onClick={() => setSetupMode('manual')}>
              Manual Setup
            </button>
            <button type="button" className={`mini-tab ${setupMode === 'character-pack' ? 'is-active' : ''}`} onClick={() => setSetupMode('character-pack')}>
              Character Pack
            </button>
            <button type="button" className="mini-tab" onClick={() => setView('entry')}>
              Back
            </button>
          </div>
        </section>

        {setupMode === 'manual' && (
          <section className="overview-block">
            <div className="overview-block__header">
              <strong>Manual Setup</strong>
              <span>Data source mengikuti farming-rewards.json.</span>
            </div>
            <div className="control-grid">
              <label className="field">
                Level
                <select value={level} onChange={(event) => setLevel(event.target.value)}>
                  {availableLevels.map((availableLevel) => (
                    <option key={availableLevel} value={availableLevel}>Level {availableLevel}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Material
                <select value={category} onChange={(event) => setCategory(event.target.value as FarmingCategory)}>
                  {(Object.keys(categoryLabels) as FarmingCategory[]).map((materialCategory) => (
                    <option key={materialCategory} value={materialCategory}>{categoryLabels[materialCategory]}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Rarity
                <select value={selectedColor} onChange={(event) => setColor(event.target.value as ResourceColor)}>
                  {availableColors.map((availableColor) => (
                    <option key={availableColor} value={availableColor}>{availableColor}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Target
                <input value={target} min={0} type="number" onChange={(event) => setTarget(normalizeAmount(event.target.value, 0))} />
              </label>
              <div className="farming-actions">
                <button type="button" className="mini-tab is-active" onClick={() => addOrFarmItem(0)}>
                  Generate Schedule
                </button>
              </div>
            </div>
            <p className="farming-hint">
              Source: {categoryLabels[category]} stage {level}, {selectedStamina} stamina, reward rata-rata {selectedRewardAmount} {selectedColor}.
            </p>
          </section>
        )}

        {setupMode === 'character-pack' && (
          <section className="overview-block">
            <div className="overview-block__header">
              <strong>Character Pack</strong>
              <span>Pilih character, isi kebutuhan seperti Total Planner, lalu generate schedule.</span>
            </div>
            <div className="farming-choice-grid">
              {characterPack.characters.map((character) => (
                <button key={character.id} type="button" className="mobile-menu__card" onClick={() => selectCharacterPack(character.id)}>
                  <small>{character.description}</small>
                  <strong>{character.name}</strong>
                </button>
              ))}
            </div>
            {selectedCharacterId && (
              <>
                <div className="farming-actions">
                  <button type="button" className="mini-tab is-active" onClick={generateCharacterPack}>
                    Generate Schedule
                  </button>
                </div>
                <div className="overview-stack">
                  <section className="overview-block">
                    <div className="overview-block__header">
                      <strong>Character input</strong>
                      <span>Input sama seperti Character di Total Planner.</span>
                    </div>
                    <div className="control-grid">
                      <SelectField label="Current level" value={packCharacterState.current} options={levelMilestones.slice(0, -1)} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, current: Number(value) }))} />
                      <SelectField label="Target level" value={packCharacterState.target} options={levelMilestones.slice(1)} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, target: Number(value) }))} />
                      <SelectField label="Book mode" value={packCharacterState.bookMode} options={materialModes} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, bookMode: value as typeof prev.bookMode }))} />
                    </div>
                    <div className="token-grid">
                      <PillInput label="Green books" color="green" value={packCharacterState.ownedBooks.green} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, green: value } }))} />
                      <PillInput label="Blue books" color="blue" value={packCharacterState.ownedBooks.blue} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, blue: value } }))} />
                      <PillInput label="Purple books" color="purple" value={packCharacterState.ownedBooks.purple} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, purple: value } }))} />
                      <PillInput label="Yellow books" color="yellow" value={packCharacterState.ownedBooks.yellow} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, yellow: value } }))} />
                      <PillInput label="Green essence" color="green" value={packCharacterState.ownedEssences.green} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, green: value } }))} />
                      <PillInput label="Blue essence" color="blue" value={packCharacterState.ownedEssences.blue} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, blue: value } }))} />
                      <PillInput label="Purple essence" color="purple" value={packCharacterState.ownedEssences.purple} onChange={(value) => setPackCharacterState((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, purple: value } }))} />
                    </div>
                  </section>

                  <section className="overview-block">
                    <div className="overview-block__header">
                      <strong>Weapon input</strong>
                      <span>Input sama seperti Weapon di Total Planner.</span>
                    </div>
                    <div className="control-grid">
                      <SelectField label="Current level" value={packWeaponState.current} options={levelMilestones.slice(0, -1)} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, current: Number(value) }))} />
                      <SelectField label="Target level" value={packWeaponState.target} options={levelMilestones.slice(1)} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, target: Number(value) }))} />
                      <SelectField label="Tamahagane mode" value={packWeaponState.tamahaganeMode} options={materialModes} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, tamahaganeMode: value as typeof prev.tamahaganeMode }))} />
                    </div>
                    <div className="token-grid">
                      <PillInput label="Green tamahagane" color="green" value={packWeaponState.ownedTamahagane.green} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, green: value } }))} />
                      <PillInput label="Blue tamahagane" color="blue" value={packWeaponState.ownedTamahagane.blue} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, blue: value } }))} />
                      <PillInput label="Purple tamahagane" color="purple" value={packWeaponState.ownedTamahagane.purple} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, purple: value } }))} />
                      <PillInput label="Yellow tamahagane" color="yellow" value={packWeaponState.ownedTamahagane.yellow} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, yellow: value } }))} />
                      <PillInput label="Green hammer" color="green" value={packWeaponState.ownedHammers.green} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, green: value } }))} />
                      <PillInput label="Blue hammer" color="blue" value={packWeaponState.ownedHammers.blue} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, blue: value } }))} />
                      <PillInput label="Purple hammer" color="purple" value={packWeaponState.ownedHammers.purple} onChange={(value) => setPackWeaponState((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, purple: value } }))} />
                    </div>
                  </section>

                  <section className="overview-block">
                    <div className="overview-block__header">
                      <strong>Skill input</strong>
                      <span>Input sama seperti Skill di Total Planner.</span>
                    </div>
                    <div className="control-grid">
                      <SelectField label="Current level" value={packSkillState.current} options={skillLevels.slice(0, -1)} onChange={(value) => setPackSkillState((prev) => ({ ...prev, current: Number(value) }))} />
                      <SelectField label="Target level" value={packSkillState.target} options={skillLevels.slice(1)} onChange={(value) => setPackSkillState((prev) => ({ ...prev, target: Number(value) }))} />
                    </div>
                    <div className="toggle-grid">
                      {['basic', 'skill', 'counter', 'ultimate'].map((type) => {
                        const active = packSkillState.selectedTypes.includes(type)
                        return (
                          <button key={type} type="button" className={`toggle-card ${active ? 'is-active' : ''}`} onClick={() => setPackSkillState((prev) => ({ ...prev, selectedTypes: active ? prev.selectedTypes.filter((item) => item !== type) : [...prev.selectedTypes, type] }))}>
                            {type}
                          </button>
                        )
                      })}
                    </div>
                    <div className="token-grid">
                      <PillInput label="Green art" color="green" value={packSkillState.ownedArts.green} onChange={(value) => setPackSkillState((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, green: value } }))} />
                      <PillInput label="Blue art" color="blue" value={packSkillState.ownedArts.blue} onChange={(value) => setPackSkillState((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, blue: value } }))} />
                      <PillInput label="Purple art" color="purple" value={packSkillState.ownedArts.purple} onChange={(value) => setPackSkillState((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, purple: value } }))} />
                      <PillInput label="Omamori owned" color="yellow" value={packSkillState.ownedOmamori} onChange={(value) => setPackSkillState((prev) => ({ ...prev, ownedOmamori: value }))} />
                    </div>
                    <div className="passive-grid">
                      {(['passive1', 'passive2', 'passive3'] as const).map((passiveKey, index) => (
                        <article key={passiveKey} className="passive-card">
                          <div className="passive-card__header">
                            <p className="section-tag">Passive {index + 1}</p>
                            <strong>{`Boost ${index + 1}`}</strong>
                          </div>
                          <div className="control-grid passive-card__controls">
                            <SelectField label="Current" value={packSkillState.passiveLevels[passiveKey].current} options={[0, 1, 2, 3]} onChange={(value) => setPackSkillState((prev) => ({ ...prev, passiveLevels: { ...prev.passiveLevels, [passiveKey]: { ...prev.passiveLevels[passiveKey], current: Number(value) } } }))} />
                            <SelectField label="Target" value={packSkillState.passiveLevels[passiveKey].target} options={[1, 2, 3]} onChange={(value) => setPackSkillState((prev) => ({ ...prev, passiveLevels: { ...prev.passiveLevels, [passiveKey]: { ...prev.passiveLevels[passiveKey], target: Number(value) } } }))} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="overview-stack">
      <section className="overview-block">
        <div className="overview-block__header">
          <strong>Daily progress</strong>
          <span>Progress tidak reset otomatis. Save untuk persist ke local storage.</span>
        </div>
        <div className="farming-toolbar">
          <button type="button" className="mini-tab" onClick={() => setView('entry')}>Entry</button>
          <button type="button" className="mini-tab" onClick={() => setView('setup')}>Tambah Kebutuhan</button>
          <button type="button" className="mini-tab" onClick={resetSchedule}>Reset</button>
          <button type="button" className="mini-tab" onClick={saveSchedule}>Save</button>
          <button type="button" className="mini-tab" onClick={loadFromStorage}>Load</button>
          <button type="button" className="mini-tab" onClick={exportSchedule}>Export (.txt)</button>
          <button type="button" className="mini-tab" onClick={() => importInputRef.current?.click()}>Import (.txt)</button>
          {importInput}
        </div>
        <label className="field farming-custom-progress">
          Custom progress
          <input value={customProgress} min={1} type="number" onChange={(event) => setCustomProgress(normalizeAmount(event.target.value, 1))} />
        </label>
        {message && <p className="farming-hint">{message}</p>}
        <div className="farming-list">
          {schedule.length === 0 && <div className="coming-soon">Belum ada target farming.</div>}
          {schedule.map((item) => {
            const percent = item.target === 0 ? 100 : Math.min(100, Math.round((item.progress / item.target) * 100))
            return (
              <article key={item.id} className="farming-card">
                <div className="farming-card__header">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.source}</span>
                  </div>
                  <button type="button" className="mini-tab" onClick={() => removeItem(item.id)}>Hapus</button>
                </div>
                <div className="farming-progress" aria-label={`${item.name} progress ${percent}%`}>
                  <span style={{ width: `${percent}%` }} />
                </div>
                <div className="farming-card__footer">
                  <span>{item.progress} / {item.target}</span>
                  <button type="button" className="mini-tab" onClick={() => updateProgress(item.id, 1)}>+1</button>
                  <button type="button" className="mini-tab" onClick={() => updateProgress(item.id, customProgress)}>+Custom</button>
                  <button type="button" className="mini-tab" onClick={() => updateTarget(item.id)}>Edit target</button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
