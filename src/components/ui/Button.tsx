import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'solid' | 'soft' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  leading?: ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
}

export function Button({
  children,
  className = '',
  leading,
  size = 'md',
  variant = 'soft',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()}
      {...props}
    >
      {leading && <span className="ui-button__leading" aria-hidden="true">{leading}</span>}
      <span>{children}</span>
    </button>
  )
}
