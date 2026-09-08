import type { ResourceColor } from '../../types'
import { Input } from '../ui/Input'

type PillInputProps = {
  label: string
  color: ResourceColor
  value: number
  onChange: (value: number) => void
}

export function PillInput({ label, color, value, onChange }: PillInputProps) {
  return <Input label={label} className={`pill-input pill-input--${color}`} type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} />
}
