// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Precision Price Handling
// High-precision arithmetic for deep decimal assets (8-12 dp)
// ═══════════════════════════════════════════════════════════════

/**
 * Format price with adaptive decimal precision based on magnitude.
 * Prevents floating-point display errors on rapidly updating prices.
 */
export function formatPrice(price: number, forceDecimals?: number): string {
  if (forceDecimals !== undefined) {
    return price.toFixed(forceDecimals)
  }
  if (price >= 100_000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1_000)  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 100)    return price.toFixed(2)
  if (price >= 10)     return price.toFixed(3)
  if (price >= 1)      return price.toFixed(4)
  if (price >= 0.01)   return price.toFixed(6)
  return price.toFixed(8)
}

/**
 * Format large numbers compactly (1.2B, 48.2M, 12.4K)
 */
export function formatVolume(vol: number): string {
  if (vol >= 1e12) return `${(vol / 1e12).toFixed(2)}T`
  if (vol >= 1e9)  return `${(vol / 1e9).toFixed(2)}B`
  if (vol >= 1e6)  return `${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3)  return `${(vol / 1e3).toFixed(1)}K`
  return vol.toFixed(0)
}

/**
 * Calculate percentage change avoiding floating-point drift
 */
export function pctChange(from: number, to: number): number {
  if (from === 0) return 0
  return ((to - from) / from) * 100
}

/**
 * Compute a "nice" step size for axis labels
 */
export function niceStep(raw: number): number {
  if (raw <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const r = raw / mag
  if (r < 1.5) return mag
  if (r < 3.5) return 2 * mag
  if (r < 7.5) return 5 * mag
  return 10 * mag
}

/**
 * Compute a nice time-axis step in milliseconds
 */
export function niceTimeStep(rangeMs: number): number {
  const STEPS = [
    60_000,       // 1m
    300_000,      // 5m
    900_000,      // 15m
    1_800_000,    // 30m
    3_600_000,    // 1h
    14_400_000,   // 4h
    86_400_000,   // 1d
    604_800_000,  // 1w
  ]
  return STEPS.find(s => s >= rangeMs) ?? STEPS[STEPS.length - 1]
}

/**
 * Format timestamp for axis display
 */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })
}
