import { memo } from 'react'
import { useSkillState } from '../../context/AppStateContext'
import { useSkillCalculator } from '../../hooks/useSkillCalculator'
import { skillLevels, skillTypes } from '../../utils/calculator'
import { FieldGroup, ResetButton } from '../common/FieldGroup'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'
import { RarityChips, ResultGroup, ResultPanel, ResultRow } from '../result/ResultPanel'

type SkillTabProps = {
  showOutput?: boolean
}

const artColors: Array<'green' | 'blue' | 'purple'> = ['green', 'blue', 'purple']

export function SkillTab({ showOutput = true }: SkillTabProps) {
  const { skillState: state, setSkillState } = useSkillState()
  const result = useSkillCalculator(state)

  const resetOwned = () =>
    setSkillState((prev) => ({
      ...prev,
      ownedArts: { green: 0, blue: 0, purple: 0 },
      ownedOmamori: 0,
    }))

  const toggleType = (type: (typeof skillTypes)[number]) =>
    setSkillState((prev) => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter((item) => item !== type)
        : [...prev.selectedTypes, type],
    }))

  const totalKans = result.totals.kans + result.passiveTotalKans

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Skill</p>
            <h2>Art, omamori, and passive boosts</h2>
            <p className="ui-section__description">
              Every selected skill type multiplies the art and kans cost.
            </p>
          </div>
        </div>

        <FieldGroup title="Level range" caption="Skill levels advance in fixed steps.">
          <div className="control-grid">
            <SelectField
              label="Current level"
              value={state.current}
              options={skillLevels.slice(0, -1)}
              onChange={(value) => setSkillState((prev) => ({ ...prev, current: Number(value) }))}
            />
            <SelectField
              label="Target level"
              value={state.target}
              options={skillLevels.slice(1)}
              onChange={(value) => setSkillState((prev) => ({ ...prev, target: Number(value) }))}
            />
          </div>
        </FieldGroup>

        <FieldGroup
          title="Skill types"
          caption={`${state.selectedTypes.length} selected · each one is costed separately.`}
        >
          <div className="toggle-grid">
            {skillTypes.map((type) => {
              const active = state.selectedTypes.includes(type)

              return (
                <button
                  key={type}
                  type="button"
                  className={`toggle-card ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </button>
              )
            })}
          </div>
        </FieldGroup>

        <FieldGroup
          title="Owned materials"
          caption="Arts and omamori already in stock."
          action={<ResetButton label="Reset" onClick={resetOwned} />}
        >
          <div className="token-grid">
            {artColors.map((color) => (
              <PillInput
                key={color}
                label={`${color} art`}
                color={color}
                value={state.ownedArts[color]}
                onChange={(value) =>
                  setSkillState((prev) => ({
                    ...prev,
                    ownedArts: { ...prev.ownedArts, [color]: value },
                  }))
                }
              />
            ))}
            <PillInput
              label="Omamori owned"
              color="yellow"
              value={state.ownedOmamori}
              onChange={(value) => setSkillState((prev) => ({ ...prev, ownedOmamori: value }))}
            />
          </div>
        </FieldGroup>

        <FieldGroup title="Passive boosts" caption="Each boost is costed from its current to target level.">
          <div className="passive-grid">
            {(['passive1', 'passive2', 'passive3'] as const).map((passiveKey, index) => (
              <article key={passiveKey} className="passive-card">
                <div className="passive-card__header">
                  <p className="section-tag">Passive {index + 1}</p>
                  <strong>Boost {index + 1}</strong>
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
                  <ResultRow
                    label="Omamori"
                    value={result.passiveResults[passiveKey].omamori}
                  />
                  <ResultRow label="Kans" value={result.passiveResults[passiveKey].kans} />
                </div>
              </article>
            ))}
          </div>
        </FieldGroup>
      </section>

      {showOutput && (
        <ResultPanel eyebrow="Skill output">
          <ResultGroup title="Arts needed">
            <RarityChips
              items={artColors.map((color) => ({ color, value: result.needed[color] }))}
            />
          </ResultGroup>

          <ResultGroup title="Kans">
            <ResultRow label="Skill kans" value={result.totals.kans} />
            <ResultRow label="Passive kans" value={result.passiveTotalKans} />
            <ResultRow label="Total" value={totalKans} tone="accent" />
          </ResultGroup>

          <ResultGroup title="Omamori">
            <ResultRow label="Passive total" value={result.passiveTotalOmamori} tone="muted" />
            <ResultRow label="Missing omamori" value={result.passiveMissingOmamori} tone="accent" />
          </ResultGroup>
        </ResultPanel>
      )}
    </>
  )
}

export default memo(SkillTab)
