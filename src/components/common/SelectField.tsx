type SelectFieldProps = {
  label: string
  value: number | string
  options: Array<number | string | { value: number | string; label: string }>
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const normalized = typeof option === 'object' ? option : { value: option, label: String(option) }
          return (
            <option key={String(normalized.value)} value={normalized.value}>
              {normalized.label}
            </option>
          )
        })}
      </select>
    </label>
  )
}
