type Rgb = { r: number; g: number; b: number }

const BLACK: Rgb = { r: 11, g: 12, b: 15 }
const WHITE: Rgb = { r: 255, g: 255, b: 255 }

function parseHex(input: string): Rgb | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim())
  if (!match) return null

  const value =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((char) => char + char)
          .join('')
      : match[1]

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function channelToHex(value: number) {
  const clamped = Math.max(0, Math.min(255, Math.round(value)))
  return clamped.toString(16).padStart(2, '0')
}

export function rgbToHex({ r, g, b }: Rgb) {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`
}

function toRgb(input: string): Rgb {
  return parseHex(input) ?? BLACK
}

export function relativeLuminance(input: string) {
  const { r, g, b } = toRgb(input)
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

export function contrastRatio(a: string, b: string) {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)

  return (lighter + 0.05) / (darker + 0.05)
}

export function isDarkColor(input: string) {
  return relativeLuminance(input) < 0.18
}

export function mixColors(from: string, to: string, amount: number) {
  const a = toRgb(from)
  const b = toRgb(to)
  const ratio = Math.max(0, Math.min(1, amount))

  return rgbToHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  })
}

/** Highest-contrast ink to place on top of a solid fill. */
export function pickOnColor(background: string) {
  return contrastRatio(background, rgbToHex(BLACK)) >= contrastRatio(background, rgbToHex(WHITE))
    ? rgbToHex(BLACK)
    : rgbToHex(WHITE)
}

/**
 * Keep the theme's brand hue recognisable while guaranteeing readable text.
 * The palette in themes.json is never rewritten; only a derived text token is produced.
 */
export function readableBrand(brand: string, surface: string, minimum = 4.5) {
  if (contrastRatio(brand, surface) >= minimum) return brand

  const target = isDarkColor(surface) ? rgbToHex(WHITE) : rgbToHex(BLACK)

  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixColors(brand, target, step * 0.05)
    if (contrastRatio(candidate, surface) >= minimum) return candidate
  }

  return mixColors(brand, target, 1)
}

export function withAlpha(color: string, alpha: number) {
  const { r, g, b } = toRgb(color)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
