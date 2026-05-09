'use client'

import { useState, useEffect } from 'react'
import { useMultiTicker } from '@/lib/hooks/useBinanceWS'

const COINS = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', color: '#f7931a' },
    { symbol: 'ETHUSDT', name: 'Ethereum', color: '#627eea' },
    { symbol: 'SOLUSDT', name: 'Solana', color: '#9945ff' },
    { symbol: 'BNBUSDT', name: 'BNB', color: '#f3ba2f' },
]

export default function LiveTicker() {
    const { tickers } = useMultiTicker()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    return (
        <div style={{
            background: 'var(--bg2)',
            borderBottom: '1px solid var(--border)',
            padding: '0',
            display: 'flex',
            height: '36px',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Scrolling wrapper for mobile */}
            <div style={{
                display: 'flex',
                gap: '0',
                alignItems: 'center',
                ...(isMobile ? {
                    animation: 'ticker 20s linear infinite',
                    whiteSpace: 'nowrap' as const,
                } : {
                    overflowX: 'auto' as const,
                    paddingLeft: '20px',
                }),
            }}>
                {(isMobile ? [...COINS, ...COINS] : COINS).map((coin, idx) => {
                    const t = tickers[coin.symbol]
                    const isPos = t ? t.changePct >= 0 : true
                    const price = t ? t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'
                    const chg = t ? `${isPos ? '+' : ''}${t.changePct.toFixed(2)}%` : '---'

                    return (
                        <div key={`${coin.symbol}-${idx}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0 20px',
                            borderRight: '1px solid var(--border)',
                            height: '100%',
                            flexShrink: 0,
                        }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                background: coin.color, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff',
                            }}>
                                {coin.name[0]}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>{coin.name}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>${price}</span>
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '11px',
                                color: isPos ? 'var(--green)' : 'var(--red)',
                            }}>
                                {chg}
                            </span>
                            {!t && (
                                <span style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: 'var(--amber)', display: 'inline-block',
                                    animation: 'pulse 1s infinite',
                                }} />
                            )}
                        </div>
                    )
                })}
            </div>

            <div style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center',
                gap: '6px', paddingLeft: '20px', paddingRight: '20px',
                background: 'var(--bg2)', flexShrink: 0,
            }}>
                <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: Object.keys(tickers).length > 0 ? 'var(--green)' : 'var(--amber)',
                    display: 'inline-block', animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                    {Object.keys(tickers).length > 0 ? 'BINANCE LIVE' : 'CONNECTING...'}
                </span>
            </div>
        </div>
    )
}