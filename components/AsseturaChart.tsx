'use client'

// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Institutional Canvas Chart Engine
// 60+ FPS • Canvas2D • Sub-pixel rendering • Kinetic interactions
// Multi-chart-type hot-swap • Indicator overlays
// ═══════════════════════════════════════════════════════════════

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useLayoutEffect,
} from 'react'

import { useTradingStore } from '@/lib/store/useTradingStore'
import { wsManager } from '@/services/websocketManager'
import { generateCandles, mergeCandle, SYMBOL_CONFIG } from '@/services/candleProvider'
import type { NormalizedCandle } from '@/services/candleProvider'
import { CoordinateMapper, buildMapper } from '@/lib/engine/CoordinateMapper'
import { renderChart, drawCrosshair, drawIndicatorOverlay } from '@/lib/engine/renderers'
import { THEME } from '@/lib/engine/theme'
import { formatPrice, formatTime, formatDateTime, pctChange } from '@/lib/engine/precision'
import type { OHLCV, ChartType } from '@/lib/engine/types'

const BAR_MS = 5 * 60 * 1000

const CHART_TYPES: { type: ChartType; label: string }[] = [
  { type: 'candlestick', label: 'Candle' },
  { type: 'bar',         label: 'OHLC' },
  { type: 'line',        label: 'Line' },
  { type: 'area',        label: 'Area' },
  { type: 'heikinashi',  label: 'Heikin' },
  { type: 'baseline',    label: 'Baseline' },
]

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M']

interface Props {
  assetType?: 'CRYPTO' | 'STOCKS' | 'FOREX' | 'OPTIONS'
  height?: number
  symbolOverride?: string
  labelOverride?: string
  basePriceOverride?: number
}

