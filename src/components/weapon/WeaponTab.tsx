import { memo } from 'react'
import { useWeaponState } from '../../context/AppStateContext'
import { useWeaponCalculator } from '../../hooks/useWeaponCalculator'
import { levelMilestones, materialModes } from '../../utils/calculator'
import { formatNumber } from '../../utils/formatter'
import { PillInput } from '../common/PillInput'
import { RecommendationCard } from '../common/RecommendationCard'
import { SelectField } from '../common/SelectField'
import { StatCard } from '../common/StatCard'

type WeaponTabProps = {
  showOutput?: boolean
}

export function WeaponTab({ showOutput = true }: WeaponTabProps) {
  const { weaponState: state, setWeaponState } = useWeaponState()
  const result = useWeaponCalculator(state)

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Weapon</p>
            <h2>Tamahagane, hammer, and gold planner</h2>
          </div>
        </div>
        <div className="control-grid">
          <SelectField label="Current level" value={state.current} options={levelMilestones.slice(0, -1)} onChange={(value) => setWeaponState((prev) => ({ ...prev, current: Number(value) }))} />
          <SelectField label="Target level" value={state.target} options={levelMilestones.slice(1)} onChange={(value) => setWeaponState((prev) => ({ ...prev, target: Number(value) }))} />
          <SelectField label="Tamahagane mode" value={state.tamahaganeMode} options={materialModes} onChange={(value) => setWeaponState((prev) => ({ ...prev, tamahaganeMode: value as typeof prev.tamahaganeMode }))} />
        </div>
        <div className="token-grid">
          <PillInput label="Green tamahagane" color="green" value={state.ownedTamahagane.green} onChange={(value) => setWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, green: value } }))} />
          <PillInput label="Blue tamahagane" color="blue" value={state.ownedTamahagane.blue} onChange={(value) => setWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, blue: value } }))} />
          <PillInput label="Purple tamahagane" color="purple" value={state.ownedTamahagane.purple} onChange={(value) => setWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, purple: value } }))} />
          <PillInput label="Yellow tamahagane" color="yellow" value={state.ownedTamahagane.yellow} onChange={(value) => setWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...prev.ownedTamahagane, yellow: value } }))} />
          <PillInput label="Green hammer" color="green" value={state.ownedHammers.green} onChange={(value) => setWeaponState((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, green: value } }))} />
          <PillInput label="Blue hammer" color="blue" value={state.ownedHammers.blue} onChange={(value) => setWeaponState((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, blue: value } }))} />
          <PillInput label="Purple hammer" color="purple" value={state.ownedHammers.purple} onChange={(value) => setWeaponState((prev) => ({ ...prev, ownedHammers: { ...prev.ownedHammers, purple: value } }))} />
        </div>
      </section>
      {showOutput && (
        <section className="panel stats-panel">
          <p className="section-tag">Output</p>
          <StatCard label="Total EXP" value={formatNumber(result.expRequired)} />
          <StatCard label="Owned EXP" value={formatNumber(result.ownedExp)} />
          <StatCard label="Missing EXP" value={formatNumber(result.missingExp)} />
          <RecommendationCard label="Tamahagane recommendation" recommendation={result.recommendation} />
          <StatCard label="Recommended EXP" value={formatNumber(result.recommendation.totalExp)} />
          <StatCard label="Extra EXP" value={formatNumber(result.recommendation.overshoot)} />
          <StatCard label="Gold Cost" value={formatNumber(result.gold)} />
          <StatCard label="Ascension Kans" value={formatNumber(result.ascension)} />
          <StatCard label="Need Hammers" value={`${formatNumber(result.hammerNeeded.green)} / ${formatNumber(result.hammerNeeded.blue)} / ${formatNumber(result.hammerNeeded.purple)}`} />
        </section>
      )}
    </>
  )
}

export default memo(WeaponTab)
