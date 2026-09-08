import type { SelectHTMLAttributes } from 'react'

type DropdownOption = number | string | { value: number | string; label: string }

type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: Array<DropdownOption>
}

export function Dropdown({ label, options, className = '', ...props }: DropdownProps) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <select className={`ui-select ${className}`.trim()} {...props}>
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
