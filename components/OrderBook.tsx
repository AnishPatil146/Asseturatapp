'use client'

import { useEffect, useState } from 'react'
import Badge from './ui/Badge'

interface OrderRow {
    price: number
    qty: number
    total: number
}

function generateRows(mid: number, side: 'ask' | 'bid', count = 10): OrderRow[] {
    const rows: OrderRow[] = []
    for (let i = 0; i < count; i++) {
        const spread = mid * (0.0002 * (i + 1) + Math.random() * 0.0003)
        const price = side === 'ask' ? mid + spread : mid - spread
        const qty = parseFloat((Math.random() * 2 + 0.05).toFixed(3))
        rows.push({ price, qty, total: parseFloat((price * qty).toFixed(2)) })
    }
    return side === 'ask' ? rows.reverse() : rows
}

export default function OrderBook({ midPrice = 67420 }: { midPrice?: number }) {
    const [asks, setAsks] = useState<OrderRow[]>([])
    const [bids, setBids] = useState<OrderRow[]>([])

    useEffect(() => {
        const update = () => {
            const mid = midPrice * (1 + (Math.random() - 0.5) * 0.001)
            setAsks(generateRows(mid, 'ask'))
            setBids(generateRows(mid, 'bid'))
        }
        update()
        const id = setInterval(update, 1500)
        return () => clearInterval(id)
    }, [midPrice])

    const maxTotal = Math.max(...asks.concat(bids).map((r) => r.total))
    const spread = asks.length && bids.length
        ? (asks[asks.length - 1].price - bids[0].price).toFixed(2)
        : '0'

    return (
        <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
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
                Order Book
            </div>

            {/* Column headers */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                padding: '5px 14px',
                fontSize: '10px',
                color: 'var(--text3)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
            }}>
                <span>Price</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Total</span>
            </div>

            {/* Asks */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {asks.map((row, i) => (
                    <div key={i} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        padding: '3px 14px',
                        position: 'relative',
                        cursor: 'pointer',
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0, right: 0,
                            height: '100%',
                            width: `${(row.total / maxTotal) * 100}%`,
                            background: 'rgba(255,77,106,0.08)',
                        }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--red)', position: 'relative' }}>
                            {row.price.toFixed(2)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text2)', textAlign: 'center', position: 'relative' }}>
                            {row.qty.toFixed(3)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)', textAlign: 'right', position: 'relative' }}>
                            {row.total.toFixed(0)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Spread */}
            <div style={{
                padding: '5px 14px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text3)',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg3)',
            }}>
                Spread: {spread} ({midPrice ? ((parseFloat(spread) / midPrice) * 100).toFixed(3) : '0'}%)
            </div>

            {/* Bids */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {bids.map((row, i) => (
                    <div key={i} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        padding: '3px 14px',
                        position: 'relative',
                        cursor: 'pointer',
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0, right: 0,
                            height: '100%',
                            width: `${(row.total / maxTotal) * 100}%`,
                            background: 'rgba(0,212,160,0.08)',
                        }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--green)', position: 'relative' }}>
                            {row.price.toFixed(2)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text2)', textAlign: 'center', position: 'relative' }}>
                            {row.qty.toFixed(3)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text3)', textAlign: 'right', position: 'relative' }}>
                            {row.total.toFixed(0)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}