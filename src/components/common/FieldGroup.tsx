import type { ReactNode } from 'react'

type FieldGroupProps = {
  title: string
  caption?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function FieldGroup({ title, caption, action, children, className = '' }: FieldGroupProps) {
  return (
    <section className={`field-group ${className}`.trim()}>
      <header className="field-group__header">
        <div>
          <h3>{title}</h3>
          {caption && <p>{caption}</p>}
        </div>
        {action}
      </header>
      <div className="field-group__body">{children}</div>
    </section>
  )
}

type ResetButtonProps = {
  label: string
  onClick: () => void
}

export function ResetButton({ label, onClick }: ResetButtonProps) {
  return (
    <button type="button" className="text-button" onClick={onClick}>
      {label}
    </button>
  )
}
