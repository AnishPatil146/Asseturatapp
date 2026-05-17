'use client'

import { useEffect, useRef, useState } from 'react'
import { useMarketStore, type AssetType } from '@/lib/store/useMarketStore'
import Badge from './ui/Badge'
import AsseturaChart from '@/components/AsseturaChart'
import StockDetailModal from './StockDetailModel'

const INDICES = [
    { name: 'Nasdaq 100', code: 'NDX', price: '27,710.36', unit: 'USD', chg: '+0.94', color: '#2980b9', short: '100' },
    { name: 'Japan 225', code: 'NI225', price: '59,512.90', unit: 'JPY', chg: '+0.38', color: '#e74c3c', short: '225' },
    { name: 'SSE Composite', code: '000001', price: '4,112.15', unit: 'CNY', chg: '+0.11', color: '#c0392b', short: 'SSE' },
    { name: 'FTSE 100', code: 'UKX', price: '10,363.93', unit: 'GBP', chg: '-0.14', color: '#2c3e50', short: '100' },
    { name: 'DAX', code: 'DAX', price: '24,292.38', unit: 'EUR', chg: '+1.41', color: '#27ae60', short: 'DAX' },
    { name: 'CAC 40', code: 'PX1', price: '8,114.84', unit: 'EUR', chg: '+0.53', color: '#8e44ad', short: '40' },
]

const COINS = [
    { sym: 'Bitcoin', code: 'BTCUSD', price: '78,429', unit: 'USD', chg: '-0.33', color: '#f7931a', ic: '₿' },
    { sym: 'Ethereum', code: 'ETHUSD', price: '2,312.5', unit: 'USD', chg: '-0.18', color: '#627eea', ic: 'Ξ' },
    { sym: 'Solana', code: 'SOLUSD', price: '164.20', unit: 'USD', chg: '+1.24', color: '#9945ff', ic: '◎' },
]

const FUTURES = [
    { icon: '🛢', name: 'Light crude oil', code: 'CL1!', price: '101.94', unit: 'USD/barrel', chg: '-2.98' },
    { icon: '🔥', name: 'Natural gas', code: 'NG1!', price: '2.780', unit: 'USD/mmBTU', chg: '+0.47' },
    { icon: '🥇', name: 'Gold', code: 'GC1!', price: '4,644.5', unit: 'USD/oz', chg: '+0.12' },
    { icon: '🔶', name: 'Copper', code: 'HG1!', price: '5.9845', unit: 'USD/lb', chg: '+0.07' },
]

const INFL_DATA = [2.1, 2.4, 2.9, 3.5, 4.1, 4.8, 5.2, 5.8, 6.1, 5.4, 4.7, 3.9, 3.4, 3.1, 2.8, 2.6, 2.4, 2.7, 2.9, 3.1, 2.8, 2.5, 2.3, 2.2]
const INFL_MAX = Math.max(...INFL_DATA)

function generateLine(base: number, n: number, vol: number, trend = 0) {
    const d: number[] = []
    let v = base
    for (let i = 0; i < n; i++) {
        v += trend + (Math.random() - 0.5) * vol
        d.push(v)
    }
    return d
}

function drawArea(canvas: HTMLCanvasElement, data: number[], color: string, fill: string) {
    const W = canvas.offsetWidth || 200
    const H = canvas.offsetHeight || 60
    // 4K HiDPI: scale canvas buffer by devicePixelRatio for razor-sharp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 4)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx || data.length < 2) return
    // Scale all drawing operations to CSS-pixel space
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const mn = Math.min(...data) * 0.998
    const mx = Math.max(...data) * 1.002
    const rng = mx - mn || 1
    const px = (i: number) => i * (W / (data.length - 1))
    const py = (v: number) => H - ((v - mn) / rng) * H * 0.85 - H * 0.05
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, fill)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.moveTo(px(0), H)
    ctx.lineTo(px(0), py(data[0]))
    data.forEach((v, i) => { if (i > 0) ctx.lineTo(px(i), py(v)) })
    ctx.lineTo(px(data.length - 1), H)
    ctx.closePath()
    ctx.fillStyle = g
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(px(0), py(data[0]))
    data.forEach((v, i) => { if (i > 0) ctx.lineTo(px(i), py(v)) })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
}

