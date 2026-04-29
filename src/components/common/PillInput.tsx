import type { ResourceColor } from '../../types'

type PillInputProps = {
  label: string
  color: ResourceColor
  value: number
  onChange: (value: number) => void
}

export function PillInput({ label, color, value, onChange }: PillInputProps) {
  return (
    <label className={`pill-input pill-input--${color}`}>
      <span>{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  )
}
