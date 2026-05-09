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
    if (['BTC', 'BTCUSD', 'BTCUSDT', 'BITCOIN', 'ETH', 'ETHUSD', 'ETHEREUM', 'SOL', 'SOLUSD', 'SOLANA'].includes(s)) return 'CRYPTO'
    if (['EUR/USD', 'GBP/USD', 'USD/JPY', 'EURUSD', 'GBPUSD', 'USDJPY'].includes(s)) return 'FOREX'
    if (['SPX', 'SPX 4800C', 'NDX', 'VIX'].includes(s)) return 'OPTIONS'
    return 'STOCKS'
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M']

const STATS = [
    { label: 'Market Cap', key: 'marketCap' },
    { label: 'P/E Ratio', key: 'pe' },
    { label: 'Volume', key: 'volume' },
    { label: '52W High', key: 'high52' },
    { label: '52W Low', key: 'low52' },
    { label: 'Avg Volume', key: 'avgVol' },
    { label: 'Dividend', key: 'dividend' },
    { label: 'Beta', key: 'beta' },
]

const MOCK_STATS: Record<string, string> = {
    marketCap: '$2.84T',
    pe: '28.4x',
    volume: '48.2M',
    high52: '$199.62',
    low52: '$164.08',
    avgVol: '55.8M',
    dividend: '0.51%',
    beta: '1.24',
}

const INDICATORS = [
    { name: 'RSI (14)', val: '58.4', signal: 'Neutral', color: 'var(--amber)' },
    { name: 'MACD', val: '+1.24', signal: 'Bullish', color: 'var(--green)' },
    { name: 'EMA 20', val: '186.2', signal: 'Above', color: 'var(--green)' },
    { name: 'EMA 50', val: '182.8', signal: 'Above', color: 'var(--green)' },
    { name: 'Bollinger', val: 'Mid', signal: 'Neutral', color: 'var(--amber)' },
    { name: 'Volume', val: 'High', signal: 'Bullish', color: 'var(--green)' },
    { name: 'Stochastic', val: '72.1', signal: 'Overbought', color: 'var(--red)' },
    { name: 'ATR (14)', val: '3.84', signal: 'Medium', color: 'var(--amber)' },
]

