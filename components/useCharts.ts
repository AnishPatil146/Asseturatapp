'use client'
// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/useChart.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useCallback, useState } from 'react'
import type { OHLCV, ChartOptions } from '@/lib/charts'
import { drawChart, resolveTooltip, formatTooltipRows, ASSETURA_THEME } from '@/lib/charts'
import type { TooltipData } from '@/lib/charts'

export interface UseChartOptions extends ChartOptions {
    width?: number
    height?: number
}

export interface UseChartReturn {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    tooltip: TooltipData | null
    tooltipRows: ReturnType<typeof formatTooltipRows>
}

export function useChart(data: OHLCV[], opts: UseChartOptions): UseChartReturn {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [tooltip, setTooltip] = useState<TooltipData | null>(null)
    const hoveredRef = useRef<number | null>(null)
    const rafRef = useRef<number>(0)
    const scaledRef = useRef(false)

    // Scale canvas for device pixel ratio (run once per resize)
    const scaleCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio ?? 1
        const w = opts.width ?? canvas.parentElement?.clientWidth ?? 800
        const h = opts.height ?? 340
        if (canvas.width === Math.round(w * dpr) && canvas.height === Math.round(h * dpr)) return
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        const ctx = canvas.getContext('2d')
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
        scaledRef.current = true
    }, [opts.width, opts.height])

    const redraw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        drawChart(ctx, data, { theme: ASSETURA_THEME, ...opts }, hoveredRef.current)
    }, [data, opts])

    // Scale + redraw on mount and when dimensions change
    useEffect(() => {
        scaleCanvas()
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(redraw)
        return () => cancelAnimationFrame(rafRef.current)
    }, [scaleCanvas, redraw])

    // Mouse events
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onMove = (e: MouseEvent) => {
            const tt = resolveTooltip(canvas, e.clientX, e.clientY, data)
            hoveredRef.current = tt?.index ?? null
            setTooltip(tt)
            cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(redraw)
        }
        const onLeave = () => {
            hoveredRef.current = null
            setTooltip(null)
            cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(redraw)
        }

        canvas.addEventListener('mousemove', onMove)
        canvas.addEventListener('mouseleave', onLeave)
        return () => {
            canvas.removeEventListener('mousemove', onMove)
            canvas.removeEventListener('mouseleave', onLeave)
        }
    }, [data, redraw])

    const tooltipRows = tooltip ? formatTooltipRows(tooltip.bar) : []
    return { canvasRef, tooltip, tooltipRows }
}