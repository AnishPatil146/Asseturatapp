'use client'

import { useEffect, useRef, useCallback, useState, useMemo, useLayoutEffect } from 'react'
import { wsManager } from '@/services/websocketManager'
import { generateCandles, mergeCandle, SYMBOL_CONFIG } from '@/services/candleProvider'
import type { NormalizedCandle } from '@/services/candleProvider'
import {
  T, BAR_MS, fmtPrice, fmtVol, Mapper, buildMapper,
  computeRSI, computeMACD, computeEMA, computeBB, computeVolProfile,
  drawGrid, drawCandles, drawLine, drawArea, drawVolume, drawLastPrice, drawCrosshair,
  drawRSI, drawMACD, drawEMA, drawBB, drawVolProfile,
  type ChartType, type IndicatorKey,
} from '@/lib/engine/ChartRenderer'

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W'
const TF_CFG: Record<Timeframe, { barMs: number; count: number }> = {
  '1m': { barMs: 60000, count: 120 }, '5m': { barMs: 300000, count: 120 },
  '15m': { barMs: 900000, count: 100 }, '1h': { barMs: 3600000, count: 120 },
  '4h': { barMs: 14400000, count: 80 }, '1D': { barMs: 86400000, count: 120 },
  '1W': { barMs: 604800000, count: 60 },
}
const CHART_TYPES: ChartType[] = ['candle', 'line', 'area', 'volume']
const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W']

const INDICATORS: { key: IndicatorKey; label: string; color: string }[] = [
  { key: 'ema9', label: 'EMA 9', color: T.ema9 },
  { key: 'ema21', label: 'EMA 21', color: T.ema21 },
  { key: 'ema50', label: 'EMA 50', color: T.ema50 },
  { key: 'ema200', label: 'EMA 200', color: T.ema200 },
  { key: 'bb', label: 'BB', color: T.bbUpper },
  { key: 'volProfile', label: 'Vol Profile', color: T.volProfile },
  { key: 'rsi', label: 'RSI', color: T.rsiLine },
  { key: 'macd', label: 'MACD', color: T.macdLine },
]

interface Props {
  assetType?: 'CRYPTO' | 'STOCKS' | 'FOREX' | 'OPTIONS'
  symbolOverride?: string
  labelOverride?: string
  basePriceOverride?: number
}

const s = { // style helpers
  btn: (a: boolean, c?: string): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
    border: `1px solid ${a ? T.btnBorder : 'transparent'}`, background: a ? T.btnActive : 'transparent',
    color: a ? (c || T.text) : T.textMuted, fontFamily: 'Inter,-apple-system,sans-serif',
    transition: 'all 0.2s', letterSpacing: '0.2px',
  }),
}

