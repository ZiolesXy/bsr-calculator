import levels from '../data/levels.json'
import type { MaterialCounts, MaterialMode, PassiveResult, ResourceColor, SkillType } from '../types'

export const levelMilestones: number[] = levels.characterLevels
export const skillLevels: number[] = levels.skillLevels
export const skillTypes = [
  'basic',
  'skill',
  'counter',
  'ultimate',
  'battlefield-skill',
  'entry-skill',
] as const satisfies readonly SkillType[]
export const materialModes: Array<{ value: MaterialMode; label: string }> = [
  { value: 'green', label: 'Green only' },
  { value: 'blue', label: 'Blue only' },
  { value: 'purple', label: 'Purple only' },
  { value: 'yellow', label: 'Yellow only' },
  { value: 'mixed', label: 'Mixed recommendation' },
]

export function sumRangeCosts<T extends Record<string, number | Record<string, number>>>(
  source: T,
  from: number,
  to: number,
) {
  let total = 0

  for (const start of levelMilestones) {
    const next = levelMilestones[levelMilestones.indexOf(start) + 1]
    if (!next || start < from || next > to) continue

    const key = `${start}-${next}` as keyof T
    const value = source[key]
    if (typeof value === 'number') {
      total += value
    }
  }

  return total
}

export function calculatePassiveTotals(
  passiveData: Record<string, { omamori: number; kans: number }>,
  current: number,
  target: number,
): PassiveResult {
  let omamori = 0
  let kans = 0

  for (let level = current + 1; level <= target; level += 1) {
    const row = passiveData[String(level)]
    if (!row) continue
    omamori += row.omamori
    kans += row.kans
  }

  return { omamori, kans }
}

export function calculateOwnedExp(values: MaterialCounts, owned: MaterialCounts) {
  return (
    owned.green * values.green +
    owned.blue * values.blue +
    owned.purple * values.purple +
    owned.yellow * values.yellow
  )
}

export function calculateRecommendedMaterials(
  missingExp: number,
  values: MaterialCounts,
  mode: MaterialMode,
) {
  const emptyCounts: MaterialCounts = { green: 0, blue: 0, purple: 0, yellow: 0 }

  if (missingExp <= 0) {
    return {
      counts: emptyCounts,
      totalExp: 0,
      overshoot: 0,
      percentages: emptyCounts,
    }
  }

  if (mode !== 'mixed') {
    const count = Math.ceil(missingExp / values[mode])
    return {
      counts: { ...emptyCounts, [mode]: count },
      totalExp: count * values[mode],
      overshoot: count * values[mode] - missingExp,
      percentages: { ...emptyCounts, [mode]: 100 },
    }
  }

  const orderedColors: ResourceColor[] = ['green', 'blue', 'purple', 'yellow']
  const maxValue = Math.max(...orderedColors.map((color) => values[color]))
  const target = missingExp + maxValue
  const dp = Array<number>(target + 1).fill(Number.POSITIVE_INFINITY)
  const prev = Array<{ amount: number; color: ResourceColor } | null>(target + 1).fill(null)

  dp[0] = 0

  for (let amount = 1; amount <= target; amount += 1) {
    for (const color of orderedColors) {
      const value = values[color]
      if (amount < value || !Number.isFinite(dp[amount - value])) continue

      const nextCount = dp[amount - value] + 1
      if (nextCount < dp[amount]) {
        dp[amount] = nextCount
        prev[amount] = { amount: amount - value, color }
      }
    }
  }

  let bestAmount = missingExp
  for (let amount = missingExp; amount <= target; amount += 1) {
    if (!Number.isFinite(dp[amount])) continue
    const bestOvershoot = bestAmount - missingExp
    const currentOvershoot = amount - missingExp
    if (
      currentOvershoot < bestOvershoot ||
      (currentOvershoot === bestOvershoot && dp[amount] < dp[bestAmount])
    ) {
      bestAmount = amount
    }
  }

  const counts = { ...emptyCounts }
  let currentAmount = bestAmount

  while (currentAmount > 0) {
    const step = prev[currentAmount]
    if (!step) break
    counts[step.color] += 1
    currentAmount = step.amount
  }

  const totalItems = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const percentages = orderedColors.reduce(
    (acc, color) => {
      acc[color] = totalItems > 0 ? (counts[color] / totalItems) * 100 : 0
      return acc
    },
    { ...emptyCounts },
  )

  return {
    counts,
    totalExp: bestAmount,
    overshoot: bestAmount - missingExp,
    percentages,
  }
}
