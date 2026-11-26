import type { Dispatch, SetStateAction } from 'react'
import { stampMilestones } from '../../hooks/useStampCalculator'
import type { StampKind, StampState } from '../../types'
import { materialModes } from '../../utils/calculator'
import { PillInput } from '../common/PillInput'
import { SelectField } from '../common/SelectField'

type StampInputsProps = {
  kind: StampKind
  state: StampState
  onChange: Dispatch<SetStateAction<StampState>>
}

export function StampInputs({ kind, state, onChange }: StampInputsProps) {
  return (
    <>
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
          onChange={(value) => onChange((prev) => ({ ...prev, cardMode: value as typeof prev.cardMode }))}
        />
        {kind === 'set' && (
          <SelectField
            label="Jumlah set"
            value={state.setCount ?? 1}
            options={[1, 2, 3]}
            onChange={(value) => onChange((prev) => ({ ...prev, setCount: Number(value) }))}
          />
        )}
      </div>
      <div className="token-grid">
        <PillInput label="Green cards" color="green" value={state.ownedCards.green} onChange={(value) => onChange((prev) => ({ ...prev, ownedCards: { ...prev.ownedCards, green: value } }))} />
        <PillInput label="Blue cards" color="blue" value={state.ownedCards.blue} onChange={(value) => onChange((prev) => ({ ...prev, ownedCards: { ...prev.ownedCards, blue: value } }))} />
        <PillInput label="Purple cards" color="purple" value={state.ownedCards.purple} onChange={(value) => onChange((prev) => ({ ...prev, ownedCards: { ...prev.ownedCards, purple: value } }))} />
        <PillInput label="Yellow cards" color="yellow" value={state.ownedCards.yellow} onChange={(value) => onChange((prev) => ({ ...prev, ownedCards: { ...prev.ownedCards, yellow: value } }))} />
        <PillInput label="Ectoplasm owned" color="yellow" value={state.ownedEctoplasm} onChange={(value) => onChange((prev) => ({ ...prev, ownedEctoplasm: value }))} />
      </div>
      {kind === 'set' && (
        <div className="stamp-nexus">
          <div className="overview-block__header">
            <p className="section-tag">Nexus Stamp</p>
            <span>Progression 1-10, 10-15, 15-20, 20-25, 25-30.</span>
          </div>
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
          <div className="token-grid">
            <PillInput label="Nexus owned" color="yellow" value={state.ownedNexus} onChange={(value) => onChange((prev) => ({ ...prev, ownedNexus: value }))} />
          </div>
          <p className="farming-hint">Nexus Stamp unfarmable. Sisa kebutuhan tidak masuk ke Daily Schedule.</p>
        </div>
      )}
    </>
  )
}
