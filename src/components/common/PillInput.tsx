import type { ResourceColor } from '../../types'

type PillInputProps = {
  label: string
  color: ResourceColor
  value: number
  onChange: (value: number) => void
}

export function PillInput({ label, color, value, onChange }: PillInputProps) {
  return (
    <label className={`ui-field pill-field pill-input--${color}`}>
      <span className="ui-field__label">
        <span className="rarity-dot" aria-hidden="true" />
        {label}
      </span>
      <input
        className="ui-input pill-input"
        type="number"
        min="0"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  )
}