export default function AsseturaChart({ assetType = 'CRYPTO', symbolOverride, labelOverride, basePriceOverride }: Props) {
  const cfg = SYMBOL_CONFIG[assetType]
  const symbol = symbolOverride || cfg.symbol
  const label = labelOverride || cfg.label
  const basePrice = basePriceOverride ?? cfg.basePrice
  const provider = symbolOverride ? 'mock' as const : cfg.provider

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapperRef = useRef<Mapper | null>(null)
  const rafRef = useRef<number>(0)
  const isDirty = useRef(true)
  const dragRef = useRef({ active: false, startX: 0, startXMin: 0, startXMax: 0 })
  const symRef = useRef(symbol)
  const crosshairRef = useRef<{ mx: number; my: number; price: number; ts: number } | null>(null)

  const [candles, setCandles] = useState<NormalizedCandle[]>(() => generateCandles(basePrice, 200))
  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1h')
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(new Set(['rsi', 'macd']))
  const [size, setSize] = useState({ w: 900, h: 520 })
  const [status, setStatus] = useState<'connecting' | 'live' | 'mock'>('connecting')
  const [hud, setHud] = useState<{ visible: boolean; x: number; y: number; candle: NormalizedCandle | null }>({ visible: false, x: 0, y: 0, candle: null })

  const toggleIndicator = (k: IndicatorKey) => {
    setActiveIndicators(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
    isDirty.current = true
  }

  const tfCfg = TF_CFG[timeframe]
  const visCandles = useMemo(() => candles.slice(-tfCfg.count), [candles, tfCfg.count])

  const stats = useMemo(() => {
    if (!visCandles.length) return { open: 0, high: 0, low: 0, close: 0, volume: 0, change: 0, changePct: 0, isPos: true }
    const f = visCandles[0], l = visCandles[visCandles.length - 1], ch = l.close - f.open
    return { open: f.open, high: Math.max(...visCandles.map(c => c.high)), low: Math.min(...visCandles.map(c => c.low)),
      close: l.close, volume: visCandles.reduce((a, c) => a + c.volume, 0), change: ch, changePct: (ch / f.open) * 100, isPos: ch >= 0 }
  }, [visCandles])

  // Precompute all indicator data
  const ind = useMemo(() => ({
    rsi: computeRSI(visCandles), macd: computeMACD(visCandles),
    ema9: computeEMA(visCandles, 9), ema21: computeEMA(visCandles, 21),
    ema50: computeEMA(visCandles, 50), ema200: computeEMA(visCandles, 200),
    bb: computeBB(visCandles), volProfile: computeVolProfile(visCandles),
  }), [visCandles])

  useLayoutEffect(() => {
    const el = canvasRef.current?.parentElement; if (!el) return
    const measure = () => { const w = Math.floor(el.clientWidth) || 900, h = Math.floor(el.clientHeight) || 520; setSize(p => (p.w === w && p.h === h) ? p : { w, h }) }
    measure(); const ro = new ResizeObserver(() => measure()); ro.observe(el); return () => ro.disconnect()
  }, [])

  useEffect(() => { mapperRef.current = buildMapper(visCandles, size.w, size.h, tfCfg.barMs); isDirty.current = true }, [visCandles, size, tfCfg.barMs])

  useEffect(() => {
    symRef.current = symbol; setStatus('connecting')
    // Start with mock data immediately so the chart isn't blank
    setCandles(generateCandles(basePrice, 200, tfCfg.barMs))
    let cancelled = false

    // Map our timeframe to API interval format
    const intervalMap: Record<string, string> = { '1m':'1m','5m':'5m','15m':'15m','1h':'1h','4h':'4h','1D':'1D','1W':'1W' }
    const apiInterval = intervalMap[timeframe] || '1h'

    // Fetch real historical data
    fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${apiInterval}&limit=200`)
      .then(r => r.json())
      .then(data => {
        if (cancelled || symRef.current !== symbol) return
        if (data.candles && data.candles.length > 0) {
          const real: NormalizedCandle[] = data.candles.map((c: any) => ({
            time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume,
          }))
          setCandles(real)
          setStatus('live')
          isDirty.current = true
          console.log(`[AsseturaChart] Loaded ${real.length} real candles for ${symbol} via ${data.provider}`)
        } else {
          console.warn(`[AsseturaChart] No real data for ${symbol}, using simulated`)
          setStatus('mock')
        }
      })
      .catch(err => {
        if (cancelled) return
        console.warn('[AsseturaChart] API fetch failed, using simulated:', err.message)
        setStatus('mock')
      })

    // Connect WebSocket for live updates
    wsManager.connect(symbol, provider, (msg) => {
      if (symRef.current !== symbol) return
      setCandles(prev => mergeCandle(prev, { time: msg.time, open: msg.open, high: msg.high, low: msg.low, close: msg.close, volume: msg.volume }))
      isDirty.current = true
    })

    return () => { cancelled = true; wsManager.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, provider, basePrice, assetType, timeframe, tfCfg.barMs])

  // Sub-pane layout
  const paneLayout = useMemo(() => {
    const subPanes: string[] = []
    if (activeIndicators.has('rsi')) subPanes.push('rsi')
    if (activeIndicators.has('macd')) subPanes.push('macd')
    const subH = subPanes.length > 0 ? Math.min(70, size.h * 0.13) : 0
    const mainH = size.h - subPanes.length * subH
    const panes = [{ type: 'main', y: 0, h: mainH }]
    let y = mainH
    for (const t of subPanes) { panes.push({ type: t, y, h: subH }); y += subH }
    return { mainH, panes }
  }, [activeIndicators, size.h])

  // Main render
  const draw = useCallback(() => {
    rafRef.current = requestAnimationFrame(draw)
    if (!isDirty.current) return; isDirty.current = false
    const canvas = canvasRef.current; if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = size.w, H = size.h
    const mapper = buildMapper(visCandles, W, paneLayout.mainH, tfCfg.barMs); mapperRef.current = mapper
    if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) { canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr) }
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H)
    if (!visCandles.length) return
    const vis = visCandles.filter(c => c.time >= mapper.pxX(mapper.chartL) - tfCfg.barMs * 3 && c.time <= mapper.pxX(mapper.chartR) + tfCfg.barMs * 3)

    // Volume Profile (behind everything)
    if (activeIndicators.has('volProfile')) drawVolProfile(ctx, mapper, ind.volProfile)

    drawGrid(ctx, mapper, visCandles, paneLayout.mainH)

    // Bollinger Bands (behind candles)
    if (activeIndicators.has('bb')) drawBB(ctx, mapper, vis, ind.bb)

    // EMAs
    if (activeIndicators.has('ema200')) drawEMA(ctx, mapper, vis, ind.ema200, T.ema200)
    if (activeIndicators.has('ema50')) drawEMA(ctx, mapper, vis, ind.ema50, T.ema50)
    if (activeIndicators.has('ema21')) drawEMA(ctx, mapper, vis, ind.ema21, T.ema21)
    if (activeIndicators.has('ema9')) drawEMA(ctx, mapper, vis, ind.ema9, T.ema9)

    // Main chart type
    if (chartType === 'candle') drawCandles(ctx, mapper, vis, tfCfg.barMs)
    else if (chartType === 'line') drawLine(ctx, mapper, vis)
    else if (chartType === 'area') drawArea(ctx, mapper, vis)
    else if (chartType === 'volume') drawVolume(ctx, mapper, vis)

    drawLastPrice(ctx, mapper, visCandles)

    const ch = crosshairRef.current
    if (ch && ch.my < paneLayout.mainH) drawCrosshair(ctx, mapper, ch, paneLayout.mainH)

    // Sub-panes
    for (const pane of paneLayout.panes) {
      if (pane.type === 'rsi') drawRSI(ctx, ind.rsi, visCandles, mapper, pane.y, pane.h)
      if (pane.type === 'macd') drawMACD(ctx, ind.macd.macd, ind.macd.signal, ind.macd.hist, visCandles, mapper, pane.y, pane.h)
    }
  }, [visCandles, size, chartType, paneLayout, ind, activeIndicators])

  useEffect(() => { rafRef.current = requestAnimationFrame(draw); return () => cancelAnimationFrame(rafRef.current) }, [draw])

  // Mouse
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const m = mapperRef.current; if (!m) return
    const r = e.currentTarget.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top
    const ts = m.pxX(mx), price = m.pxY(my)
    const near = visCandles.length > 0 ? visCandles.reduce((b, c) => Math.abs(c.time - ts) < Math.abs(b.time - ts) ? c : b, visCandles[0]) : null
    setHud({ visible: true, x: mx + 14 > size.w - 190 ? mx - 190 : mx + 14, y: Math.max(4, my - 90), candle: near })
    crosshairRef.current = { mx, my, price, ts }; isDirty.current = true
    if (dragRef.current.active) {
      const range = dragRef.current.startXMax - dragRef.current.startXMin, pxPerMs = (size.w - 82) / range
      const dMs = -(e.clientX - dragRef.current.startX) / pxPerMs
      m.update({ xMin: dragRef.current.startXMin + dMs, xMax: dragRef.current.startXMax + dMs }); isDirty.current = true
    }
  }, [visCandles, size])
  const onMouseDown = useCallback((e: React.MouseEvent) => { const m = mapperRef.current; if (!m) return; dragRef.current = { active: true, startX: e.clientX, startXMin: m.pxX(0), startXMax: m.pxX(size.w - 14) } }, [size])
  const onMouseUp = useCallback(() => { dragRef.current.active = false }, [])
  const onMouseLeave = useCallback(() => { dragRef.current.active = false; crosshairRef.current = null; isDirty.current = true; setHud(h => ({ ...h, visible: false })) }, [])
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault(); const m = mapperRef.current; if (!m) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), mx = e.clientX - r.left, pivot = m.pxX(mx), f = e.deltaY > 0 ? 1.12 : 0.88
    const cMin = m.pxX(0), cMax = m.pxX(size.w - 14), cR = cMax - cMin, nR = cR * f
    if (nR < BAR_MS * 8 || nR > BAR_MS * visCandles.length) return
    const xMin = pivot - (pivot - cMin) * f, xMax = pivot + (cMax - pivot) * f
    const v = visCandles.filter(c => c.time >= xMin && c.time <= xMax)
    const lo = v.length ? Math.min(...v.map(c => c.low)) : m.yMin, hi = v.length ? Math.max(...v.map(c => c.high)) : m.yMax
    const p = (hi - lo) * 0.12 || hi * 0.05; m.update({ xMin, xMax, yMin: lo - p, yMax: hi + p }); isDirty.current = true
  }, [visCandles, size])

  return (
    <div style={{ background: T.bg, borderRadius: '8px', border: `1px solid ${T.btnBorder}`, overflow: 'hidden', userSelect: 'none', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* ── Topbar ──────────────────────────────────────── */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.btnBorder}`, flexShrink: 0, background: T.bgPanel }}>
        {/* Row 1: Symbol + Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: T.textMuted, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Assetura Charts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: T.text }}>{label.split(/[·/]/)[0].trim()}</span>
            <span style={{ fontSize: '11px', color: T.textMuted }}>{label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontFamily: '"DM Mono",monospace', fontSize: '18px', fontWeight: 700, color: stats.isPos ? T.bull : T.bear, fontVariantNumeric: 'tabular-nums' }}>
              ${fmtPrice(stats.close)}
            </span>
            <span style={{ fontFamily: '"DM Mono",monospace', fontSize: '11px', color: stats.isPos ? T.bull : T.bear, fontVariantNumeric: 'tabular-nums' }}>
              {stats.isPos ? '▲' : '▼'} {stats.isPos ? '+' : ''}{stats.change.toFixed(2)} ({stats.changePct.toFixed(2)}%)
            </span>
          </div>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: status === 'live' ? T.bull : status === 'mock' ? '#4f8ef7' : T.textMuted, display: 'inline-block', boxShadow: status === 'live' ? `0 0 6px ${T.bull}` : 'none' }} />
            <span style={{ fontSize: '9px', color: T.textMuted, fontFamily: '"DM Mono",monospace', letterSpacing: '0.8px' }}>
              {status === 'live' ? 'LIVE' : status === 'mock' ? 'SIM' : '···'}
            </span>
          </div>
        </div>

        {/* Row 2: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
          {CHART_TYPES.map(ct => (
            <button key={ct} onClick={() => { setChartType(ct); isDirty.current = true }} style={s.btn(chartType === ct)}>
              {ct.charAt(0).toUpperCase() + ct.slice(1)}
            </button>
          ))}
          <div style={{ width: '1px', height: '16px', background: T.btnBorder, margin: '0 6px' }} />
          {INDICATORS.map(i => (
            <button key={i.key} onClick={() => toggleIndicator(i.key)} style={s.btn(activeIndicators.has(i.key), i.color)}>
              {i.label}
            </button>
          ))}
          <div style={{ width: '1px', height: '16px', background: T.btnBorder, margin: '0 6px' }} />
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => { setTimeframe(tf); isDirty.current = true }} style={s.btn(timeframe === tf)}>{tf}</button>
          ))}
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
          onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave} onWheel={onWheel} />
        {/* HUD */}
        {hud.visible && hud.candle && (
          <div style={{ position: 'absolute', left: hud.x, top: hud.y, background: T.hud, border: `1px solid ${T.hudBorder}`,
            borderRadius: '6px', padding: '8px 12px', pointerEvents: 'none', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99, minWidth: '155px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontFamily: '"DM Mono",monospace', fontSize: '9px', color: T.textMuted, letterSpacing: '0.5px' }}>{label.split(/[·/]/)[0].trim()}</span>
              <span style={{ fontFamily: '"DM Mono",monospace', fontSize: '11px', fontWeight: 600, color: hud.candle.close >= hud.candle.open ? T.bull : T.bear }}>
                {hud.candle.close >= hud.candle.open ? '▲' : '▼'} {fmtPrice(hud.candle.close)}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
              {([['O', hud.candle.open, T.text], ['H', hud.candle.high, T.bull], ['L', hud.candle.low, T.bear], ['C', hud.candle.close, T.text]] as [string, number, string][]).map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '8px', color: T.textMuted, fontFamily: '"DM Mono",monospace', minWidth: '7px' }}>{l}</span>
                  <span style={{ fontSize: '10px', color: c, fontFamily: '"DM Mono",monospace', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtPrice(v)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '8px', color: T.textDim, fontFamily: '"DM Mono",monospace' }}>
              {new Date(hud.candle.time).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Stats ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: T.btnBorder, flexShrink: 0 }}>
        {([
          { label: 'Open', value: '$' + fmtPrice(stats.open), color: T.text },
          { label: 'High', value: '$' + fmtPrice(stats.high), color: T.bull },
          { label: 'Low', value: '$' + fmtPrice(stats.low), color: T.bear },
          { label: 'Volume', value: fmtVol(stats.volume), color: T.text },
        ]).map(x => (
          <div key={x.label} style={{ background: T.bgCard, padding: '8px 14px' }}>
            <div style={{ fontSize: '9px', color: T.textMuted, fontWeight: 500, marginBottom: '2px', letterSpacing: '0.4px' }}>{x.label}</div>
            <div style={{ fontFamily: '"DM Mono",monospace', fontSize: '14px', fontWeight: 600, color: x.color, fontVariantNumeric: 'tabular-nums' }}>{x.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}