'use client'

import { useEffect, useState } from 'react'
import Badge from './ui/Badge'
import AsseturaChart from './AsseturaChart'

interface Props {
    symbol: string
    name: string
    price: number
    change: number
    color: string
    onClose: () => void
}

type AssetType = 'CRYPTO' | 'STOCKS' | 'FOREX' | 'OPTIONS'

function resolveAssetType(symbol: string): AssetType {
    const s = symbol.toUpperCase()
    if (['BTC', 'BTCUSD', 'BTCUSDT', 'BITCOIN',
        'ETH', 'ETHUSD', 'ETHUSDT', 'ETHEREUM',
        'SOL', 'SOLUSD', 'SOLUSDT', 'SOLANA',
        'BNB', 'DOGE'].includes(s)) return 'CRYPTO'
    if (['EUR/USD', 'GBP/USD', 'USD/JPY',
        'EURUSD', 'GBPUSD', 'USDJPY'].includes(s)) return 'FOREX'
    if (['SPX', 'SPX 4800C', 'NDX', 'VIX'].includes(s)) return 'OPTIONS'
    return 'STOCKS'
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M']

const INDICATORS = [
    { name: 'RSI (14)', val: '58.4', signal: 'Neutral', color: '#f5a623' },
    { name: 'MACD', val: '+1.24', signal: 'Bullish', color: '#00d4a0' },
    { name: 'EMA 20', val: '186.2', signal: 'Above', color: '#00d4a0' },
    { name: 'EMA 50', val: '182.8', signal: 'Above', color: '#00d4a0' },
    { name: 'Bollinger', val: 'Mid', signal: 'Neutral', color: '#f5a623' },
    { name: 'Volume', val: 'High', signal: 'Bullish', color: '#00d4a0' },
    { name: 'Stochastic', val: '72.1', signal: 'Overbought', color: '#ff4d6a' },
    { name: 'ATR (14)', val: '3.84', signal: 'Medium', color: '#f5a623' },
]

const STATS = [
    { label: 'Market Cap', val: '$2.84T' },
    { label: 'P/E Ratio', val: '28.4x' },
    { label: 'Volume', val: '48.2M' },
    { label: '52W High', val: '$199.62' },
    { label: '52W Low', val: '$164.08' },
    { label: 'Avg Volume', val: '55.8M' },
    { label: 'Dividend', val: '0.51%' },
    { label: 'Beta', val: '1.24' },
]

export default function StockDetailModal({
    symbol, name, price, change, color, onClose,
}: Props) {
    const [tab, setTab] = useState<'chart' | 'indicators' | 'news'>('chart')

    const assetType = resolveAssetType(symbol)
    const chartHeight = typeof window !== 'undefined'
        ? window.innerHeight - 120
        : 500

    // Close on Escape
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [onClose])

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div style={{
                background: '#0a0b0e',
                border: '1px solid #1e2333',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '1200px',
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            }}>

                {/* Header */}
                <div style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #1e2333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    flexShrink: 0,
                    background: '#080808',
                }}>
                    {/* Icon */}
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                    }}>
                        {symbol[0]}
                    </div>

                    {/* Name + symbol */}
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '16px', color: '#e2e8f7' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: '#4a5470' }}>{symbol}</div>
                    </div>

                    {/* Price */}
                    <div style={{ marginLeft: '16px' }}>
                        <div style={{
                            fontFamily: 'DM Mono,monospace',
                            fontSize: '22px',
                            fontWeight: 600,
                            color: change >= 0 ? '#00d4a0' : '#ff4d6a',
                        }}>
                            {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <Badge value={change} />

                    {/* Tab switcher */}
                    <div style={{ marginLeft: '20px', display: 'flex', gap: '2px' }}>
                        {(['chart', 'indicators', 'news'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: '5px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    border: tab === t ? '1px solid #252b3d' : '1px solid transparent',
                                    background: tab === t ? '#1a1e2a' : 'transparent',
                                    color: tab === t ? '#e2e8f7' : '#7b88aa',
                                    fontFamily: 'DM Sans,sans-serif',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>



                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            marginLeft: 'auto',
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: '#1a1e2a',
                            border: '1px solid #252b3d',
                            color: '#7b88aa',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Chart tab */}
                    {tab === 'chart' && (
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                            {/* AsseturaChart */}
                            <div style={{ flex: 1, overflow: 'hidden', padding: '12px' }}>
                                <AsseturaChart
                                    key={`${symbol}`}
                                    assetType={assetType}
                                    symbolOverride={symbol}
                                    labelOverride={`${name} · ${symbol}`}
                                    basePriceOverride={price}
                                    height={chartHeight - 80}
                                />
                            </div>

                            {/* Right stats panel */}
                            <div style={{
                                width: '200px',
                                borderLeft: '1px solid #1e2333',
                                padding: '14px',
                                overflowY: 'auto',
                                flexShrink: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                background: '#080808',
                            }}>
                                {/* Key stats */}
                                <div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#4a5470',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        marginBottom: '10px',
                                    }}>
                                        Key Stats
                                    </div>
                                    {STATS.map(s => (
                                        <div key={s.label} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px',
                                            alignItems: 'baseline',
                                        }}>
                                            <span style={{ fontSize: '11px', color: '#4a5470' }}>{s.label}</span>
                                            <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', fontWeight: 500, color: '#e2e8f7' }}>
                                                {s.val}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Signal */}
                                <div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#4a5470',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        marginBottom: '10px',
                                    }}>
                                        AI Signal
                                    </div>
                                    <div style={{
                                        background: 'rgba(0,212,160,0.08)',
                                        border: '1px solid rgba(0,212,160,0.2)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontFamily: 'DM Mono,monospace',
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: '#00d4a0',
                                        }}>
                                            BUY
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#4a5470', marginTop: '2px' }}>
                                            Confidence: 82%
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#7b88aa',
                                        marginTop: '8px',
                                        lineHeight: 1.5,
                                    }}>
                                        Golden cross detected. Strong support at current levels.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Indicators tab */}
                    {tab === 'indicators' && (
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4,1fr)',
                                gap: '12px',
                                marginBottom: '20px',
                            }}>
                                {INDICATORS.map(ind => (
                                    <div key={ind.name} style={{
                                        background: '#141720',
                                        border: '1px solid #1e2333',
                                        borderRadius: '8px',
                                        padding: '14px',
                                    }}>
                                        <div style={{ fontSize: '11px', color: '#4a5470', marginBottom: '6px' }}>{ind.name}</div>
                                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '18px', fontWeight: 600, color: '#e2e8f7' }}>{ind.val}</div>
                                        <div style={{ fontSize: '11px', fontWeight: 500, color: ind.color, marginTop: '4px' }}>{ind.signal}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Overall signal bar */}
                            <div style={{
                                background: '#141720',
                                border: '1px solid #1e2333',
                                borderRadius: '8px',
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                            }}>
                                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '28px', fontWeight: 600, color: '#00d4a0' }}>BUY</div>
                                    <div style={{ fontSize: '11px', color: '#4a5470' }}>Overall Signal</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', height: '8px' }}>
                                        {[
                                            { count: 5, color: '#00d4a0' },
                                            { count: 2, color: '#f5a623' },
                                            { count: 1, color: '#ff4d6a' },
                                        ].map((s, i) => (
                                            <div key={i} style={{
                                                flex: s.count,
                                                height: '100%',
                                                background: s.color,
                                                borderRadius: '4px',
                                                opacity: 0.8,
                                            }} />
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        {[
                                            { label: '5 Bullish', color: '#00d4a0' },
                                            { label: '2 Neutral', color: '#f5a623' },
                                            { label: '1 Bearish', color: '#ff4d6a' },
                                        ].map(s => (
                                            <span key={s.label} style={{ fontSize: '12px', color: s.color }}>{s.label}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* News tab */}
                    {tab === 'news' && (
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { title: `${name} hits new highs amid strong institutional buying`, source: 'Bloomberg', time: '5m ago', sentiment: 8.4 },
                                { title: `Analysts raise ${symbol} price target to $220`, source: 'Goldman', time: '1h ago', sentiment: 8.9 },
                                { title: `${name} Q2 earnings beat estimates by 12%`, source: 'Reuters', time: '2h ago', sentiment: 9.1 },
                                { title: `${symbol} volatility increases ahead of Fed decision`, source: 'CNBC', time: '3h ago', sentiment: 5.2 },
                                { title: `Insider buying spotted in ${name} last week`, source: "Barron's", time: '4h ago', sentiment: 7.6 },
                            ].map((n, i) => (
                                <div key={i} style={{
                                    background: '#141720',
                                    border: '1px solid #1e2333',
                                    borderRadius: '8px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    gap: '14px',
                                    alignItems: 'flex-start',
                                    cursor: 'pointer',
                                    transition: 'background 0.12s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#1a1e2a')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '#141720')}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4, marginBottom: '6px', color: '#e2e8f7' }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#4a5470' }}>
                                            <span style={{ color: '#4f8ef7' }}>{n.source}</span> · {n.time}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        border: `2px solid ${n.sentiment >= 7 ? '#00d4a0' : '#f5a623'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'DM Mono,monospace',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: n.sentiment >= 7 ? '#00d4a0' : '#f5a623',
                                        flexShrink: 0,
                                    }}>
                                        {n.sentiment}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}