import { memo } from 'react'
import { useSkillState } from '../../context/AppStateContext'
import { useSkillCalculator } from '../../hooks/useSkillCalculator'
import { formatNumber } from '../../utils/formatter'
import { skillLevels } from '../../utils/calculator'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'
import { StatCard } from '../common/StatCard'

type SkillTabProps = {
  showOutput?: boolean
}

const skillTypes = ['basic', 'skill', 'counter', 'ultimate', 'battlefield-skill', 'entry-skill'] as const

export function SkillTab({ showOutput = true }: SkillTabProps) {
  const { skillState: state, setSkillState } = useSkillState()
  const result = useSkillCalculator(state)

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Skill</p>
            <h2>Art material calculator for selected skill types</h2>
          </div>
        </div>
        <div className="control-grid">
          <SelectField label="Current level" value={state.current} options={skillLevels.slice(0, -1)} onChange={(value) => setSkillState((prev) => ({ ...prev, current: Number(value) }))} />
          <SelectField label="Target level" value={state.target} options={skillLevels.slice(1)} onChange={(value) => setSkillState((prev) => ({ ...prev, target: Number(value) }))} />
        </div>
        <div className="toggle-grid">
          {skillTypes.map((type) => {
            const active = state.selectedTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                className={`toggle-card ${active ? 'is-active' : ''}`}
                onClick={() =>
                  setSkillState((prev) => ({
                    ...prev,
                    selectedTypes: prev.selectedTypes.includes(type)
                      ? prev.selectedTypes.filter((item) => item !== type)
                      : [...prev.selectedTypes, type],
                  }))
                }
              >
                {type}
              </button>
            )
          })}
        </div>
        <div className="token-grid">
          <PillInput label="Green art" color="green" value={state.ownedArts.green} onChange={(value) => setSkillState((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, green: value } }))} />
          <PillInput label="Blue art" color="blue" value={state.ownedArts.blue} onChange={(value) => setSkillState((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, blue: value } }))} />
          <PillInput label="Purple art" color="purple" value={state.ownedArts.purple} onChange={(value) => setSkillState((prev) => ({ ...prev, ownedArts: { ...prev.ownedArts, purple: value } }))} />
          <PillInput label="Omamori owned" color="yellow" value={state.ownedOmamori} onChange={(value) => setSkillState((prev) => ({ ...prev, ownedOmamori: value }))} />
        </div>
        <div className="passive-grid">
          {(['passive1', 'passive2', 'passive3'] as const).map((passiveKey, index) => (
            <article key={passiveKey} className="passive-card">
              <div className="passive-card__header">
                <p className="section-tag">Passive {index + 1}</p>
                <strong>{`Boost ${index + 1}`}</strong>
              </div>
              <div className="control-grid passive-card__controls">
                <SelectField
                  label="Current"
                  value={state.passiveLevels[passiveKey].current}
                  options={[0, 1, 2, 3]}
                  onChange={(value) =>
                    setSkillState((prev) => ({
                      ...prev,
                      passiveLevels: {
                        ...prev.passiveLevels,
                        [passiveKey]: { ...prev.passiveLevels[passiveKey], current: Number(value) },
                      },
                    }))
                  }
                />
                <SelectField
                  label="Target"
                  value={state.passiveLevels[passiveKey].target}
                  options={[1, 2, 3]}
                  onChange={(value) =>
                    setSkillState((prev) => ({
                      ...prev,
                      passiveLevels: {
                        ...prev.passiveLevels,
                        [passiveKey]: { ...prev.passiveLevels[passiveKey], target: Number(value) },
                      },
                    }))
                  }
                />
              </div>
              <div className="passive-card__stats">
                <StatCard label="Omamori" value={formatNumber(result.passiveResults[passiveKey].omamori)} />
                <StatCard label="Kans" value={formatNumber(result.passiveResults[passiveKey].kans)} />
              </div>
            </article>
          ))}
        </div>
      </section>
      {showOutput && (
        <section className="panel stats-panel">
          <p className="section-tag">Output</p>
          <StatCard label="Selected types" value={formatNumber(result.skillMultiplier)} />
          <StatCard label="Need green art" value={formatNumber(result.needed.green)} />
          <StatCard label="Need blue art" value={formatNumber(result.needed.blue)} />
          <StatCard label="Need purple art" value={formatNumber(result.needed.purple)} />
          <StatCard label="Total Kans" value={formatNumber(result.totals.kans)} />
          <StatCard label="Passive Omamori" value={formatNumber(result.passiveTotalOmamori)} />
          <StatCard label="Missing Omamori" value={formatNumber(result.passiveMissingOmamori)} />
          <StatCard label="Passive Kans" value={formatNumber(result.passiveTotalKans)} />
        </section>
      )}
    </>
  )
}

export default memo(SkillTab)
