import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      <input className={`ui-input ${className}`.trim()} {...props} />
    </label>
  )
}
