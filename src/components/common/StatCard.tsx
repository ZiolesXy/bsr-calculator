import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: string
  children?: ReactNode
  className?: string
}

export function StatCard({ label, value, children, className = '' }: StatCardProps) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
      {children}
    </div>
  )
}
