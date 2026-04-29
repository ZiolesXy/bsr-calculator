import { memo } from 'react'

type MobileBackbarProps = {
  currentLabel: string
  onBack: () => void
}

function MobileBackbarComponent({ currentLabel, onBack }: MobileBackbarProps) {
  return (
    <section className="mobile-backbar panel panel--wide">
      <button type="button" className="mobile-backbar__button" onClick={onBack}>
        Back to main menu
      </button>
      <div>
        <p className="section-tag">Current Page</p>
        <strong>{currentLabel}</strong>
      </div>
    </section>
  )
}

export const MobileBackbar = memo(MobileBackbarComponent)
