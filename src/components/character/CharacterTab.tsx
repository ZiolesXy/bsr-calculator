import { memo } from 'react'
import { useCharacterState } from '../../context/AppStateContext'
import { useCharacterCalculator } from '../../hooks/useCharacterCalculator'
import type { ResourceColor } from '../../types'
import { levelMilestones, materialModes } from '../../utils/calculator'
import { FieldGroup, ResetButton } from '../common/FieldGroup'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'
import { RarityChips, ResultGroup, ResultPanel, ResultRow } from '../result/ResultPanel'

type CharacterTabProps = {
  showOutput?: boolean
}

const bookColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']
const essenceColors: Array<'green' | 'blue' | 'purple'> = ['green', 'blue', 'purple']
const emptyCounts = { green: 0, blue: 0, purple: 0, yellow: 0 }

export function CharacterTab({ showOutput = true }: CharacterTabProps) {
  const { characterState: state, setCharacterState } = useCharacterState()
  const result = useCharacterCalculator(state)

  const resetBooks = () => setCharacterState((prev) => ({ ...prev, ownedBooks: { ...emptyCounts } }))
  const resetEssences = () =>
    setCharacterState((prev) => ({ ...prev, ownedEssences: { green: 0, blue: 0, purple: 0 } }))

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Character</p>
            <h2>Level, book, and essence</h2>
            <p className="ui-section__description">
              Set a level range, then add the materials you already own.
            </p>
          </div>
        </div>

        <FieldGroup title="Level range" caption="Milestones advance every 10 levels.">
          <div className="control-grid">
            <SelectField
              label="Current level"
              value={state.current}
              options={levelMilestones.slice(0, -1)}
              onChange={(value) => setCharacterState((prev) => ({ ...prev, current: Number(value) }))}
            />
            <SelectField
              label="Target level"
              value={state.target}
              options={levelMilestones.slice(1)}
              onChange={(value) => setCharacterState((prev) => ({ ...prev, target: Number(value) }))}
            />
            <SelectField
              label="Book mode"
              value={state.bookMode}
              options={materialModes}
              onChange={(value) =>
                setCharacterState((prev) => ({ ...prev, bookMode: value as typeof prev.bookMode }))
              }
            />
          </div>
        </FieldGroup>

        <FieldGroup
          title="Books owned"
          caption="Applied before essence."
          action={<ResetButton label="Reset" onClick={resetBooks} />}
        >
          <div className="token-grid">
            {bookColors.map((color) => (
              <PillInput
                key={color}
                label={`${color} books`}
                color={color}
                value={state.ownedBooks[color]}
                onChange={(value) =>
                  setCharacterState((prev) => ({
                    ...prev,
                    ownedBooks: { ...prev.ownedBooks, [color]: value },
                  }))
                }
              />
            ))}
          </div>
        </FieldGroup>

        <FieldGroup
          title="Essence owned"
          caption="Covers ascension breakpoints in range."
          action={<ResetButton label="Reset" onClick={resetEssences} />}
        >
          <div className="token-grid token-grid--three">
            {essenceColors.map((color) => (
              <PillInput
                key={color}
                label={`${color} essence`}
                color={color}
                value={state.ownedEssences[color]}
                onChange={(value) =>
                  setCharacterState((prev) => ({
                    ...prev,
                    ownedEssences: { ...prev.ownedEssences, [color]: value },
                  }))
                }
              />
            ))}
          </div>
        </FieldGroup>
      </section>

      {showOutput && (
        <ResultPanel eyebrow="Character output">
          <ResultGroup title="EXP">
            <ResultRow label="Total EXP" value={result.expRequired} />
            <ResultRow label="Owned EXP" value={result.ownedExp} tone="muted" />
            <ResultRow label="Recommended" value={result.recommendation.totalExp} />
            <ResultRow label="Extra" value={result.recommendation.overshoot} tone="muted" />
          </ResultGroup>

          <ResultGroup title="Books to prepare">
            <RarityChips
              items={bookColors.map((color) => ({
                color,
                value: result.recommendation.counts[color],
                percent: result.recommendation.percentages[color],
              }))}
            />
          </ResultGroup>

          <ResultGroup title="Kans">
            <ResultRow label="Level kans" value={result.levelKans} />
            <ResultRow label="Ascension kans" value={result.ascensionKans} />
          </ResultGroup>

          <ResultGroup title="Essence needed">
            <RarityChips
              items={essenceColors.map((color) => ({
                color,
                value: result.essenceNeeded[color],
              }))}
            />
          </ResultGroup>
        </ResultPanel>
      )}
    </>
  )
}

export default memo(CharacterTab)
