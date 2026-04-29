import { memo } from 'react'
import { useCharacterState } from '../../context/AppStateContext'
import { materialModes, levelMilestones } from '../../utils/calculator'
import { formatNumber } from '../../utils/formatter'
import { PillInput } from '../common/PillInput'
import { RecommendationCard } from '../common/RecommendationCard'
import { SelectField } from '../common/SelectField'
import { StatCard } from '../common/StatCard'
import { useCharacterCalculator } from '../../hooks/useCharacterCalculator'

type CharacterTabProps = {
  showOutput?: boolean
}

export function CharacterTab({ showOutput = true }: CharacterTabProps) {
  const { characterState: state, setCharacterState } = useCharacterState()
  const result = useCharacterCalculator(state)

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Character</p>
            <h2>Level, book, and essence calculator</h2>
          </div>
        </div>
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
            onChange={(value) => setCharacterState((prev) => ({ ...prev, bookMode: value as typeof prev.bookMode }))}
          />
        </div>
        <div className="token-grid">
          <PillInput label="Green books" color="green" value={state.ownedBooks.green} onChange={(value) => setCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, green: value } }))} />
          <PillInput label="Blue books" color="blue" value={state.ownedBooks.blue} onChange={(value) => setCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, blue: value } }))} />
          <PillInput label="Purple books" color="purple" value={state.ownedBooks.purple} onChange={(value) => setCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, purple: value } }))} />
          <PillInput label="Yellow books" color="yellow" value={state.ownedBooks.yellow} onChange={(value) => setCharacterState((prev) => ({ ...prev, ownedBooks: { ...prev.ownedBooks, yellow: value } }))} />
          <PillInput label="Green essence" color="green" value={state.ownedEssences.green} onChange={(value) => setCharacterState((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, green: value } }))} />
          <PillInput label="Blue essence" color="blue" value={state.ownedEssences.blue} onChange={(value) => setCharacterState((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, blue: value } }))} />
          <PillInput label="Purple essence" color="purple" value={state.ownedEssences.purple} onChange={(value) => setCharacterState((prev) => ({ ...prev, ownedEssences: { ...prev.ownedEssences, purple: value } }))} />
        </div>
      </section>
      {showOutput && (
        <section className="panel stats-panel">
          <p className="section-tag">Output</p>
          <StatCard label="Total EXP" value={formatNumber(result.expRequired)} />
          <StatCard label="Owned EXP" value={formatNumber(result.ownedExp)} />
          <StatCard label="Missing EXP" value={formatNumber(result.missingExp)} />
          <RecommendationCard label="Book recommendation" recommendation={result.recommendation} />
          <StatCard label="Recommended EXP" value={formatNumber(result.recommendation.totalExp)} />
          <StatCard label="Extra EXP" value={formatNumber(result.recommendation.overshoot)} />
          <StatCard label="Level Kans" value={formatNumber(result.levelKans)} />
          <StatCard label="Ascension Kans" value={formatNumber(result.ascensionKans)} />
          <StatCard
            label="Need Essences"
            value={`${formatNumber(result.essenceNeeded.green)} / ${formatNumber(result.essenceNeeded.blue)} / ${formatNumber(result.essenceNeeded.purple)}`}
          />
        </section>
      )}
    </>
  )
}

export default memo(CharacterTab)
