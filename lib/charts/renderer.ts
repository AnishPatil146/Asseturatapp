// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/charts/renderer.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { OHLCV, ChartOptions, ChartTheme, ChartPadding } from './types'
import { ASSETURA_THEME, DEFAULT_PADDING } from './types'

function priceRange(data: OHLCV[], pct = 0.08) {
    let min = Infinity, max = -Infinity
    for (const d of data) {
        if (d.l < min) min = d.l
        if (d.h > max) max = d.h
    }
    const pad = (max - min) * pct
    return { min: min - pad, max: max + pad }
}

function defaultTimeLabel(ts: number, data: OHLCV[]): string {
    if (data.length < 2) return ''
    const span = data[data.length - 1].t - data[0].t
    const dt = new Date(ts)
    if (span < 86_400_000) {
        return dt.getHours().toString().padStart(2, '0') + ':' + dt.getMinutes().toString().padStart(2, '0')
    } else if (span < 86_400_000 * 90) {
        return dt.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
    return dt.toLocaleDateString([], { month: 'short', year: '2-digit' })
}

export function drawChart(
    ctx: CanvasRenderingContext2D,
    data: OHLCV[],
    opts: ChartOptions,
    hoveredIndex: number | null,
): void {
    const theme: ChartTheme = opts.theme ?? ASSETURA_THEME
    const monoFont = opts.monoFont ?? 'DM Mono, monospace'
    const gridLines = opts.gridLines ?? 5
    const pad: ChartPadding = { ...DEFAULT_PADDING, ...opts.padding }

    const W = ctx.canvas.width
    const H = ctx.canvas.height
    const cW = W - pad.left - pad.right
    const cH = H - pad.top - pad.bottom

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = theme.bg2
    ctx.fillRect(0, 0, W, H)

    if (!data.length) return

    const { min: minP, max: maxP } = priceRange(data)
    const maxVol = Math.max(...data.map(d => d.v))

    const toX = (i: number) => pad.left + ((i + 0.5) / data.length) * cW
    const toY = (p: number) => pad.top + cH - ((p - minP) / (maxP - minP)) * cH

    // ── Grid + Y labels ─────────────────────────────────────────────────────
    ctx.lineWidth = 0.5
    ctx.strokeStyle = theme.border
    ctx.fillStyle = theme.muted
    ctx.textAlign = 'right'
    ctx.font = `11px ${monoFont}`

    for (let i = 0; i <= gridLines; i++) {
        const p = minP + (maxP - minP) * (i / gridLines)
        const y = toY(p)
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke()
        const label = opts.priceFormat ? opts.priceFormat(p) : `$${p.toFixed(2)}`
        ctx.fillText(label, pad.left - 6, y + 4)
    }

    // ── X labels ────────────────────────────────────────────────────────────
    const labelStep = Math.max(1, Math.floor(data.length / 8))
    ctx.textAlign = 'center'
    ctx.font = `11px ${monoFont}`
    ctx.fillStyle = theme.muted

    for (let i = 0; i < data.length; i++) {
        if (i % labelStep !== 0) continue
        const label = opts.timeFormat
            ? opts.timeFormat(data[i].t, data)
            : defaultTimeLabel(data[i].t, data)
        ctx.fillText(label, toX(i), H - pad.bottom + 16)
    }

    // ── Clip ────────────────────────────────────────────────────────────────
    ctx.save()
    ctx.beginPath()
    ctx.rect(pad.left, pad.top, cW, cH)
    ctx.clip()

    // ── Volume overlay ──────────────────────────────────────────────────────
    if (opts.showVolumeBars && opts.type !== 'bar' && maxVol > 0) {
        const ratio = opts.volumeHeightRatio ?? 0.15
        const bw = Math.max(1, Math.min(6, (cW / data.length) * 0.5))
        for (let i = 0; i < data.length; i++) {
            const barH = (data[i].v / maxVol) * cH * ratio
            ctx.fillStyle = data[i].c >= data[i].o ? 'rgba(0,212,160,0.2)' : 'rgba(255,77,106,0.2)'
            ctx.fillRect(toX(i) - bw / 2, pad.top + cH - barH, bw, barH)
        }
    }

    // ── Main chart ──────────────────────────────────────────────────────────
    switch (opts.type) {
        case 'candle': renderCandles(ctx, data, toX, toY, cW, theme); break
        case 'line': renderLine(ctx, data, toX, toY, theme); break
        case 'area': renderArea(ctx, data, toX, toY, pad, cH, theme); break
        case 'bar': renderVolumeBars(ctx, data, toX, pad, cH, maxVol, cW, theme); break
    }

    // ── Crosshair ───────────────────────────────────────────────────────────
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < data.length) {
        const x = toX(hoveredIndex)
        ctx.strokeStyle = theme.border2
        ctx.lineWidth = 0.5
        ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke()
        ctx.setLineDash([])
        if (opts.type !== 'bar') {
            const y = toY(data[hoveredIndex].c)
            ctx.fillStyle = theme.green
            ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill()
        }
    }

    // ── Live pulse on last candle ───────────────────────────────────────────
    if (data.length > 0 && opts.type !== 'bar') {
        const last = data[data.length - 1]
        const x = toX(data.length - 1)
        const y = toY(last.c)
        ctx.fillStyle = theme.green
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill()
    }

    ctx.restore()

    // ── Border ──────────────────────────────────────────────────────────────
    ctx.strokeStyle = theme.border
    ctx.lineWidth = 1
    ctx.strokeRect(pad.left, pad.top, cW, cH)
}

