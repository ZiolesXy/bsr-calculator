import type { ReactNode } from 'react'
import { Card } from './Card'

type SectionProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ eyebrow, title, description, actions, children, className = '' }: SectionProps) {
  return (
    <Card className={`ui-section ${className}`.trim()}>
      <div className="ui-section__header">
        <div className="ui-section__copy">
          {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {description && <p className="ui-section__description">{description}</p>}
        </div>
        {actions && <div className="ui-section__actions">{actions}</div>}
      </div>
      {children}
    </Card>
  )
}
