import { useEffect, useRef, useState } from 'react'

/**
 * Eases a number towards its next value so totals feel like a live gauge.
 * Respects prefers-reduced-motion and never runs on first mount.
 */
export function useCountUp(value: number, duration = 460) {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = displayRef.current

    if (reduceMotion || duration <= 0 || from === value) {
      displayRef.current = value
      setDisplay(value)
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      const next = from + (value - from) * eased

      displayRef.current = next
      setDisplay(next)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        displayRef.current = value
        setDisplay(value)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [duration, value])

  return display
}