export default function AsseturaChart({
  assetType = 'CRYPTO',
  height = 520,
  symbolOverride,
  labelOverride,
  basePriceOverride,
}: Props) {
  const baseCfg = SYMBOL_CONFIG[assetType]
  const cfg = {
    symbol: symbolOverride ?? baseCfg.symbol,
    provider: baseCfg.provider,
    basePrice: basePriceOverride ?? baseCfg.basePrice,
    label: labelOverride ?? baseCfg.label,
  }

  const symbol = cfg.symbol
  const provider = cfg.provider

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapperRef = useRef<CoordinateMapper | null>(null)
  const rafRef = useRef<number>(0)
  const isDirty = useRef(true)
  const dragRef = useRef({ active: false, startX: 0, startXMin: 0, startXMax: 0 })
  const symRef = useRef(symbol)
  const crosshairRef = useRef<{
    mx: number; my: number; price: number; ts: number; visible: boolean
  } | null>(null)
  const kineticRef = useRef({ velocity: 0, lastTime: 0, lastX: 0, animating: false })

  // State
  const [candles, setCandles] = useState<NormalizedCandle[]>([])
  const [mounted, setMounted] = useState(false)
  const [size, setSize] = useState({ w: 900, h: height })
  const [status, setStatus] = useState<'connecting' | 'live' | 'simulated'>('connecting')

  // Global store
  const chartType = useTradingStore(s => s.chartType)
  const setChartType = useTradingStore(s => s.setChartType)
  const timeframe = useTradingStore(s => s.timeframe)
  const setTimeframe = useTradingStore(s => s.setTimeframe)
  const indicatorResults = useTradingStore(s => s.indicatorResults)
  const indicatorConfigs = useTradingStore(s => s.indicatorConfigs)

  // HUD
  const [hud, setHud] = useState<{
    visible: boolean; x: number; y: number;
    candle: NormalizedCandle | null
  }>({ visible: false, x: 0, y: 0, candle: null })

  // ── Initialize ──────────────────────────────────────────
  useEffect(() => {
    setCandles(generateCandles(cfg.basePrice, 200))
    setMounted(true)
  }, [cfg.basePrice])

  // ── Measure container ──────────────────────────────────
  useLayoutEffect(() => {
    const el = canvasRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width) || 900
      setSize({ w, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  // ── Rebuild mapper ──────────────────────────────────────
  useEffect(() => {
    if (!candles.length) return
    const ohlcv: OHLCV[] = candles.map(c => ({
      timestamp: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }))
    mapperRef.current = buildMapper(ohlcv, size.w, size.h, 120, BAR_MS)
    isDirty.current = true
  }, [candles, size])

  // ── Sync candles to global store ───────────────────────
  useEffect(() => {
    if (!candles.length) return
    const ohlcv: OHLCV[] = candles.map(c => ({
      timestamp: c.time,
      open: c.open, high: c.high, low: c.low,
      close: c.close, volume: c.volume,
    }))
    useTradingStore.getState().setCandles(ohlcv)
  }, [candles])

  // ── WebSocket ──────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    symRef.current = symbol
    setStatus('connecting')

    wsManager.connect(symbol, provider, (msg) => {
      if (symRef.current !== symbol) return
      const nc: NormalizedCandle = {
        time: msg.time,
        open: msg.open,
        high: msg.high,
        low: msg.low,
        close: msg.close,
        volume: msg.volume,
      }
      setCandles(prev => mergeCandle(prev, nc))
      setStatus(provider === 'binance' ? 'live' : 'simulated')
      isDirty.current = true
    })

    return () => { wsManager.disconnect() }
  }, [symbol, provider, mounted])

  // ── Main Render Loop ──────────────────────────────────
  const draw = useCallback(() => {
    rafRef.current = requestAnimationFrame(draw)

    // Kinetic scrolling
    const kin = kineticRef.current
    if (kin.animating && Math.abs(kin.velocity) > 0.1) {
      const mapper = mapperRef.current
      if (mapper) {
        const range = mapper.xMax - mapper.xMin
        const pxPerMs = (size.w - 72) / (range || 1)
        const dMs = -kin.velocity / pxPerMs
        mapper.updateViewport({
          xMin: mapper.xMin + dMs,
          xMax: mapper.xMax + dMs,
        })
        kin.velocity *= 0.96  // friction
        isDirty.current = true
      }
    } else {
      kin.animating = false
    }

    if (!isDirty.current) return
    isDirty.current = false

    const canvas = canvasRef.current
    const mapper = mapperRef.current
    if (!canvas || !mapper || !candles.length) return

    const dpr = Math.min(window.devicePixelRatio || 1, 4)
    const W = size.w
    const H = size.h

    // Set canvas buffer size (physical pixels)
    const bufW = Math.floor(W * dpr)
    const bufH = Math.floor(H * dpr)
    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW
      canvas.height = bufH
    }

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Transform to CSS pixel space
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Convert to OHLCV
    const ohlcv: OHLCV[] = candles.map(c => ({
      timestamp: c.time,
      open: c.open, high: c.high, low: c.low,
      close: c.close, volume: c.volume,
    }))

    // Render chart
    renderChart(ctx, mapper, ohlcv, chartType, BAR_MS)

    // Render indicator overlays
    for (const result of indicatorResults) {
      const config = indicatorConfigs.find(c => c.id === result.id)
      if (!config || !config.visible || config.pane !== 'overlay') continue

      drawIndicatorOverlay(ctx, mapper, result.values, result.timestamps, config.color)

      // Bollinger bands — draw upper/lower
      if (result.type === 'bollinger' && result.extra) {
        if (result.extra.upper) {
          drawIndicatorOverlay(ctx, mapper, result.extra.upper, result.timestamps, config.color, 0.8)
        }
        if (result.extra.lower) {
          drawIndicatorOverlay(ctx, mapper, result.extra.lower, result.timestamps, config.color, 0.8)
        }
      }
    }

    // Crosshair
    const ch = crosshairRef.current
    if (ch && ch.visible) {
      drawCrosshair(ctx, mapper, ch.mx, ch.my, ch.price, ch.ts)
    }
  }, [candles, size, chartType, indicatorResults, indicatorConfigs])

  // ── Start render loop ─────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  // ── Mouse Handlers ────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const mapper = mapperRef.current
    if (!mapper) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const ts = mapper.pxToTime(mx)
    const price = mapper.pxToPrice(my)

    crosshairRef.current = { mx, my, price, ts, visible: true }
    isDirty.current = true

    // Find nearest candle for HUD
    const near = candles.length > 0
      ? candles.reduce((b, c) =>
          Math.abs(c.time - ts) < Math.abs(b.time - ts) ? c : b
        , candles[0])
      : null

    const hudX = mx + 14 > size.w - 210 ? mx - 210 : mx + 14
    setHud({ visible: true, x: hudX, y: Math.max(8, my - 80), candle: near })

    // Drag panning
    if (dragRef.current.active) {
      const range = dragRef.current.startXMax - dragRef.current.startXMin
      const pxPerMs = (size.w - 72) / (range || 1)
      const dMs = -(e.clientX - dragRef.current.startX) / pxPerMs

      mapper.updateViewport({
        xMin: dragRef.current.startXMin + dMs,
        xMax: dragRef.current.startXMax + dMs,
      })

      // Auto-scale Y
      const ohlcv: OHLCV[] = candles.map(c => ({
        timestamp: c.time, open: c.open, high: c.high,
        low: c.low, close: c.close, volume: c.volume,
      }))
      const vis = mapper.getVisibleCandles(ohlcv, BAR_MS)
      mapper.autoScaleY(vis)

      // Track velocity for kinetic scrolling
      const now = performance.now()
      const dt = now - kineticRef.current.lastTime
      if (dt > 0) {
        kineticRef.current.velocity = (e.clientX - kineticRef.current.lastX) / (dt / 16)
        kineticRef.current.lastTime = now
        kineticRef.current.lastX = e.clientX
      }

      isDirty.current = true
    }
  }, [candles, size])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const mapper = mapperRef.current
    if (!mapper) return
    kineticRef.current.animating = false
    kineticRef.current.velocity = 0
    kineticRef.current.lastTime = performance.now()
    kineticRef.current.lastX = e.clientX
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startXMin: mapper.xMin,
      startXMax: mapper.xMax,
    }
  }, [])

  const onMouseUp = useCallback(() => {
    if (dragRef.current.active) {
      // Start kinetic scrolling
      if (Math.abs(kineticRef.current.velocity) > 2) {
        kineticRef.current.animating = true
      }
    }
    dragRef.current.active = false
  }, [])

  const onMouseLeave = useCallback(() => {
    if (dragRef.current.active && Math.abs(kineticRef.current.velocity) > 2) {
      kineticRef.current.animating = true
    }
    dragRef.current.active = false
    crosshairRef.current = null
    isDirty.current = true
    setHud(h => ({ ...h, visible: false }))
  }, [])

  // ── CRITICAL: Scroll Lock & Zoom ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handler = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const mapper = mapperRef.current
      if (!mapper) return

      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const pivot = mapper.pxToTime(mx)

      // Exponential zoom scaling
      const factor = e.deltaY > 0 ? 1.08 : 0.92

      const curRange = mapper.xMax - mapper.xMin
      const newRange = curRange * factor
      if (newRange < BAR_MS * 8 || newRange > BAR_MS * candles.length * 2) return

      const xMin = pivot - (pivot - mapper.xMin) * factor
      const xMax = pivot + (mapper.xMax - pivot) * factor

      mapper.updateViewport({ xMin, xMax })

      // Auto-scale Y axis to visible range
      const ohlcv: OHLCV[] = candles.map(c => ({
        timestamp: c.time, open: c.open, high: c.high,
        low: c.low, close: c.close, volume: c.volume,
      }))
      const vis = mapper.getVisibleCandles(ohlcv, BAR_MS)
      mapper.autoScaleY(vis)

      isDirty.current = true
    }

    // passive: false is REQUIRED to enable preventDefault
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [candles])

  const lastCandle = candles[candles.length - 1]
  const lastPrice = lastCandle?.close ?? 0
  const isBull = lastCandle ? lastCandle.close >= lastCandle.open : true

  // ── Loading ───────────────────────────────────────────
  if (!mounted) {
    return (
      <div style={{
        background: THEME.bg,
        borderRadius: '6px',
        border: `1px solid ${THEME.border}`,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: THEME.fontMono,
        fontSize: '10px',
        color: THEME.textMuted,
        letterSpacing: '3px',
      }}>
        INITIALIZING ENGINE
      </div>
    )
  }

  return (
    <div style={{
      background: THEME.bg,
      borderRadius: '6px',
      border: `1px solid ${THEME.border}`,
      overflow: 'hidden',
      userSelect: 'none',
      position: 'relative',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.01), 0 2px 12px rgba(0,0,0,0.4)',
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        padding: '5px 14px',
        borderBottom: `1px solid ${THEME.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: THEME.bgPanel,
        flexWrap: 'wrap',
        minHeight: '36px',
      }}>
        {/* Symbol */}
        <span style={{
          fontFamily: THEME.fontMono,
          fontSize: '13px',
          fontWeight: 700,
          color: THEME.text,
          letterSpacing: '0.5px',
        }}>
          {cfg.label}
        </span>

        {/* Price */}
        <span style={{
          fontFamily: THEME.fontMono,
          fontSize: '13px',
          fontWeight: 600,
          color: isBull ? THEME.bull : THEME.bear,
        }}>
          {lastCandle ? formatPrice(lastCandle.close) : '---'}
        </span>

        {/* Change % */}
        {lastCandle && (
          <span style={{
            fontFamily: THEME.fontMono,
            fontSize: '11px',
            color: isBull ? THEME.bull : THEME.bear,
            padding: '1px 6px',
            borderRadius: '3px',
            background: isBull ? THEME.bullMuted : THEME.bearMuted,
          }}>
            {isBull ? '+' : ''}
            {pctChange(lastCandle.open, lastCandle.close).toFixed(2)}%
          </span>
        )}

        {/* Separator */}
        <div style={{ width: '1px', height: '18px', background: THEME.border, margin: '0 2px' }} />

        {/* Chart type buttons */}
        {CHART_TYPES.map(ct => {
          const isActive = chartType === ct.type
          return (
            <button
              key={ct.type}
              onClick={() => { setChartType(ct.type); isDirty.current = true }}
              title={ct.label}
              style={{
                padding: '3px 10px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                border: isActive
                  ? `1px solid ${THEME.borderFocus}`
                  : '1px solid transparent',
                background: isActive
                  ? THEME.bgSurface
                  : 'transparent',
                color: isActive
                  ? THEME.accent
                  : THEME.textMuted,
                fontFamily: THEME.fontMono,
                transition: 'all 0.15s',
                textShadow: isActive ? `0 0 6px ${THEME.accentGlow}` : 'none',
              }}
            >
              {ct.label}
            </button>
          )
        })}

        {/* Separator */}
        <div style={{ width: '1px', height: '18px', background: THEME.border, margin: '0 2px' }} />

        {/* Timeframe buttons */}
        {TIMEFRAMES.map(tf => {
          const isActive = timeframe === tf
          return (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '3px 7px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                border: 'none',
                background: isActive ? THEME.bgSurface : 'transparent',
                color: isActive ? THEME.accent : THEME.textMuted,
                fontFamily: THEME.fontMono,
                transition: 'all 0.12s',
                textShadow: isActive ? `0 0 6px ${THEME.accentGlow}` : 'none',
              }}
            >
              {tf}
            </button>
          )
        })}

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            display: 'inline-block',
            background: status === 'live'
              ? THEME.bull
              : status === 'simulated'
                ? THEME.blue
                : THEME.textMuted,
            animation: 'pulse 2s infinite',
            boxShadow: status === 'live' ? `0 0 6px ${THEME.bull}` : 'none',
          }} />
          <span style={{
            fontSize: '9px',
            color: THEME.textMuted,
            fontFamily: THEME.fontMono,
            letterSpacing: '1px',
          }}>
            {status === 'live' ? 'LIVE' : status === 'simulated' ? 'SIM' : 'CONN'}
          </span>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{ position: 'relative', width: '100%', height }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height,
            cursor: 'crosshair',
            touchAction: 'none',
          }}
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />

        {/* ── HUD Tooltip ── */}
        {hud.visible && hud.candle && (
          <div style={{
            position: 'absolute',
            left: hud.x,
            top: hud.y,
            background: THEME.hud,
            border: `1px solid ${THEME.hudBorder}`,
            borderRadius: '8px',
            padding: '10px 14px',
            pointerEvents: 'none',
            backdropFilter: 'blur(16px)',
            zIndex: 99,
            minWidth: '180px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '7px',
              paddingBottom: '6px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                fontFamily: THEME.fontMono,
                fontSize: '10px',
                color: THEME.textMuted,
                letterSpacing: '0.5px',
              }}>
                {cfg.label}
              </span>
              <span style={{
                fontFamily: THEME.fontMono,
                fontSize: '12px',
                fontWeight: 600,
                color: hud.candle.close >= hud.candle.open ? THEME.bull : THEME.bear,
              }}>
                {hud.candle.close >= hud.candle.open ? '▲' : '▼'}{' '}
                {formatPrice(hud.candle.close)}
              </span>
            </div>

            {/* OHLCV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
              {[
                { l: 'O', v: formatPrice(hud.candle.open), c: THEME.text },
                { l: 'H', v: formatPrice(hud.candle.high), c: THEME.bull },
                { l: 'L', v: formatPrice(hud.candle.low), c: THEME.bear },
                { l: 'C', v: formatPrice(hud.candle.close), c: THEME.text },
                { l: 'V', v: hud.candle.volume.toFixed(0), c: THEME.textMuted },
                {
                  l: 'Δ',
                  v: formatPrice(Math.abs(hud.candle.close - hud.candle.open)),
                  c: hud.candle.close >= hud.candle.open ? THEME.bull : THEME.bear,
                },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '9px', color: THEME.textMuted,
                    fontFamily: THEME.fontMono, minWidth: '10px',
                  }}>{l}</span>
                  <span style={{
                    fontSize: '11px', color: c,
                    fontFamily: THEME.fontMono, fontWeight: 500,
                  }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Timestamp */}
            <div style={{
              marginTop: '7px',
              paddingTop: '5px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              fontSize: '9px',
              color: THEME.textMuted,
              fontFamily: THEME.fontMono,
            }}>
              {formatDateTime(hud.candle.time)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}