import type { MaterialRecommendation } from '../../types'
import { formatNumber } from '../../utils/formatter'
import { StatCard } from './StatCard'

type RecommendationCardProps = {
  label: string
  recommendation: MaterialRecommendation
}

export function RecommendationCard({ label, recommendation }: RecommendationCardProps) {
  const activeColors = (['green', 'blue', 'purple', 'yellow'] as const).filter(
    (color) => recommendation.counts[color] > 0,
  )

  const countText =
    activeColors.map((color) => `${color} ${formatNumber(recommendation.counts[color])}`).join(' / ') ||
    'No materials needed'

  const percentageText = activeColors
    .map((color) => `${color} ${recommendation.percentages[color].toFixed(1)}%`)
    .join(' / ')

  return (
    <StatCard label={label} value={countText} className="stat-card--breakdown">
      {activeColors.length > 0 && <small>{percentageText}</small>}
    </StatCard>
  )
}
