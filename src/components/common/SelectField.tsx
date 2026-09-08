import { Dropdown } from '../ui/Dropdown'

type SelectFieldProps = {
  label: string
  value: number | string
  options: Array<number | string | { value: number | string; label: string }>
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return <Dropdown label={label} value={value} options={options} onChange={(event) => onChange(event.target.value)} />
}
