// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/charts/indicators.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { OHLCV, ChartPadding } from './types'
import { DEFAULT_PADDING } from './types'

export function sma(data: OHLCV[], period: number): (number | null)[] {
    return data.map((_, i) => {
        if (i < period - 1) return null
        let sum = 0
        for (let j = i - period + 1; j <= i; j++) sum += data[j].c
        return sum / period
    })
}

export function ema(data: OHLCV[], period: number): (number | null)[] {
    const k = 2 / (period + 1)
    const result: (number | null)[] = new Array(data.length).fill(null)
    let prev: number | null = null
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) continue
        if (prev === null) {
            let sum = 0
            for (let j = 0; j < period; j++) sum += data[j].c
            prev = sum / period
        } else {
            prev = data[i].c * k + prev * (1 - k)
        }
        result[i] = prev
    }
    return result
}

export interface BollingerBands {
    upper: (number | null)[]
    middle: (number | null)[]
    lower: (number | null)[]
}

export function bollingerBands(data: OHLCV[], period = 20, mult = 2): BollingerBands {
    const middle = sma(data, period)
    const upper: (number | null)[] = []
    const lower: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
        if (middle[i] === null) { upper.push(null); lower.push(null); continue }
        let variance = 0
        for (let j = i - period + 1; j <= i; j++) variance += Math.pow(data[j].c - (middle[i] as number), 2)
        const sd = Math.sqrt(variance / period)
        upper.push((middle[i] as number) + mult * sd)
        lower.push((middle[i] as number) - mult * sd)
    }
    return { upper, middle, lower }
}

export function rsi(data: OHLCV[], period = 14): (number | null)[] {
    const result: (number | null)[] = new Array(data.length).fill(null)
    if (data.length < period + 1) return result
    let gains = 0, losses = 0
    for (let i = 1; i <= period; i++) {
        const delta = data[i].c - data[i - 1].c
        if (delta > 0) gains += delta; else losses -= delta
    }
    let avgGain = gains / period, avgLoss = losses / period
    for (let i = period; i < data.length; i++) {
        if (i === period) { result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss); continue }
        const delta = data[i].c - data[i - 1].c
        avgGain = (avgGain * (period - 1) + Math.max(0, delta)) / period
        avgLoss = (avgLoss * (period - 1) + Math.max(0, -delta)) / period
        result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
    }
    return result
}

export function vwap(data: OHLCV[]): number[] {
    let cumPV = 0, cumVol = 0
    return data.map(d => {
        const typical = (d.h + d.l + d.c) / 3
        cumPV += typical * d.v; cumVol += d.v
        return cumPV / cumVol
    })
}

export interface OverlayLine {
    values: (number | null)[]
    color: string
    lineWidth?: number
    dashed?: boolean
}

export function drawOverlays(
    ctx: CanvasRenderingContext2D,
    overlays: OverlayLine[],
    dataLength: number,
    minP: number,
    maxP: number,
    pad: ChartPadding = DEFAULT_PADDING,
) {
    const W = ctx.canvas.width, H = ctx.canvas.height
    const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom
    const toX = (i: number) => pad.left + ((i + 0.5) / dataLength) * cW
    const toY = (p: number) => pad.top + cH - ((p - minP) / (maxP - minP)) * cH

    ctx.save()
    ctx.beginPath(); ctx.rect(pad.left, pad.top, cW, cH); ctx.clip()

    for (const ov of overlays) {
        ctx.beginPath(); ctx.strokeStyle = ov.color; ctx.lineWidth = ov.lineWidth ?? 1
        if (ov.dashed) ctx.setLineDash([5, 3]); else ctx.setLineDash([])
        let started = false
        for (let i = 0; i < ov.values.length; i++) {
            const v = ov.values[i]
            if (v === null) { started = false; continue }
            if (!started) { ctx.moveTo(toX(i), toY(v)); started = true }
            else ctx.lineTo(toX(i), toY(v))
        }
        ctx.stroke()
    }
    ctx.setLineDash([]); ctx.restore()
}