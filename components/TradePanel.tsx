'use client'

import { useState } from 'react'

type Side = 'buy' | 'sell'
type OrderType = 'limit' | 'market' | 'stop'

export default function TradePanel({ price = 67420 }: { price?: number }) {
    const [side, setSide] = useState<Side>('buy')
    const [orderType, setOrderType] = useState<OrderType>('limit')
    const [qty, setQty] = useState('0.01')
    const [limitPrice, setLimitPrice] = useState(price.toFixed(2))
    const [submitted, setSubmitted] = useState(false)

    const total = (parseFloat(qty) * parseFloat(limitPrice)).toFixed(2)

    const handleSubmit = () => {
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 2000)
    }

    return (
        <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>

            {/* Buy / Sell tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {(['buy', 'sell'] as Side[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => setSide(s)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                            fontFamily: 'var(--font-sans)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: side === s
                                ? s === 'buy' ? 'var(--green)' : 'var(--red)'
                                : 'var(--text3)',
                            borderBottom: side === s
                                ? `2px solid ${s === 'buy' ? 'var(--green)' : 'var(--red)'}`
                                : '2px solid transparent',
                            transition: 'all 0.15s',
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Order type */}
                <div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Order Type
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {(['limit', 'market', 'stop'] as OrderType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setOrderType(t)}
                                style={{
                                    flex: 1,
                                    padding: '4px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    border: orderType === t ? '1px solid var(--border2)' : '1px solid var(--border)',
                                    background: orderType === t ? 'var(--bg4)' : 'transparent',
                                    color: orderType === t ? 'var(--text)' : 'var(--text3)',
                                    fontFamily: 'var(--font-sans)',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.12s',
                                }}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price input */}
                {orderType !== 'market' && (
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '5px' }}>
                            Price (USDT)
                        </div>
                        <input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--bg3)',
                                border: '1px solid var(--border2)',
                                borderRadius: '4px',
                                padding: '7px 10px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '12px',
                                color: 'var(--text)',
                                outline: 'none',
                            }}
                        />
                    </div>
                )}

                {/* Quantity */}
                <div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Quantity (BTC)
                    </div>
                    <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'var(--bg3)',
                            border: '1px solid var(--border2)',
                            borderRadius: '4px',
                            padding: '7px 10px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            color: 'var(--text)',
                            outline: 'none',
                        }}
                    />
                    {/* Quick qty buttons */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                        {['25%', '50%', '75%', '100%'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setQty((parseFloat(p) / 100 * 0.1).toFixed(4))}
                                style={{
                                    flex: 1,
                                    padding: '3px',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--text3)',
                                    fontFamily: 'var(--font-sans)',
                                    transition: 'all 0.12s',
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Total */}
                <div style={{
                    background: 'var(--bg3)',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                        ${isNaN(parseFloat(total)) ? '0.00' : parseFloat(total).toLocaleString()}
                    </span>
                </div>

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        background: submitted
                            ? 'var(--bg4)'
                            : side === 'buy' ? 'var(--green2)' : 'var(--red2)',
                        color: submitted ? 'var(--green)' : '#fff',
                        transition: 'all 0.15s',
                    }}
                >
                    {submitted
                        ? '✓ Order Placed'
                        : `${side === 'buy' ? 'Buy' : 'Sell'} BTC`}
                </button>
            </div>
        </div>
    )
}