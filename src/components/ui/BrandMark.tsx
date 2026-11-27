type BrandMarkProps = {
  className?: string
}

export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.8 21.2 12 12 21.2 2.8 12z" strokeWidth="1.5" opacity="0.55" />
      <path d="M12 6.6 17.4 12 12 17.4 6.6 12z" strokeWidth="1.6" />
      <path d="M12 9.6 14.4 12 12 14.4 9.6 12z" strokeWidth="1.8" />
      <path d="M12 2.8V6.6M12 17.4v3.8M2.8 12h3.8M17.4 12h3.8" strokeWidth="1.2" opacity="0.7" />
    </svg>
  )
}
