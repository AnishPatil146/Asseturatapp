// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Institutional Chart Renderers (Phase 1 + 2)
//
// ANTI-BLUR DIRECTIVE:
// • All 1px strokes use half-pixel alignment (x + 0.5)
// • Canvas dimensions are scaled by devicePixelRatio
// • No shadowBlur on thin lines — only on glowing overlays
//
// • Hollow vs. solid candles based on prev-close
// • 1px crisp wicks with half-pixel aligned centers
// • Volume at bottom 20%, 40% opacity, semantic candle color
// • Glowing last-price line with pill badge
// • Pill-shaped crosshair axis labels
// ═══════════════════════════════════════════════════════════════

import type { OHLCV, ChartType } from './types'
import { CoordinateMapper } from './CoordinateMapper'
import { THEME } from './theme'
import { formatPrice, niceStep, niceTimeStep, formatTime, formatDate } from './precision'

// ── Half-pixel snap utility (ANTI-BLUR) ──────────────────────
// For 1px strokes: snap to x.5 so the stroke straddles exactly
// one physical pixel row/column instead of two blurry ones.
function snap(v: number): number {
  return Math.round(v) + 0.5
}
// For fills / rects: snap to nearest integer pixel
function snapF(v: number): number {
  return Math.round(v)
}

// ── Heikin Ashi computation ─────────────────────────────────
export function computeHeikinAshi(candles: OHLCV[]): OHLCV[] {
  if (candles.length === 0) return []
  const ha: OHLCV[] = []
  let prevOpen = candles[0].open
  let prevClose = (candles[0].open + candles[0].high + candles[0].low + candles[0].close) / 4

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]
    const haClose = (c.open + c.high + c.low + c.close) / 4
    const haOpen = (prevOpen + prevClose) / 2
    const haHigh = Math.max(c.high, haOpen, haClose)
    const haLow = Math.min(c.low, haOpen, haClose)

    ha.push({
      timestamp: c.timestamp,
      open: haOpen, high: haHigh, low: haLow, close: haClose,
      volume: c.volume,
    })

    prevOpen = haOpen
    prevClose = haClose
  }
  return ha
}

// ── Grid & Axes Renderer ────────────────────────────────────
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  barMs: number,
): void {
  const { chartWidth, chartHeight, padTop, padLeft } = mapper

  // Horizontal price grid lines (half-pixel for crispness)
  const yRange = mapper.yMax - mapper.yMin
  const pStep = niceStep(yRange / 7)
  const pStart = Math.ceil(mapper.yMin / pStep) * pStep

  for (let p = pStart; p <= mapper.yMax + pStep; p += pStep) {
    const rawY = mapper.yPx(p)
    if (rawY < padTop || rawY > padTop + chartHeight) continue
    const y = snap(rawY)

    ctx.strokeStyle = THEME.grid
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padLeft, y)
    ctx.lineTo(padLeft + chartWidth, y)
    ctx.stroke()

    // Price label on right axis
    ctx.fillStyle = THEME.textMuted
    ctx.font = `11px ${THEME.fontMono}`
    ctx.textAlign = 'left'
    ctx.fillText(formatPrice(p), padLeft + chartWidth + 8, rawY + 3.5)
  }

  // Vertical time grid lines (half-pixel)
  const tRange = mapper.pxToTime(padLeft + chartWidth) - mapper.pxToTime(padLeft)
  const tStep = niceTimeStep(tRange / 6)
  const tStart = Math.ceil(mapper.pxToTime(padLeft) / tStep) * tStep

  ctx.textAlign = 'center'
  for (let t = tStart; t <= mapper.pxToTime(padLeft + chartWidth); t += tStep) {
    const rawX = mapper.xPx(t)
    if (rawX < padLeft + 4 || rawX > padLeft + chartWidth - 4) continue
    const x = snap(rawX)

    ctx.strokeStyle = THEME.grid
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, padTop)
    ctx.lineTo(x, padTop + chartHeight)
    ctx.stroke()

    ctx.fillStyle = THEME.textMuted
    ctx.font = `11px ${THEME.fontMono}`
    const label = tStep < 86_400_000 ? formatTime(t) : formatDate(t)
    ctx.fillText(label, rawX, mapper.height - 6)
  }

  // Axis border lines (half-pixel crisp)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  const axisX = snap(padLeft + chartWidth)
  ctx.beginPath()
  ctx.moveTo(axisX, padTop)
  ctx.lineTo(axisX, padTop + chartHeight)
  ctx.stroke()
  const axisY = snap(padTop + chartHeight)
  ctx.beginPath()
  ctx.moveTo(padLeft, axisY)
  ctx.lineTo(padLeft + chartWidth, axisY)
  ctx.stroke()
}

