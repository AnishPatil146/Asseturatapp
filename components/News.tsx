'use client'

import { useState } from 'react'
import Badge from './ui/Badge'

const CATEGORIES = ['All', 'Crypto', 'Stocks', 'Forex', 'Macro', 'AI']

const NEWS = [
    {
        id: 1,
        title: 'Bitcoin surges past $67K as institutional demand hits record highs',
        summary: 'BTC broke through key resistance levels amid massive ETF inflows and growing institutional adoption from major asset managers.',
        source: 'CoinDesk',
        time: '5m ago',
        category: 'Crypto',
        sentiment: 8.4,
        impact: 'HIGH',
        asset: 'BTC',
        color: '#f7931a',
    },
    {
        id: 2,
        title: 'Fed signals potential rate cuts in Q3 2026 amid cooling inflation',
        summary: 'Federal Reserve minutes reveal growing consensus among members for policy easing as inflation approaches 2% target.',
        source: 'Reuters',
        time: '18m ago',
        category: 'Macro',
        sentiment: 7.2,
        impact: 'HIGH',
        asset: 'SPX',
        color: '#4f8ef7',
    },
    {
        id: 3,
        title: 'Apple reports record Q2 earnings driven by services and AI features',
        summary: 'AAPL beats analyst estimates with $94B revenue, up 12% YoY. AI-powered features driving strong upgrade cycle.',
        source: 'Bloomberg',
        time: '34m ago',
        category: 'Stocks',
        sentiment: 8.9,
        impact: 'HIGH',
        asset: 'AAPL',
        color: '#4f8ef7',
    },
    {
        id: 4,
        title: 'Ethereum network upgrades boost transaction throughput by 40%',
        summary: 'Latest Ethereum protocol upgrade successfully deployed, significantly reducing gas fees and improving network capacity.',
        source: 'The Block',
        time: '52m ago',
        category: 'Crypto',
        sentiment: 7.8,
        impact: 'MEDIUM',
        asset: 'ETH',
        color: '#627eea',
    },
    {
        id: 5,
        title: 'EUR/USD drops as ECB maintains hawkish stance despite weak data',
        summary: 'Euro weakens against dollar after ECB officials signal no immediate rate cuts despite disappointing PMI figures.',
        source: 'FX Street',
        time: '1h ago',
        category: 'Forex',
        sentiment: 3.2,
        impact: 'MEDIUM',
        asset: 'EUR/USD',
        color: '#00d4a0',
    },
    {
        id: 6,
        title: 'Nvidia unveils next-gen AI chips, stock jumps 8% in after-hours',
        summary: 'NVDA announces Blackwell Ultra GPU architecture promising 3x performance improvement for AI training workloads.',
        source: 'TechCrunch',
        time: '1h ago',
        category: 'Stocks',
        sentiment: 9.1,
        impact: 'HIGH',
        asset: 'NVDA',
        color: '#76b900',
    },
    {
        id: 7,
        title: 'Solana DeFi TVL reaches all-time high of $12B',
        summary: 'Solana ecosystem sees massive capital inflows as new DeFi protocols launch and user activity hits record levels.',
        source: 'DeFiLlama',
        time: '2h ago',
        category: 'Crypto',
        sentiment: 8.0,
        impact: 'MEDIUM',
        asset: 'SOL',
        color: '#9945ff',
    },
    {
        id: 8,
        title: 'US GDP growth revised upward to 3.2% for Q1 2026',
        summary: 'Bureau of Economic Analysis revises Q1 GDP estimate higher, signaling stronger economic momentum than initially reported.',
        source: 'WSJ',
        time: '2h ago',
        category: 'Macro',
        sentiment: 6.8,
        impact: 'MEDIUM',
        asset: 'SPX',
        color: '#4f8ef7',
    },
    {
        id: 9,
        title: 'BlackRock Bitcoin ETF sees $800M single-day inflow record',
        summary: 'IBIT records largest ever single-day inflow as pension funds and wealth managers increase crypto allocation.',
        source: 'Bloomberg',
        time: '3h ago',
        category: 'Crypto',
        sentiment: 9.2,
        impact: 'HIGH',
        asset: 'BTC',
        color: '#f7931a',
    },
]

const TRENDING = [
    { asset: 'BTC', mentions: 1842, chg: '+2.34' },
    { asset: 'NVDA', mentions: 1203, chg: '+8.10' },
    { asset: 'AAPL', mentions: 987, chg: '+3.85' },
    { asset: 'ETH', mentions: 876, chg: '-0.80' },
    { asset: 'SOL', mentions: 654, chg: '+10.8' },
]

function SentimentBar({ score }: { score: number }) {
    const color = score >= 7 ? 'var(--green)' : score >= 5 ? 'var(--amber)' : 'var(--red)'
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
                width: '60px',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--bg4)',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: `${score * 10}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '2px',
                    transition: 'width 0.3s',
                }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color }}>{score}</span>
        </div>
    )
}

