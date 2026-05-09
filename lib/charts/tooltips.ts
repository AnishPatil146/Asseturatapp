// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/charts/tooltip.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { OHLCV, ChartPadding } from './types'
import { DEFAULT_PADDING } from './types'

export interface TooltipData {
    index: number
    bar: OHLCV
    x: number
}

export function resolveTooltip(
    canvasEl: HTMLCanvasElement,
    clientX: number,
    _clientY: number,
    data: OHLCV[],
    pad: ChartPadding = DEFAULT_PADDING,
): TooltipData | null {
    if (!data.length) return null
    const rect = canvasEl.getBoundingClientRect()
    const scaleX = canvasEl.width / rect.width
    const canvasX = (clientX - rect.left) * scaleX
    const cW = canvasEl.width - pad.left - pad.right
    if (canvasX < pad.left || canvasX > canvasEl.width - pad.right) return null
    const raw = (canvasX - pad.left) / cW * data.length - 0.5
    const idx = Math.min(data.length - 1, Math.max(0, Math.round(raw)))
    const x = pad.left + ((idx + 0.5) / data.length) * cW
    return { index: idx, bar: data[idx], x }
}

export function formatTooltipRows(
    bar: OHLCV,
    priceFormat: (p: number) => string = p => `$${p.toFixed(2)}`,
    volFormat: (v: number) => string = v => v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : `${(v / 1e3).toFixed(0)}K`,
): { label: string; value: string; up?: boolean }[] {
    const bull = bar.c >= bar.o
    return [
        { label: 'Open', value: priceFormat(bar.o) },
        { label: 'High', value: priceFormat(bar.h), up: true },
        { label: 'Low', value: priceFormat(bar.l), up: false },
        { label: 'Close', value: priceFormat(bar.c), up: bull },
        { label: 'Volume', value: volFormat(bar.v) },
    ]
}