import { memo } from 'react'
import { useWeaponState } from '../../context/AppStateContext'
import { useWeaponCalculator } from '../../hooks/useWeaponCalculator'
import type { ResourceColor } from '../../types'
import { levelMilestones, materialModes } from '../../utils/calculator'
import { FieldGroup, ResetButton } from '../common/FieldGroup'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'
import { RarityChips, ResultGroup, ResultPanel, ResultRow } from '../result/ResultPanel'

type WeaponTabProps = {
  showOutput?: boolean
}

const tamahaganeColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']
const hammerColors: Array<'green' | 'blue' | 'purple'> = ['green', 'blue', 'purple']
const emptyCounts = { green: 0, blue: 0, purple: 0, yellow: 0 }

export function WeaponTab({ showOutput = true }: WeaponTabProps) {
  const { weaponState: state, setWeaponState } = useWeaponState()
  const result = useWeaponCalculator(state)

  const resetTamahagane = () =>
    setWeaponState((prev) => ({ ...prev, ownedTamahagane: { ...emptyCounts } }))
  const resetHammers = () =>
    setWeaponState((prev) => ({ ...prev, ownedHammers: { green: 0, blue: 0, purple: 0 } }))

  return (
    <>
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-tag">Weapon</p>
            <h2>Tamahagane, hammer, and gold</h2>
            <p className="ui-section__description">
              Plan the weapon range and subtract the materials already in stock.
            </p>
          </div>
        </div>

        <FieldGroup title="Level range" caption="Gold and kans start counting from level 20.">
          <div className="control-grid">
            <SelectField
              label="Current level"
              value={state.current}
              options={levelMilestones.slice(0, -1)}
              onChange={(value) => setWeaponState((prev) => ({ ...prev, current: Number(value) }))}
            />
            <SelectField
              label="Target level"
              value={state.target}
              options={levelMilestones.slice(1)}
              onChange={(value) => setWeaponState((prev) => ({ ...prev, target: Number(value) }))}
            />
            <SelectField
              label="Tamahagane mode"
              value={state.tamahaganeMode}
              options={materialModes}
              onChange={(value) =>
                setWeaponState((prev) => ({ ...prev, tamahaganeMode: value as typeof prev.tamahaganeMode }))
              }
            />
          </div>
        </FieldGroup>

        <FieldGroup
          title="Tamahagane owned"
          caption="Converts to EXP before recommendations."
          action={<ResetButton label="Reset" onClick={resetTamahagane} />}
        >
          <div className="token-grid">
            {tamahaganeColors.map((color) => (
              <PillInput
                key={color}
                label={`${color} tamahagane`}
                color={color}
                value={state.ownedTamahagane[color]}
                onChange={(value) =>
                  setWeaponState((prev) => ({
                    ...prev,
                    ownedTamahagane: { ...prev.ownedTamahagane, [color]: value },
                  }))
                }
              />
            ))}
          </div>
        </FieldGroup>

        <FieldGroup
          title="Hammers owned"
          caption="Only ascension breakpoints in range count."
          action={<ResetButton label="Reset" onClick={resetHammers} />}
        >
          <div className="token-grid token-grid--three">
            {hammerColors.map((color) => (
              <PillInput
                key={color}
                label={`${color} hammer`}
                color={color}
                value={state.ownedHammers[color]}
                onChange={(value) =>
                  setWeaponState((prev) => ({
                    ...prev,
                    ownedHammers: { ...prev.ownedHammers, [color]: value },
                  }))
                }
              />
            ))}
          </div>
        </FieldGroup>
      </section>

      {showOutput && (
        <ResultPanel eyebrow="Weapon output">
          <ResultGroup title="EXP">
            <ResultRow label="Total EXP" value={result.expRequired} />
            <ResultRow label="Owned EXP" value={result.ownedExp} tone="muted" />
            <ResultRow label="Recommended" value={result.recommendation.totalExp} />
            <ResultRow label="Extra" value={result.recommendation.overshoot} tone="muted" />
          </ResultGroup>

          <ResultGroup title="Tamahagane to prepare">
            <RarityChips
              items={tamahaganeColors.map((color) => ({
                color,
                value: result.recommendation.counts[color],
                percent: result.recommendation.percentages[color],
              }))}
            />
          </ResultGroup>

          <ResultGroup title="Hammers needed">
            <RarityChips
              items={hammerColors.map((color) => ({ color, value: result.hammerNeeded[color] }))}
            />
          </ResultGroup>

          <ResultGroup title="Cost">
            <ResultRow label="Gold" value={result.gold} />
            <ResultRow label="Ascension kans" value={result.ascension} />
          </ResultGroup>
        </ResultPanel>
      )}
    </>
  )
}

export default memo(WeaponTab)