const ASSET_TABS: AssetType[] = ['CRYPTO', 'STOCKS', 'FOREX', 'OPTIONS']

const ASSET_ICON: Record<AssetType, string> = {
    CRYPTO: '₿',
    STOCKS: 'S',
    FOREX: 'FX',
    OPTIONS: 'OP',
}

interface SelectedStock {
    symbol: string
    name: string
    price: number
    change: number
    color: string
}

export default function MarketSummary() {
    const { activeAsset, assets, setActiveAsset } = useMarketStore()
    const asset = assets[activeAsset]
    const isPos = asset.changePct >= 0

    const cryptoRef = useRef<HTMLCanvasElement>(null)
    const dxyRef = useRef<HTMLCanvasElement>(null)
    const yieldRef = useRef<HTMLCanvasElement>(null)

    const [cryptoData] = useState(() => generateLine(2.1, 80, 0.04, 0.006))
    const [dxyData] = useState(() => generateLine(100.5, 60, 0.2, -0.03))
    const [yieldData] = useState(() => generateLine(4.1, 60, 0.03, 0.004))
    const [livePrice, setLivePrice] = useState(asset.price)
    const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null)

    useEffect(() => {
        setLivePrice(assets[activeAsset].price)
    }, [activeAsset, assets])

    useEffect(() => {
        const id = setInterval(() => {
            setLivePrice((p) => p * (1 + (Math.random() - 0.499) * 0.0004))
        }, 600)
        return () => clearInterval(id)
    }, [activeAsset])

    useEffect(() => {
        const draw = () => {
            if (cryptoRef.current) drawArea(cryptoRef.current, cryptoData, '#00d4a0', 'rgba(0,212,160,0.15)')
            if (dxyRef.current) drawArea(dxyRef.current, dxyData, '#ff4d6a', 'rgba(255,77,106,0.15)')
            if (yieldRef.current) drawArea(yieldRef.current, yieldData, '#00d4a0', 'rgba(0,212,160,0.12)')
        }
        draw()
        window.addEventListener('resize', draw)
        return () => window.removeEventListener('resize', draw)
    }, [cryptoData, dxyData, yieldData])

    const fmt = (n: number) => activeAsset === 'FOREX' ? n.toFixed(4) : n.toFixed(2)

    return (
        <div style={{ padding: '0 20px 20px' }}>

            {/* Header */}
            <div style={{ padding: '12px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Market summary</span>
                <span style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer' }}>See all markets ›</span>
            </div>

            {/* Asset tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {ASSET_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveAsset(tab)}
                        style={{
                            padding: '4px 16px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: activeAsset === tab ? '1px solid var(--border2)' : '1px solid transparent',
                            background: activeAsset === tab ? 'var(--bg4)' : 'transparent',
                            color: activeAsset === tab ? 'var(--text)' : 'var(--text2)',
                            fontFamily: 'var(--font-sans)',
                            transition: 'all 0.15s',
                        }}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Top row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 280px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '12px',
                height: '460px',
                background: 'var(--bg2)',
            }}>

                {/* Hero panel */}
                <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'flex-start', gap: '12px', flexShrink: 0 }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: '#c0392b', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                            color: '#fff', flexShrink: 0,
                        }}>
                            {ASSET_ICON[activeAsset]}
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>
                                {asset.name} · {asset.symbol}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600,
                                color: isPos ? 'var(--green)' : 'var(--red)', lineHeight: 1.1,
                            }}>
                                {fmt(livePrice)}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: isPos ? 'var(--green)' : 'var(--red)' }}>
                                {isPos ? '+' : ''}{asset.changePct.toFixed(2)}%
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto' }}>
                            {[
                                { label: '24H HIGH', val: asset.high24h.toFixed(2) },
                                { label: '24H LOW', val: asset.low24h.toFixed(2) },
                                { label: 'VOLUME', val: asset.volume },
                            ].map((s) => (
                                <div key={s.label} style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px' }}>{s.label}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text2)' }}>{s.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assetura Chart */}
                    <div style={{ flex: 1, position: 'relative', margin: '16px 20px 0', minHeight: 0 }}>
                        <div style={{ position: 'absolute', inset: 0 }}>
                            <AsseturaChart key={activeAsset} assetType={activeAsset} />
                        </div>
                    </div>
                </div>

                {/* Indices panel */}
                <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <div style={{
                        padding: '10px 14px 8px', fontSize: '11px', fontWeight: 600,
                        color: 'var(--text2)', letterSpacing: '0.5px', textTransform: 'uppercase',
                        borderBottom: '1px solid var(--border)', flexShrink: 0,
                    }}>
                        Major indices
                    </div>
                    {INDICES.map((idx) => (
                        <div
                            key={idx.code}
                            onClick={() => setSelectedStock({
                                symbol: idx.code,
                                name: idx.name,
                                price: parseFloat(idx.price.replace(/,/g, '')),
                                change: parseFloat(idx.chg),
                                color: idx.color,
                            })}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            style={{
                                display: 'flex', alignItems: 'center',
                                padding: '8px 14px', gap: '10px',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer', transition: 'background 0.12s',
                            }}
                        >
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: idx.color, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '9px', fontWeight: 700,
                                color: '#fff', flexShrink: 0,
                            }}>
                                {idx.short}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {idx.name}
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{idx.code}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                                    {idx.price} <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{idx.unit}</span>
                                </div>
                                <Badge value={parseFloat(idx.chg)} />
                            </div>
                        </div>
                    ))}
                    <div style={{ padding: '8px 14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer' }}>See all major indices ›</span>
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg2)',
            }}>

                {/* Crypto panel */}
                <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 14px 4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', marginBottom: '4px' }}>
                            🔵 Crypto market cap
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}>2.58T USD</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)' }}>+12.98%</span>
                        </div>
                    </div>
                    <div style={{ height: '62px', position: 'relative', padding: '0 14px' }}>
                        <canvas ref={cryptoRef} style={{ position: 'absolute', top: 0, left: 14, width: 'calc(100% - 28px)', height: '100%' }} />
                    </div>
                    <div style={{ padding: '6px 14px 4px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 500, marginBottom: '6px' }}>Bitcoin dominance</div>
                        <div style={{ height: '5px', borderRadius: '3px', display: 'flex', overflow: 'hidden', gap: '1px', marginBottom: '5px' }}>
                            <div style={{ width: '60.93%', background: '#f7931a', borderRadius: '2px' }} />
                            <div style={{ width: '10.83%', background: '#627eea', borderRadius: '2px' }} />
                            <div style={{ flex: 1, background: '#e74c3c', borderRadius: '2px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[
                                { label: 'Bitcoin 60.93%', color: '#f7931a' },
                                { label: 'Ethereum 10.83%', color: '#627eea' },
                                { label: 'Others 28.24%', color: '#e74c3c' },
                            ].map((d) => (
                                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text2)' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                                    {d.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coin rows — clickable */}
                    {COINS.map((c) => (
                        <div
                            key={c.code}
                            onClick={() => setSelectedStock({
                                symbol: c.sym,
                                name: c.sym,
                                price: parseFloat(c.price.replace(/,/g, '')),
                                change: parseFloat(c.chg),
                                color: c.color,
                            })}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            style={{
                                display: 'flex', alignItems: 'center',
                                padding: '7px 14px', gap: '8px',
                                borderTop: '1px solid var(--border)',
                                cursor: 'pointer', transition: 'background 0.12s',
                            }}
                        >
                            <div style={{
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: c.color, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff',
                            }}>
                                {c.ic}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 500 }}>{c.sym}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{c.code}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                                    {c.price} <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{c.unit}</span>
                                </div>
                                <Badge value={parseFloat(c.chg)} />
                            </div>
                        </div>
                    ))}
                    <div style={{ padding: '8px 14px', marginTop: 'auto' }}>
                        <span style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer' }}>See all crypto coins ›</span>
                    </div>
                </div>

                {/* Futures panel */}
                <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 14px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <div style={{
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: '#27ae60', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff',
                            }}>$</div>
                            <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 500 }}>US Dollar index · DXY</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}>98.211</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--red)' }}>−1.33%</span>
                        </div>
                    </div>
                    <div style={{ height: '60px', position: 'relative', padding: '0 14px' }}>
                        <canvas ref={dxyRef} style={{ position: 'absolute', top: 0, left: 14, width: 'calc(100% - 28px)', height: '100%' }} />
                    </div>

                    {/* Futures rows — clickable */}
                    {FUTURES.map((f) => (
                        <div
                            key={f.code}
                            onClick={() => setSelectedStock({
                                symbol: f.code,
                                name: f.name,
                                price: parseFloat(f.price.replace(/,/g, '')),
                                change: parseFloat(f.chg),
                                color: '#f5a623',
                            })}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            style={{
                                display: 'flex', alignItems: 'center',
                                padding: '8px 14px', gap: '10px',
                                borderTop: '1px solid var(--border)',
                                cursor: 'pointer', transition: 'background 0.12s',
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{f.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 500 }}>{f.name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{f.code} · {f.unit}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>{f.price}</div>
                                <Badge value={parseFloat(f.chg)} />
                            </div>
                        </div>
                    ))}
                    <div style={{ padding: '8px 14px', marginTop: 'auto' }}>
                        <span style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer' }}>See all futures ›</span>
                    </div>
                </div>

                {/* Macro panel */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 14px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px' }}>🇺🇸</span>
                            <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 500 }}>US 10-year yield</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600 }}>4.365%</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--green)' }}>+0.05%</span>
                        </div>
                    </div>
                    <div style={{ height: '60px', position: 'relative', padding: '0 14px' }}>
                        <canvas ref={yieldRef} style={{ position: 'absolute', top: 0, left: 14, width: 'calc(100% - 28px)', height: '100%' }} />
                    </div>
                    <div style={{ padding: '8px 14px 4px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 500, marginBottom: '6px' }}>US annual inflation rate</div>
                        <div style={{ display: 'flex', gap: '2px', height: '52px', alignItems: 'flex-end' }}>
                            {INFL_DATA.map((v, i) => (
                                <div key={i} style={{
                                    flex: 1, borderRadius: '2px 2px 0 0',
                                    height: `${(v / INFL_MAX) * 100}%`,
                                    background: v > 4 ? 'var(--red)' : v > 3 ? 'var(--amber)' : 'var(--blue)',
                                    opacity: 0.75, minWidth: 0,
                                }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text2)', fontWeight: 500, marginBottom: '8px' }}>US interest rate</div>
                        <div style={{ display: 'flex' }}>
                            {[
                                { label: 'Actual', val: '3.75%', small: false },
                                { label: 'Estimated', val: '3.75%', small: false },
                                { label: 'Last release', val: 'Apr 29, 2026', small: true },
                            ].map((r, i) => (
                                <div key={r.label} style={{
                                    flex: 1, display: 'flex', flexDirection: 'column', gap: '2px',
                                    borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                                    paddingLeft: i > 0 ? '10px' : '0',
                                }}>
                                    <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{r.label}</span>
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: r.small ? '11px' : '13px',
                                        fontWeight: 500,
                                        color: r.small ? 'var(--text2)' : 'var(--text)',
                                    }}>
                                        {r.val}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: '8px 14px', marginTop: 'auto' }}>
                        <span style={{ fontSize: '11px', color: 'var(--blue)', cursor: 'pointer' }}>See all economic indicators ›</span>
                    </div>
                </div>
            </div>

            {/* Stock detail modal */}
            {selectedStock && (
                <StockDetailModal
                    {...selectedStock}
                    onClose={() => setSelectedStock(null)}
                />
            )}
        </div>
    )
}