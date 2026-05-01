import { memo } from 'react'

type MobileBackbarProps = {
  backLabel?: string
  currentLabel: string
  onBack: () => void
}

function MobileBackbarComponent({ backLabel = 'Back to main menu', currentLabel, onBack }: MobileBackbarProps) {
  return (
    <section className="mobile-backbar panel panel--wide">
      <button type="button" className="mobile-backbar__button" onClick={onBack}>
        {backLabel}
      </button>
      <div>
        <p className="section-tag">Current Page</p>
        <strong>{currentLabel}</strong>
      </div>
    </section>
  )
}

export const MobileBackbar = memo(MobileBackbarComponent)