export default function News() {
    const [activeCategory, setActiveCategory] = useState('All')
    const [search, setSearch] = useState('')

    const filtered = NEWS.filter((n) => {
        const matchCat = activeCategory === 'All' || n.category === activeCategory
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.asset.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    const avgSentiment = (NEWS.reduce((s, n) => s + n.sentiment, 0) / NEWS.length).toFixed(1)

    return (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>Market News</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                        AI-powered sentiment analysis · Updated in real time
                    </div>
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search news or asset..."
                    style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: '5px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        color: 'var(--text)',
                        outline: 'none',
                        width: '220px',
                        fontFamily: 'var(--font-sans)',
                    }}
                />
            </div>

            {/* Sentiment overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                {[
                    { label: 'Market Sentiment', val: avgSentiment, sub: 'Overall score /10', color: 'var(--green)' },
                    { label: 'Bullish Articles', val: NEWS.filter(n => n.sentiment >= 7).length, sub: 'Out of ' + NEWS.length, color: 'var(--green)' },
                    { label: 'Bearish Articles', val: NEWS.filter(n => n.sentiment < 5).length, sub: 'Out of ' + NEWS.length, color: 'var(--red)' },
                    { label: 'High Impact', val: NEWS.filter(n => n.impact === 'HIGH').length, sub: 'Breaking news', color: 'var(--amber)' },
                ].map((s) => (
                    <div key={s.label} style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                    }}>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>{s.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '5px 14px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            border: activeCategory === cat ? '1px solid var(--border2)' : '1px solid transparent',
                            background: activeCategory === cat ? 'var(--bg4)' : 'transparent',
                            color: activeCategory === cat ? 'var(--text)' : 'var(--text2)',
                            fontFamily: 'var(--font-sans)',
                            transition: 'all 0.15s',
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px' }}>

                {/* News list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map((n) => (
                        <div key={n.id} style={{
                            background: 'var(--bg2)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '14px 16px',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    {/* Impact + Category badges */}
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '3px',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            background: n.impact === 'HIGH' ? 'rgba(255,77,106,0.1)' : 'rgba(245,166,35,0.1)',
                                            color: n.impact === 'HIGH' ? 'var(--red)' : 'var(--amber)',
                                        }}>
                                            {n.impact}
                                        </span>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '3px',
                                            fontSize: '10px',
                                            background: 'var(--bg4)',
                                            color: 'var(--text3)',
                                        }}>
                                            {n.category}
                                        </span>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '3px',
                                            fontSize: '10px',
                                            background: 'transparent',
                                            color: n.color,
                                            border: `1px solid ${n.color}33`,
                                        }}>
                                            {n.asset}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.4, marginBottom: '4px' }}>
                                        {n.title}
                                    </div>

                                    {/* Summary */}
                                    <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
                                        {n.summary}
                                    </div>
                                </div>

                                {/* Sentiment score */}
                                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        border: `2px solid ${n.sentiment >= 7 ? 'var(--green)' : n.sentiment >= 5 ? 'var(--amber)' : 'var(--red)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: n.sentiment >= 7 ? 'var(--green)' : n.sentiment >= 5 ? 'var(--amber)' : 'var(--red)',
                                    }}>
                                        {n.sentiment}
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '3px' }}>sentiment</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 500 }}>{n.source}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>· {n.time}</span>
                                </div>
                                <SentimentBar score={n.sentiment} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trending sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Trending assets */}
                    <div style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text2)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>
                            Trending Assets
                        </div>
                        {TRENDING.map((t, i) => (
                            <div key={t.asset} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderBottom: i < TRENDING.length - 1 ? '1px solid var(--border)' : 'none',
                                gap: '10px',
                                cursor: 'pointer',
                            }}>
                                <span style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)', minWidth: '16px' }}>
                                    {i + 1}
                                </span>
                                <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{t.asset}</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{t.mentions} mentions</div>
                                    <Badge value={parseFloat(t.chg)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sentiment gauge */}
                    <div style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '14px',
                    }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text2)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                        }}>
                            Sentiment Breakdown
                        </div>
                        {[
                            { label: 'Bullish', pct: 67, color: 'var(--green)' },
                            { label: 'Neutral', pct: 22, color: 'var(--amber)' },
                            { label: 'Bearish', pct: 11, color: 'var(--red)' },
                        ].map((s) => (
                            <div key={s.label} style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.label}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: s.color }}>{s.pct}%</span>
                                </div>
                                <div style={{ height: '4px', borderRadius: '2px', background: 'var(--bg4)', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${s.pct}%`,
                                        height: '100%',
                                        background: s.color,
                                        borderRadius: '2px',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}