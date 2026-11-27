import { ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useCountUp } from '../../hooks/useCountUp'
import { useResponsive } from '../../hooks/useResponsive'
import type { ResourceColor } from '../../types'
import { formatNumber } from '../../utils/formatter'

const rarityLabels: Record<ResourceColor, string> = {
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  yellow: 'Yellow',
}

export type ResultHeroData = {
  label: string
  value: number
  hint?: string
  /** Fraction of the requirement already covered, 0-1. */
  progress?: number
}

type ResultPanelProps = {
  eyebrow?: string
  hero?: ResultHeroData
  children: ReactNode
  note?: string
}

export function ResultPanel({ eyebrow = 'Output', hero, children, note }: ResultPanelProps) {
  const { isMobile } = useResponsive()
  const [expanded, setExpanded] = useState(false)
  const open = !isMobile || expanded

  return (
    <section className="panel result-panel" data-expanded={open} aria-label="Calculation results">
      <header className="result-panel__head">
        <span className="result-panel__eyebrow">{eyebrow}</span>
        {isMobile && (
          <button
            type="button"
            className="result-panel__toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((previous) => !previous)}
          >
            {expanded ? 'Hide details' : 'Details'}
            <ChevronUp aria-hidden="true" className={expanded ? 'is-open' : undefined} />
          </button>
        )}
      </header>

      {hero && <ResultHero {...hero} />}

      <div className="result-panel__body">
        {children}
        {note && <p className="result-panel__note">{note}</p>}
      </div>
    </section>
  )
}

export function ResultHero({ label, value, hint, progress }: ResultHeroData) {
  const display = useCountUp(value)
  const covered = progress === undefined ? undefined : Math.max(0, Math.min(1, progress))

  return (
    <div className="result-hero">
      <span className="result-hero__label">{label}</span>
      <strong className="result-hero__value num">{formatNumber(display)}</strong>
      {hint && <span className="result-hero__hint">{hint}</span>}

      <span className="reiatsu-line" key={value} aria-hidden="true">
        <span style={{ width: covered === undefined ? '100%' : `${covered * 100}%` }} />
      </span>

      {covered !== undefined && (
        <span className="result-hero__progress num">{Math.round(covered * 100)}% covered</span>
      )}
    </div>
  )
}

type ResultGroupProps = {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function ResultGroup({ title, action, children }: ResultGroupProps) {
  return (
    <section className="result-group">
      <header className="result-group__header">
        <h3>{title}</h3>
        {action}
      </header>
      <div className="result-group__rows">{children}</div>
    </section>
  )
}

type ResultRowProps = {
  label: string
  value: number | string
  hint?: string
  tone?: 'muted' | 'accent' | 'danger'
}

export function ResultRow({ label, value, hint, tone }: ResultRowProps) {
  return (
    <div className="result-row" data-tone={tone}>
      <span className="result-row__label">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <strong className="result-row__value num">
        {typeof value === 'number' ? formatNumber(value) : value}
      </strong>
    </div>
  )
}

type RarityChipItem = {
  color: ResourceColor
  value: number
  percent?: number
}

type RarityChipsProps = {
  items: RarityChipItem[]
  emptyLabel?: string
}

export function RarityChips({ items, emptyLabel = 'Nothing needed' }: RarityChipsProps) {
  const active = items.filter((item) => item.value > 0)

  if (active.length === 0) return <p className="result-empty">{emptyLabel}</p>

  return (
    <div className="rarity-chips">
      {active.map((item) => (
        <span key={item.color} className={`rarity-chip rarity-chip--${item.color}`}>
          <span className="rarity-chip__dot" aria-hidden="true" />
          <span className="rarity-chip__label">{rarityLabels[item.color]}</span>
          <strong className="num">{formatNumber(item.value)}</strong>
          {item.percent !== undefined && <small className="num">{item.percent.toFixed(0)}%</small>}
        </span>
      ))}
    </div>
  )
}