// ── Volume Overlay (bottom 20%, 40% opacity) ─────────────────
export function drawVolume(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  candles: OHLCV[],
  barMs: number,
): void {
  const volHeight = mapper.chartHeight * 0.20
  const volBase = mapper.padTop + mapper.chartHeight
  let maxVol = 0
  for (const c of candles) if (c.volume > maxVol) maxVol = c.volume
  if (maxVol === 0) maxVol = 1
  const cw = mapper.candleWidth(barMs)

  ctx.globalAlpha = 0.40
  for (const c of candles) {
    const x = mapper.xPx(c.timestamp)
    const h = (c.volume / maxVol) * volHeight
    const isBull = c.close >= c.open
    ctx.fillStyle = isBull ? THEME.bull : THEME.bear
    const bx = snapF(x - cw / 2)
    const by = snapF(volBase - h)
    const bw = Math.max(1, snapF(cw))
    const bh = snapF(h)

    // Rounded top corners for premium feel
    if (cw >= 4) {
      const rx = Math.min(1.5, cw / 4)
      ctx.beginPath()
      ctx.moveTo(bx + rx, by)
      ctx.lineTo(bx + bw - rx, by)
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + rx)
      ctx.lineTo(bx + bw, volBase)
      ctx.lineTo(bx, volBase)
      ctx.lineTo(bx, by + rx)
      ctx.quadraticCurveTo(bx, by, bx + rx, by)
      ctx.fill()
    } else {
      ctx.fillRect(bx, by, bw, bh)
    }
  }
  ctx.globalAlpha = 1
}

// ── Candlestick Renderer (Premium: hollow vs. solid) ────────
export function drawCandlestick(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  candles: OHLCV[],
  barMs: number,
): void {
  const cw = mapper.candleWidth(barMs)

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]
    const rawX = mapper.xPx(c.timestamp)
    const isBull = c.close >= c.open

    // Determine hollow: close > prev close → hollow bull
    const prevClose = i > 0 ? candles[i - 1].close : c.open
    const isHollow = isBull && c.close > prevClose && cw >= 4

    const color = isBull ? THEME.bull : THEME.bear
    const oY = mapper.yPx(c.open)
    const cY = mapper.yPx(c.close)
    const hY = mapper.yPx(c.high)
    const lY = mapper.yPx(c.low)
    const bodyTop = Math.min(oY, cY)
    const bodyH = Math.max(1, Math.abs(oY - cY))

    // ── Wick — ALWAYS 1px, half-pixel aligned for razor sharpness ──
    const wickX = snap(rawX)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.8
    // Upper wick
    ctx.beginPath()
    ctx.moveTo(wickX, snapF(hY))
    ctx.lineTo(wickX, snapF(bodyTop))
    ctx.stroke()
    // Lower wick
    ctx.beginPath()
    ctx.moveTo(wickX, snapF(bodyTop + bodyH))
    ctx.lineTo(wickX, snapF(lY))
    ctx.stroke()
    ctx.globalAlpha = 1

    // ── Body ──
    if (cw < 2) {
      // Tiny candle — just a line
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(wickX, snapF(bodyTop))
      ctx.lineTo(wickX, snapF(bodyTop + bodyH))
      ctx.stroke()
    } else if (isHollow) {
      // Hollow candle — stroke only, no fill
      const bx = snapF(rawX - cw / 2)
      const bw = snapF(cw)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.2
      ctx.strokeRect(bx + 0.5, snapF(bodyTop) + 0.5, bw - 1, snapF(bodyH) - 1)
    } else {
      // Solid candle — filled rect
      const bx = snapF(rawX - cw / 2)
      const bw = snapF(cw)
      ctx.fillStyle = color
      ctx.fillRect(bx, snapF(bodyTop), bw, snapF(bodyH))
    }
  }
}

