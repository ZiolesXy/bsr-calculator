import type { ElementType, ReactNode } from 'react'

type CardProps<T extends ElementType = 'section'> = {
  as?: T
  children: ReactNode
  className?: string
}

export function Card<T extends ElementType = 'section'>({
  as,
  children,
  className = '',
}: CardProps<T>) {
  const Component = (as ?? 'section') as ElementType

  return <Component className={`ui-card ${className}`.trim()}>{children}</Component>
}