export default function StockDetailModal({ symbol, name, price, change, color, onClose }: Props) {
    const [tf, setTf] = useState('1h')
    const [tab, setTab] = useState<'chart' | 'indicators' | 'news'>('chart')

    const TV_SYMBOL_MAP: Record<string, string> = {
        'BTC': 'BINANCE:BTCUSDT',
        'ETH': 'BINANCE:ETHUSDT',
        'SOL': 'BINANCE:SOLUSDT',
        'AAPL': 'NASDAQ:AAPL',
        'NVDA': 'NASDAQ:NVDA',
        'EUR/USD': 'FX:EURUSD',
        'SPX': 'SP:SPX',
    }

    const tvSymbol = TV_SYMBOL_MAP[symbol] || `BINANCE:${symbol}USDT`

    const TF_MAP: Record<string, string> = {
        '1m': '1', '5m': '5', '15m': '15',
        '1h': '60', '4h': '240', '1D': 'D', '1W': 'W', '1M': 'M',
    }

    // Use s3.tradingview.com/widgetembed directly — cross-origin relative
    // to localhost, so Next.js dev tools CANNOT intercept console.error
    // calls that TradingView emits internally inside that frame.
    const tvParams = new URLSearchParams({
        symbol: tvSymbol,
        interval: TF_MAP[tf] || '60',
        theme: 'dark',
        style: '1',
        locale: 'en',
        timezone: 'Etc/UTC',
        withdateranges: '1',
        hide_side_toolbar: '0',
        allow_symbol_change: '1',
        save_image: '1',
        hide_volume: '0',
        utm_source: 'localhost',
        utm_medium: 'widget_new',
        utm_campaign: 'chart',
    })
    const tvSrc = `https://s3.tradingview.com/widgetembed/?${tvParams.toString()}`

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: '#0b0e17',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{
                background: '#0b0e17',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>

                {/* Modal header */}
                <div style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    flexShrink: 0,
                }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                    }}>
                        {symbol[0]}
                    </div>

                    <div>
                        <div style={{ fontWeight: 600, fontSize: '16px' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{symbol}</div>
                    </div>

                    <div style={{ marginLeft: '20px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 600 }}>
                            {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <Badge value={change} />

                    {/* Tabs */}
                    <div style={{ marginLeft: '20px', display: 'flex', gap: '2px' }}>
                        {(['chart', 'indicators', 'news'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: '5px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    border: tab === t ? '1px solid var(--border2)' : '1px solid transparent',
                                    background: tab === t ? 'var(--bg4)' : 'transparent',
                                    color: tab === t ? 'var(--text)' : 'var(--text2)',
                                    fontFamily: 'var(--font-sans)',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Timeframes — only on chart tab */}
                    {tab === 'chart' && (
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                            {TIMEFRAMES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTf(t)}
                                    style={{
                                        padding: '3px 8px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        border: 'none',
                                        background: tf === t ? 'var(--bg4)' : 'transparent',
                                        color: tf === t ? 'var(--green)' : 'var(--text3)',
                                        fontFamily: 'var(--font-mono)',
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Close */}
                    <button
                        onClick={onClose}
                        style={{
                            marginLeft: tab === 'chart' ? '12px' : 'auto',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--bg4)',
                            border: '1px solid var(--border2)',
                            color: 'var(--text2)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Chart tab — custom AsseturaChart embed */}
                    {tab === 'chart' && (
                        <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: 0 }}>
                                <AsseturaChart key={symbol} assetType={resolveAssetType(symbol)} symbolOverride={symbol} labelOverride={`${name} · ${symbol}`} basePriceOverride={price} />
                            </div>
                        </div>
                    )}

                    {/* Indicators tab */}
                    {tab === 'indicators' && (
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                                {INDICATORS.map((ind) => (
                                    <div key={ind.name} style={{
                                        background: 'var(--bg3)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        padding: '14px',
                                    }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>{ind.name}</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600 }}>{ind.val}</div>
                                        <div style={{ fontSize: '11px', fontWeight: 500, color: ind.color, marginTop: '4px' }}>{ind.signal}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Overall signal */}
                            <div style={{
                                background: 'var(--bg3)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                            }}>
                                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '28px', fontWeight: 600, color: 'var(--green)' }}>BUY</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Overall Signal</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        {[
                                            { label: 'Bullish', count: 5, color: 'var(--green)' },
                                            { label: 'Neutral', count: 2, color: 'var(--amber)' },
                                            { label: 'Bearish', count: 1, color: 'var(--red)' },
                                        ].map((s) => (
                                            <div key={s.label} style={{
                                                flex: s.count,
                                                height: '8px',
                                                background: s.color,
                                                borderRadius: '4px',
                                                opacity: 0.8,
                                            }} />
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        {[
                                            { label: '5 Bullish', color: 'var(--green)' },
                                            { label: '2 Neutral', color: 'var(--amber)' },
                                            { label: '1 Bearish', color: 'var(--red)' },
                                        ].map((s) => (
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
                                { title: `Insider buying spotted in ${name} last week`, source: 'Barron\'s', time: '4h ago', sentiment: 7.6 },
                            ].map((n, i) => (
                                <div key={i} style={{
                                    background: 'var(--bg3)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    gap: '14px',
                                    alignItems: 'flex-start',
                                    cursor: 'pointer',
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4, marginBottom: '6px' }}>{n.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                            <span style={{ color: 'var(--blue)' }}>{n.source}</span> · {n.time}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        border: `2px solid ${n.sentiment >= 7 ? 'var(--green)' : 'var(--amber)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: n.sentiment >= 7 ? 'var(--green)' : 'var(--amber)',
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