// ── Renderers ────────────────────────────────────────────────────────────────

function renderCandles(
    ctx: CanvasRenderingContext2D,
    data: OHLCV[],
    toX: (i: number) => number,
    toY: (p: number) => number,
    cW: number,
    theme: ChartTheme,
) {
    const bw = Math.max(2, Math.min(14, (cW / data.length) * 0.6))
    for (let i = 0; i < data.length; i++) {
        const d = data[i]
        const x = toX(i)
        const bull = d.c >= d.o
        const col = bull ? theme.green : theme.red
        ctx.strokeStyle = col; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x, toY(d.h)); ctx.lineTo(x, toY(d.l)); ctx.stroke()
        ctx.fillStyle = col
        const bodyTop = toY(Math.max(d.o, d.c))
        const bodyH = Math.max(1, Math.abs(toY(d.o) - toY(d.c)))
        ctx.fillRect(x - bw / 2, bodyTop, bw, bodyH)
    }
}

function renderLine(
    ctx: CanvasRenderingContext2D,
    data: OHLCV[],
    toX: (i: number) => number,
    toY: (p: number) => number,
    theme: ChartTheme,
) {
    ctx.beginPath(); ctx.strokeStyle = theme.green; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
    for (let i = 0; i < data.length; i++) {
        i === 0 ? ctx.moveTo(toX(i), toY(data[i].c)) : ctx.lineTo(toX(i), toY(data[i].c))
    }
    ctx.stroke()
}

function renderArea(
    ctx: CanvasRenderingContext2D,
    data: OHLCV[],
    toX: (i: number) => number,
    toY: (p: number) => number,
    pad: ChartPadding,
    cH: number,
    theme: ChartTheme,
) {
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH)
    grad.addColorStop(0, 'rgba(0,212,160,0.22)')
    grad.addColorStop(1, 'rgba(0,212,160,0.01)')
    ctx.beginPath()
    ctx.moveTo(toX(0), pad.top + cH)
    for (let i = 0; i < data.length; i++) ctx.lineTo(toX(i), toY(data[i].c))
    ctx.lineTo(toX(data.length - 1), pad.top + cH)
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle = theme.green; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
    for (let i = 0; i < data.length; i++) {
        i === 0 ? ctx.moveTo(toX(i), toY(data[i].c)) : ctx.lineTo(toX(i), toY(data[i].c))
    }
    ctx.stroke()
}

function renderVolumeBars(
    ctx: CanvasRenderingContext2D,
    data: OHLCV[],
    toX: (i: number) => number,
    pad: ChartPadding,
    cH: number,
    maxVol: number,
    cW: number,
    theme: ChartTheme,
) {
    if (maxVol === 0) return
    const bw = Math.max(2, Math.min(12, (cW / data.length) * 0.65))
    for (let i = 0; i < data.length; i++) {
        const d = data[i]
        const barH = (d.v / maxVol) * cH * 0.92
        ctx.fillStyle = d.c >= d.o ? 'rgba(0,212,160,0.75)' : 'rgba(255,77,106,0.75)'
        ctx.fillRect(toX(i) - bw / 2, pad.top + cH - barH, bw, barH)
    }
}