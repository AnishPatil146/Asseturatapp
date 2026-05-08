'use client'

import { useState } from 'react'
import Badge from './ui/Badge'

const SIGNALS = [
    {
        asset: 'BTC/USDT',
        type: 'BUY',
        confidence: 87,
        price: 67420,
        target: 72000,
        stop: 64000,
        reason: 'Golden cross on 4H, RSI oversold, volume surge',
        time: '2m ago',
        color: '#f7931a',
    },
    {
        asset: 'ETH/USDT',
        type: 'BUY',
        confidence: 74,
        price: 3120,
        target: 3400,
        stop: 2980,
        reason: 'Support bounce, MACD bullish crossover',
        time: '8m ago',
        color: '#627eea',
    },
    {
        asset: 'AAPL',
        type: 'SELL',
        confidence: 81,
        price: 189,
        target: 178,
        stop: 194,
        reason: 'Bearish engulfing, near resistance zone',
        time: '15m ago',
        color: '#4f8ef7',
    },
    {
        asset: 'SOL/USDT',
        type: 'BUY',
        confidence: 69,
        price: 164,
        target: 185,
        stop: 155,
        reason: 'Breakout from consolidation, high volume',
        time: '22m ago',
        color: '#9945ff',
    },
    {
        asset: 'EUR/USD',
        type: 'SELL',
        confidence: 76,
        price: 1.0842,
        target: 1.071,
        stop: 1.092,
        reason: 'DXY strength, double top pattern forming',
        time: '31m ago',
        color: '#00d4a0',
    },
    {
        asset: 'NVDA',
        type: 'BUY',
        confidence: 91,
        price: 875,
        target: 950,
        stop: 840,
        reason: 'AI sector momentum, earnings beat expected',
        time: '45m ago',
        color: '#76b900',
    },
]

const STATS = [
    { label: 'Win Rate', val: '73.4%', sub: 'Last 30 days', color: 'var(--green)' },
    { label: 'Total Signals', val: '142', sub: 'This month', color: 'var(--blue)' },
    { label: 'Avg Return', val: '+4.2%', sub: 'Per signal', color: 'var(--green)' },
    { label: 'Active Now', val: '6', sub: 'Open signals', color: 'var(--amber)' },
]

export default function Signals() {
    const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')

    const filtered = SIGNALS.filter((s) => filter === 'ALL' || s.type === filter)

    return (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>AI Trade Signals</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                        Powered by Assetura AI · Updates every 60s
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: '5px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                border: filter === f ? '1px solid var(--border2)' : '1px solid transparent',
                                background: filter === f ? 'var(--bg4)' : 'transparent',
                                color: filter === f
                                    ? 'var(--text)'
                                    : f === 'BUY' ? 'var(--green)' : f === 'SELL' ? 'var(--red)' : 'var(--text2)',
                                fontFamily: 'var(--font-sans)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {STATS.map((s) => (
                    <div key={s.label} style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                    }}>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>{s.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Signals table */}
            <div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
            }}>

                {/* Table header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 80px 120px 1fr 1fr 1fr 100px',
                    padding: '8px 16px',
                    fontSize: '10px',
                    color: 'var(--text3)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <span>Asset</span>
                    <span>Signal</span>
                    <span>Confidence</span>
                    <span style={{ textAlign: 'right' }}>Entry</span>
                    <span style={{ textAlign: 'right' }}>Target</span>
                    <span style={{ textAlign: 'right' }}>Stop Loss</span>
                    <span style={{ textAlign: 'right' }}>Time</span>
                </div>

                {/* Rows */}
                {filtered.map((s, i) => {
                    const rr = Math.abs(s.target - s.price) / Math.abs(s.price - s.stop)
                    return (
                        <div key={i} style={{
                            display: 'grid',
                            gridTemplateColumns: '1.5fr 80px 120px 1fr 1fr 1fr 100px',
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                        }}>

                            {/* Asset */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: s.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        color: '#fff',
                                    }}>
                                        {s.asset[0]}
                                    </div>
                                    <span style={{ fontWeight: 500, fontSize: '13px' }}>{s.asset}</span>
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--text3)', paddingLeft: '30px' }}>
                                    {s.reason}
                                </span>
                            </div>

                            {/* Signal badge */}
                            <div style={{ alignSelf: 'center' }}>
                                <span style={{
                                    padding: '3px 10px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: s.type === 'BUY' ? 'rgba(0,212,160,0.1)' : 'rgba(255,77,106,0.1)',
                                    color: s.type === 'BUY' ? 'var(--green)' : 'var(--red)',
                                }}>
                                    {s.type}
                                </span>
                            </div>

                            {/* Confidence bar */}
                            <div style={{ alignSelf: 'center', paddingRight: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        flex: 1,
                                        height: '4px',
                                        borderRadius: '2px',
                                        background: 'var(--bg4)',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${s.confidence}%`,
                                            height: '100%',
                                            borderRadius: '2px',
                                            background: s.confidence > 80
                                                ? 'var(--green)'
                                                : s.confidence > 65
                                                    ? 'var(--amber)'
                                                    : 'var(--red)',
                                            transition: 'width 0.3s',
                                        }} />
                                    </div>
                                    <span style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '11px',
                                        color: 'var(--text2)',
                                        minWidth: '32px',
                                    }}>
                                        {s.confidence}%
                                    </span>
                                </div>
                            </div>

                            {/* Entry */}
                            <div style={{ textAlign: 'right', alignSelf: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                                {s.price}
                            </div>

                            {/* Target */}
                            <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)' }}>
                                    {s.target}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>
                                    R:R {rr.toFixed(1)}x
                                </div>
                            </div>

                            {/* Stop loss */}
                            <div style={{ textAlign: 'right', alignSelf: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--red)' }}>
                                {s.stop}
                            </div>

                            {/* Time */}
                            <div style={{ textAlign: 'right', alignSelf: 'center', fontSize: '11px', color: 'var(--text3)' }}>
                                {s.time}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer note */}
            <div style={{
                fontSize: '11px',
                color: 'var(--text3)',
                textAlign: 'center',
                padding: '8px',
            }}>
                AI signals are for informational purposes only. Not financial advice. Always do your own research.
            </div>
        </div>
    )
}