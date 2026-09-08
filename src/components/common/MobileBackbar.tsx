import { memo } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type MobileBackbarProps = {
  backLabel?: string
  currentLabel: string
  onBack: () => void
}

function MobileBackbarComponent({ backLabel = 'Back to main menu', currentLabel, onBack }: MobileBackbarProps) {
  return (
    <Card className="mobile-backbar">
      <Button variant="ghost" onClick={onBack} className="mobile-backbar__button">
        {backLabel}
      </Button>
      <div>
        <p className="ui-eyebrow">Current Page</p>
        <strong>{currentLabel}</strong>
      </div>
    </Card>
  )
}

export const MobileBackbar = memo(MobileBackbarComponent)