// ── Bar Chart Renderer (OHLC bars) ──────────────────────────
export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  candles: OHLCV[],
  barMs: number,
): void {
  const cw = mapper.candleWidth(barMs)
  const halfW = Math.max(2, cw * 0.4)

  for (const c of candles) {
    const rawX = mapper.xPx(c.timestamp)
    const x = snap(rawX)
    const color = c.close >= c.open ? THEME.bull : THEME.bear
    const hY = snap(mapper.yPx(c.high))
    const lY = snap(mapper.yPx(c.low))
    const oY = snap(mapper.yPx(c.open))
    const cY = snap(mapper.yPx(c.close))

    ctx.strokeStyle = color
    ctx.lineWidth = Math.max(1, cw * 0.12)

    // Vertical line
    ctx.beginPath()
    ctx.moveTo(x, hY)
    ctx.lineTo(x, lY)
    ctx.stroke()
    // Open tick (left)
    ctx.beginPath()
    ctx.moveTo(x - halfW, oY)
    ctx.lineTo(x, oY)
    ctx.stroke()
    // Close tick (right)
    ctx.beginPath()
    ctx.moveTo(x, cY)
    ctx.lineTo(x + halfW, cY)
    ctx.stroke()
  }
}

// ── Line Chart Renderer (Binance-gold accent) ───────────────
export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  candles: OHLCV[],
): void {
  if (candles.length < 2) return

  ctx.strokeStyle = THEME.blue
  ctx.lineWidth = 1.8
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = THEME.blue
  ctx.shadowBlur = 4

  ctx.beginPath()
  ctx.moveTo(mapper.xPx(candles[0].timestamp), mapper.yPx(candles[0].close))
  for (let i = 1; i < candles.length; i++) {
    ctx.lineTo(mapper.xPx(candles[i].timestamp), mapper.yPx(candles[i].close))
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

// ── Area Chart Renderer (buttery gradient — blue accent) ────
export function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  candles: OHLCV[],
): void {
  if (candles.length < 2) return

  const baseline = mapper.padTop + mapper.chartHeight

  // Premium gradient: 30% opacity at line → 0% at baseline
  const grad = ctx.createLinearGradient(0, mapper.padTop, 0, baseline)
  grad.addColorStop(0, 'rgba(79,142,247,0.28)')
  grad.addColorStop(0.35, 'rgba(79,142,247,0.12)')
  grad.addColorStop(0.7, 'rgba(79,142,247,0.04)')
  grad.addColorStop(1, 'rgba(79,142,247,0.00)')

  ctx.beginPath()
  ctx.moveTo(mapper.xPx(candles[0].timestamp), baseline)
  ctx.lineTo(mapper.xPx(candles[0].timestamp), mapper.yPx(candles[0].close))
  for (let i = 1; i < candles.length; i++) {
    ctx.lineTo(mapper.xPx(candles[i].timestamp), mapper.yPx(candles[i].close))
  }
  ctx.lineTo(mapper.xPx(candles[candles.length - 1].timestamp), baseline)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  // Line on top with subtle glow
  ctx.strokeStyle = THEME.blue
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = THEME.blue
  ctx.shadowBlur = 6

  ctx.beginPath()
  ctx.moveTo(mapper.xPx(candles[0].timestamp), mapper.yPx(candles[0].close))
  for (let i = 1; i < candles.length; i++) {
    ctx.lineTo(mapper.xPx(candles[i].timestamp), mapper.yPx(candles[i].close))
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

// ── Baseline Chart Renderer ─────────────────────────────────
export function drawBaselineChart(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  candles: OHLCV[],
  baselinePrice?: number,
): void {
  if (candles.length < 2) return

  const mid = baselinePrice ?? candles[0].close
  const midY = mapper.yPx(mid)

  // Baseline reference line (half-pixel crisp)
  const snapMidY = snap(midY)
  ctx.strokeStyle = THEME.textMuted
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(mapper.padLeft, snapMidY)
  ctx.lineTo(mapper.padLeft + mapper.chartWidth, snapMidY)
  ctx.stroke()
  ctx.setLineDash([])

  // Above baseline (bullish fill)
  ctx.save()
  ctx.beginPath()
  ctx.rect(mapper.padLeft, mapper.padTop, mapper.chartWidth, midY - mapper.padTop)
  ctx.clip()
  const gradAbove = ctx.createLinearGradient(0, mapper.padTop, 0, midY)
  gradAbove.addColorStop(0, 'rgba(0,230,118,0.22)')
  gradAbove.addColorStop(1, 'rgba(0,230,118,0.0)')
  ctx.beginPath()
  ctx.moveTo(mapper.xPx(candles[0].timestamp), midY)
  for (const c of candles) ctx.lineTo(mapper.xPx(c.timestamp), mapper.yPx(c.close))
  ctx.lineTo(mapper.xPx(candles[candles.length - 1].timestamp), midY)
  ctx.closePath()
  ctx.fillStyle = gradAbove
  ctx.fill()
  ctx.restore()

  // Below baseline (bearish fill)
  ctx.save()
  ctx.beginPath()
  ctx.rect(mapper.padLeft, midY, mapper.chartWidth, mapper.padTop + mapper.chartHeight - midY)
  ctx.clip()
  const gradBelow = ctx.createLinearGradient(0, midY, 0, mapper.padTop + mapper.chartHeight)
  gradBelow.addColorStop(0, 'rgba(255,59,105,0.0)')
  gradBelow.addColorStop(1, 'rgba(255,59,105,0.22)')
  ctx.beginPath()
  ctx.moveTo(mapper.xPx(candles[0].timestamp), midY)
  for (const c of candles) ctx.lineTo(mapper.xPx(c.timestamp), mapper.yPx(c.close))
  ctx.lineTo(mapper.xPx(candles[candles.length - 1].timestamp), midY)
  ctx.closePath()
  ctx.fillStyle = gradBelow
  ctx.fill()
  ctx.restore()

  // Price line
  ctx.strokeStyle = THEME.text
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(mapper.xPx(candles[0].timestamp), mapper.yPx(candles[0].close))
  for (let i = 1; i < candles.length; i++) {
    ctx.lineTo(mapper.xPx(candles[i].timestamp), mapper.yPx(candles[i].close))
  }
  ctx.stroke()
}

// ── Last Price Line (Glowing, semantic) ─────────────────────
export function drawLastPriceLine(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  lastCandle: OHLCV,
): void {
  const rawY = mapper.yPx(lastCandle.close)
  const y = snap(rawY) // half-pixel for crisp 1px dashes
  const isBull = lastCandle.close >= lastCandle.open
  const color = isBull ? THEME.bull : THEME.bear

  // Glowing dashed price line
  ctx.save()
  ctx.strokeStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 4
  ctx.globalAlpha = 0.7
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(mapper.padLeft, y)
  ctx.lineTo(mapper.padLeft + mapper.chartWidth, y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  // Pill-shaped price badge on right axis
  const badgeX = mapper.padLeft + mapper.chartWidth + 2
  const badgeW = mapper.padRight - 4
  const badgeH = 18
  const radius = 3
  const byCtr = rawY

  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 6
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(badgeX + radius, byCtr - badgeH / 2)
  ctx.lineTo(badgeX + badgeW - radius, byCtr - badgeH / 2)
  ctx.quadraticCurveTo(badgeX + badgeW, byCtr - badgeH / 2, badgeX + badgeW, byCtr - badgeH / 2 + radius)
  ctx.lineTo(badgeX + badgeW, byCtr + badgeH / 2 - radius)
  ctx.quadraticCurveTo(badgeX + badgeW, byCtr + badgeH / 2, badgeX + badgeW - radius, byCtr + badgeH / 2)
  ctx.lineTo(badgeX + radius, byCtr + badgeH / 2)
  ctx.quadraticCurveTo(badgeX, byCtr + badgeH / 2, badgeX, byCtr + badgeH / 2 - radius)
  ctx.lineTo(badgeX, byCtr - badgeH / 2 + radius)
  ctx.quadraticCurveTo(badgeX, byCtr - badgeH / 2, badgeX + radius, byCtr - badgeH / 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#000'
  ctx.font = `bold 11px ${THEME.fontMono}`
  ctx.textAlign = 'left'
  ctx.fillText(formatPrice(lastCandle.close), badgeX + 5, byCtr + 3.5)
}

// ── Crosshair Renderer (pill labels, half-pixel lines) ──────
export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  mx: number,
  my: number,
  price: number,
  timestamp: number,
): void {
  const { padLeft, chartWidth, chartHeight, padTop, padRight } = mapper

  // Half-pixel aligned crosshair for razor sharpness
  const cx = snap(mx)
  const cy = snap(my)

  ctx.strokeStyle = THEME.crosshair
  ctx.lineWidth = 1
  ctx.setLineDash([3, 4])

  // Vertical line
  ctx.beginPath()
  ctx.moveTo(cx, padTop)
  ctx.lineTo(cx, padTop + chartHeight)
  ctx.stroke()
  // Horizontal line
  ctx.beginPath()
  ctx.moveTo(padLeft, cy)
  ctx.lineTo(padLeft + chartWidth, cy)
  ctx.stroke()
  ctx.setLineDash([])

  // ── Pill-shaped price badge on right axis ──
  const badgeX = padLeft + chartWidth + 2
  const badgeW = padRight - 4
  const badgeH = 18
  const r = 3

  ctx.fillStyle = THEME.crosshairBg
  ctx.strokeStyle = THEME.borderLight
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(badgeX + r, my - badgeH / 2)
  ctx.lineTo(badgeX + badgeW - r, my - badgeH / 2)
  ctx.quadraticCurveTo(badgeX + badgeW, my - badgeH / 2, badgeX + badgeW, my - badgeH / 2 + r)
  ctx.lineTo(badgeX + badgeW, my + badgeH / 2 - r)
  ctx.quadraticCurveTo(badgeX + badgeW, my + badgeH / 2, badgeX + badgeW - r, my + badgeH / 2)
  ctx.lineTo(badgeX + r, my + badgeH / 2)
  ctx.quadraticCurveTo(badgeX, my + badgeH / 2, badgeX, my + badgeH / 2 - r)
  ctx.lineTo(badgeX, my - badgeH / 2 + r)
  ctx.quadraticCurveTo(badgeX, my - badgeH / 2, badgeX + r, my - badgeH / 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = THEME.text
  ctx.font = `11px ${THEME.fontMono}`
  ctx.textAlign = 'left'
  ctx.fillText(formatPrice(price), badgeX + 5, my + 3.5)

  // ── Pill-shaped time badge on bottom axis ──
  const tw = 56
  const th = 16
  const tx = mx - tw / 2
  const ty = padTop + chartHeight + 2

  ctx.fillStyle = THEME.crosshairBg
  ctx.strokeStyle = THEME.borderLight
  ctx.beginPath()
  ctx.moveTo(tx + r, ty)
  ctx.lineTo(tx + tw - r, ty)
  ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + r)
  ctx.lineTo(tx + tw, ty + th - r)
  ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - r, ty + th)
  ctx.lineTo(tx + r, ty + th)
  ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - r)
  ctx.lineTo(tx, ty + r)
  ctx.quadraticCurveTo(tx, ty, tx + r, ty)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = THEME.text
  ctx.font = `11px ${THEME.fontMono}`
  ctx.textAlign = 'center'
  ctx.fillText(formatTime(timestamp), mx, ty + 12)
}

// ── Overlay Indicator Renderer ──────────────────────────────
export function drawIndicatorOverlay(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  values: Float64Array,
  timestamps: Float64Array,
  color: string,
  lineWidth: number = 1.2,
): void {
  if (values.length < 2) return

  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.85

  let started = false
  ctx.beginPath()
  for (let i = 0; i < values.length; i++) {
    if (isNaN(values[i]) || values[i] === 0) continue
    const x = mapper.xPx(timestamps[i])
    const y = mapper.yPx(values[i])
    if (!started) {
      ctx.moveTo(x, y)
      started = true
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

// ── Master Render Dispatch ──────────────────────────────────
export function renderChart(
  ctx: CanvasRenderingContext2D,
  mapper: CoordinateMapper,
  candles: OHLCV[],
  chartType: ChartType,
  barMs: number,
  baselinePrice?: number,
): void {
  const visible = mapper.getVisibleCandles(candles, barMs)

  // Background
  ctx.fillStyle = THEME.bg
  ctx.fillRect(0, 0, mapper.width, mapper.height)

  // Grid
  drawGrid(ctx, mapper, barMs)

  // Volume (always rendered)
  drawVolume(ctx, mapper, visible, barMs)

  // Apply Heikin Ashi transform if needed
  let renderCandles = visible
  if (chartType === 'heikinashi') {
    const allHA = computeHeikinAshi(candles)
    renderCandles = mapper.getVisibleCandles(allHA, barMs)
  }

  // Dispatch to chart-type renderer
  switch (chartType) {
    case 'candlestick':
      drawCandlestick(ctx, mapper, renderCandles, barMs)
      break
    case 'bar':
      drawBarChart(ctx, mapper, renderCandles, barMs)
      break
    case 'line':
      drawLineChart(ctx, mapper, renderCandles)
      break
    case 'area':
      drawAreaChart(ctx, mapper, renderCandles)
      break
    case 'heikinashi':
      drawCandlestick(ctx, mapper, renderCandles, barMs)
      break
    case 'baseline':
      drawBaselineChart(ctx, mapper, renderCandles, baselinePrice)
      break
  }

  // Last price line
  if (candles.length > 0) {
    const last = chartType === 'heikinashi'
      ? computeHeikinAshi(candles).slice(-1)[0]
      : candles[candles.length - 1]
    if (last) drawLastPriceLine(ctx, mapper, last)
  }
}
