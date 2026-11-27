import type { Dispatch, SetStateAction } from 'react'
import { stampMilestones } from '../../hooks/useStampCalculator'
import type { ResourceColor, StampKind, StampState } from '../../types'
import { materialModes } from '../../utils/calculator'
import { FieldGroup, ResetButton } from '../common/FieldGroup'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'

type StampInputsProps = {
  kind: StampKind
  state: StampState
  onChange: Dispatch<SetStateAction<StampState>>
}

const cardColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']

export function StampInputs({ kind, state, onChange }: StampInputsProps) {
  const resetCards = () =>
    onChange((prev) => ({ ...prev, ownedCards: { green: 0, blue: 0, purple: 0, yellow: 0 } }))

  return (
    <>
      <FieldGroup
        title="Level range"
        caption={kind === 'set' ? 'Set count multiplies every cost.' : 'Card EXP and kans for the range.'}
      >
        <div className="control-grid">
          <SelectField
            label="Current level"
            value={state.current}
            options={stampMilestones.slice(0, -1)}
            onChange={(value) => onChange((prev) => ({ ...prev, current: Number(value) }))}
          />
          <SelectField
            label="Target level"
            value={state.target}
            options={stampMilestones.slice(1)}
            onChange={(value) => onChange((prev) => ({ ...prev, target: Number(value) }))}
          />
          <SelectField
            label="Card mode"
            value={state.cardMode}
            options={materialModes}
            onChange={(value) =>
              onChange((prev) => ({ ...prev, cardMode: value as typeof prev.cardMode }))
            }
          />
          {kind === 'set' && (
            <SelectField
              label="Set count"
              value={state.setCount ?? 1}
              options={[1, 2, 3]}
              onChange={(value) => onChange((prev) => ({ ...prev, setCount: Number(value) }))}
            />
          )}
        </div>
      </FieldGroup>

      <FieldGroup
        title="Cards owned"
        caption="Applied before the recommendation."
        action={<ResetButton label="Reset" onClick={resetCards} />}
      >
        <div className="token-grid">
          {cardColors.map((color) => (
            <PillInput
              key={color}
              label={`${color} cards`}
              color={color}
              value={state.ownedCards[color]}
              onChange={(value) =>
                onChange((prev) => ({
                  ...prev,
                  ownedCards: { ...prev.ownedCards, [color]: value },
                }))
              }
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Ectoplasm owned" caption="Unfarmable stock reduces the missing amount.">
        <div className="token-grid token-grid--three">
          <PillInput
            label="Ectoplasm"
            color="yellow"
            value={state.ownedEctoplasm}
            onChange={(value) => onChange((prev) => ({ ...prev, ownedEctoplasm: value }))}
          />
        </div>
      </FieldGroup>

      {kind === 'set' && (
        <FieldGroup
          title="Nexus stamp"
          caption="Progression 1-10, 10-15, 15-20, 20-25, 25-30."
        >
          <div className="control-grid">
            <SelectField
              label="Nexus current"
              value={state.nexusCurrent}
              options={stampMilestones.slice(0, -1)}
              onChange={(value) => onChange((prev) => ({ ...prev, nexusCurrent: Number(value) }))}
            />
            <SelectField
              label="Nexus target"
              value={state.nexusTarget}
              options={stampMilestones.slice(1)}
              onChange={(value) => onChange((prev) => ({ ...prev, nexusTarget: Number(value) }))}
            />
          </div>
          <div className="token-grid token-grid--three">
            <PillInput
              label="Nexus owned"
              color="yellow"
              value={state.ownedNexus}
              onChange={(value) => onChange((prev) => ({ ...prev, ownedNexus: value }))}
            />
          </div>
          <p className="farming-hint">
            Nexus Stamp is unfarmable, so any remaining amount is excluded from the Daily Schedule.
          </p>
        </FieldGroup>
      )}
    </>
  )
}
