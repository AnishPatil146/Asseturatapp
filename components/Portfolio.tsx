'use client'

import { useState } from 'react'
import Badge from './ui/Badge'
import OrderBookPro from './OrderBook'
import TradePanel from './TradePanel'
import StockDetailModal from './StockDetailModel'

const HOLDINGS = [
    { asset: 'BTC', name: 'Bitcoin', qty: 0.42, avgPrice: 61200, curPrice: 67420, color: '#f7931a', ic: '₿' },
    { asset: 'ETH', name: 'Ethereum', qty: 3.50, avgPrice: 3200, curPrice: 3120, color: '#627eea', ic: 'Ξ' },
    { asset: 'SOL', name: 'Solana', qty: 12.00, avgPrice: 148, curPrice: 164, color: '#9945ff', ic: '◎' },
    { asset: 'AAPL', name: 'Apple', qty: 10, avgPrice: 182, curPrice: 189, color: '#4f8ef7', ic: 'A' },
    { asset: 'NVDA', name: 'Nvidia', qty: 5, avgPrice: 820, curPrice: 875, color: '#76b900', ic: 'N' },
]

interface SelectedStock {
    symbol: string
    name: string
    price: number
    change: number
    color: string
}

export default function Portfolio() {
    const [activeTab, setActiveTab] = useState<'holdings' | 'history'>('holdings')
    const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null)

    const totalValue = HOLDINGS.reduce((s, h) => s + h.qty * h.curPrice, 0)
    const totalCost = HOLDINGS.reduce((s, h) => s + h.qty * h.avgPrice, 0)
    const totalPnL = totalValue - totalCost
    const totalPct = (totalPnL / totalCost) * 100

    return (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
                        Total Portfolio Value
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 600 }}>
                        ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                        <Badge value={totalPct} />
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)',
                        }}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} all time
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                        padding: '8px 20px', borderRadius: '5px', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: 'var(--green2)', color: '#fff', fontFamily: 'var(--font-sans)',
                    }}>
                        + Deposit
                    </button>
                    <button style={{
                        padding: '8px 20px', borderRadius: '5px', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer',
                        border: '1px solid var(--border2)',
                        background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font-sans)',
                    }}>
                        Withdraw
                    </button>
                </div>
            </div>

            {/* Allocation bar */}
            <div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Allocation</div>
                <div style={{ height: '6px', borderRadius: '3px', display: 'flex', overflow: 'hidden', gap: '2px' }}>
                    {HOLDINGS.map((h) => (
                        <div key={h.asset} style={{
                            width: `${(h.qty * h.curPrice / totalValue) * 100}%`,
                            background: h.color,
                            borderRadius: '2px',
                        }} />
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                    {HOLDINGS.map((h) => (
                        <div key={h.asset} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: h.color, display: 'inline-block',
                            }} />
                            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
                                {h.asset} {((h.qty * h.curPrice / totalValue) * 100).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '12px' }}>

                {/* Holdings table */}
                <div style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: '8px', overflow: 'hidden',
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                        {(['holdings', 'history'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                style={{
                                    padding: '10px 18px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: 'transparent',
                                    fontFamily: 'var(--font-sans)',
                                    textTransform: 'capitalize',
                                    color: activeTab === t ? 'var(--text)' : 'var(--text3)',
                                    borderBottom: activeTab === t ? '2px solid var(--blue)' : '2px solid transparent',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Table header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                        padding: '8px 16px',
                        fontSize: '10px',
                        color: 'var(--text3)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        <span>Asset</span>
                        <span style={{ textAlign: 'right' }}>Holdings</span>
                        <span style={{ textAlign: 'right' }}>Avg Price</span>
                        <span style={{ textAlign: 'right' }}>Cur Price</span>
                        <span style={{ textAlign: 'right' }}>Value</span>
                        <span style={{ textAlign: 'right' }}>P&L</span>
                    </div>

                    {/* Holdings rows */}
                    {activeTab === 'holdings' && HOLDINGS.map((h) => {
                        const value = h.qty * h.curPrice
                        const pnl = (h.curPrice - h.avgPrice) * h.qty
                        const pct = ((h.curPrice - h.avgPrice) / h.avgPrice) * 100
                        return (
                            <div
                                key={h.asset}
                                onClick={() => setSelectedStock({
                                    symbol: h.asset,
                                    name: h.name,
                                    price: h.curPrice,
                                    change: pct,
                                    color: h.color,
                                })}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    transition: 'background 0.12s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: h.color, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff',
                                    }}>
                                        {h.ic}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{h.name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{h.asset}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', alignSelf: 'center' }}>
                                    {h.qty} {h.asset}
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text2)', alignSelf: 'center' }}>
                                    ${h.avgPrice.toLocaleString()}
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', alignSelf: 'center' }}>
                                    ${h.curPrice.toLocaleString()}
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', alignSelf: 'center' }}>
                                    ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                                    </div>
                                    <Badge value={pct} />
                                </div>
                            </div>
                        )
                    })}

                    {/* History placeholder */}
                    {activeTab === 'history' && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                            Trade history will appear here
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <TradePanel />
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <OrderBookPro />
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