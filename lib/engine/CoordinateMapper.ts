// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Coordinate Mapper
// Sub-pixel-precise mapping between data space and pixel space
// ═══════════════════════════════════════════════════════════════

import type { OHLCV, ChartViewport } from './types'

export class CoordinateMapper {
  // Viewport in data coordinates
  xMin: number
  xMax: number
  yMin: number
  yMax: number

  // Canvas dimensions (CSS pixels)
  width: number
  height: number

  // Padding (CSS pixels)
  padLeft: number
  padRight: number
  padTop: number
  padBottom: number

  // Device pixel ratio for sub-pixel rendering
  dpr: number

  constructor(
    viewport: ChartViewport,
    width: number,
    height: number,
    dpr: number = 1,
    padLeft = 0,
    padRight = 72,
    padTop = 16,
    padBottom = 28,
  ) {
    this.xMin = viewport.xMin
    this.xMax = viewport.xMax
    this.yMin = viewport.yMin
    this.yMax = viewport.yMax
    this.width = width
    this.height = height
    this.dpr = dpr
    this.padLeft = padLeft
    this.padRight = padRight
    this.padTop = padTop
    this.padBottom = padBottom
  }

  /** Chart drawing area width in CSS pixels */
  get chartWidth(): number {
    return this.width - this.padLeft - this.padRight
  }

  /** Chart drawing area height in CSS pixels */
  get chartHeight(): number {
    return this.height - this.padTop - this.padBottom
  }

  /** Data timestamp → X pixel (CSS space, sub-pixel aligned) */
  xPx(timestamp: number): number {
    const range = this.xMax - this.xMin || 1
    const x = this.padLeft + ((timestamp - this.xMin) / range) * this.chartWidth
    return Math.round(x * this.dpr) / this.dpr  // snap to physical pixel
  }

  /** Data price → Y pixel (CSS space, sub-pixel aligned) */
  yPx(price: number): number {
    const range = this.yMax - this.yMin || 1
    const y = this.padTop + (1 - (price - this.yMin) / range) * this.chartHeight
    return Math.round(y * this.dpr) / this.dpr  // snap to physical pixel
  }

  /** X pixel → data timestamp */
  pxToTime(x: number): number {
    const range = this.xMax - this.xMin || 1
    return this.xMin + ((x - this.padLeft) / this.chartWidth) * range
  }

  /** Y pixel → data price */
  pxToPrice(y: number): number {
    const range = this.yMax - this.yMin || 1
    return this.yMin + (1 - (y - this.padTop) / this.chartHeight) * range
  }

  /** Candle body width in CSS pixels for a given bar interval */
  candleWidth(barMs: number): number {
    const range = this.xMax - this.xMin || 1
    return Math.max(1.5, (barMs / range) * this.chartWidth * 0.75)
  }

  /** Update viewport coordinates */
  updateViewport(partial: Partial<ChartViewport>): void {
    if (partial.xMin !== undefined) this.xMin = partial.xMin
    if (partial.xMax !== undefined) this.xMax = partial.xMax
    if (partial.yMin !== undefined) this.yMin = partial.yMin
    if (partial.yMax !== undefined) this.yMax = partial.yMax
  }

  /** Get visible candles from array (with small buffer) */
  getVisibleCandles(candles: OHLCV[], barMs: number): OHLCV[] {
    const buffer = barMs * 5
    const tMin = this.pxToTime(this.padLeft) - buffer
    const tMax = this.pxToTime(this.padLeft + this.chartWidth) + buffer
    return candles.filter(c => c.timestamp >= tMin && c.timestamp <= tMax)
  }

  /** Auto-fit Y axis to visible candle range with padding */
  autoScaleY(visibleCandles: OHLCV[], paddingPct: number = 0.1): void {
    if (visibleCandles.length === 0) return
    let lo = Infinity
    let hi = -Infinity
    for (const c of visibleCandles) {
      if (c.low < lo) lo = c.low
      if (c.high > hi) hi = c.high
    }
    const pad = (hi - lo) * paddingPct || hi * 0.05
    this.yMin = lo - pad
    this.yMax = hi + pad
  }

  /** Get viewport snapshot */
  getViewport(): ChartViewport {
    return {
      xMin: this.xMin,
      xMax: this.xMax,
      yMin: this.yMin,
      yMax: this.yMax,
    }
  }
}

/**
 * Build an initial mapper from candle data
 */
export function buildMapper(
  candles: OHLCV[],
  width: number,
  height: number,
  visibleBars: number = 120,
  barMs: number = 300_000,
): CoordinateMapper {
  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio || 1, 3)
    : 1

  if (candles.length === 0) {
    return new CoordinateMapper(
      { xMin: 0, xMax: 1, yMin: 0, yMax: 1 },
      width, height, dpr,
    )
  }

  const vis = candles.slice(-visibleBars)
  let lo = Infinity, hi = -Infinity
  for (const c of vis) {
    if (c.low < lo) lo = c.low
    if (c.high > hi) hi = c.high
  }
  const pad = (hi - lo) * 0.1 || hi * 0.05

  return new CoordinateMapper(
    {
      xMin: vis[0].timestamp,
      xMax: vis[vis.length - 1].timestamp + barMs * 4,
      yMin: lo - pad,
      yMax: hi + pad,
    },
    width, height, dpr,
  )
}
