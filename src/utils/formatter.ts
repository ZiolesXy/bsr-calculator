export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(Math.max(0, Math.round(value)))
}
