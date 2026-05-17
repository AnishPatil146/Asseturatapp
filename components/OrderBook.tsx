'use client'

// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Level 2 Order Book
// Canvas-rendered depth visualization with real-time updates
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTradingStore } from '@/lib/store/useTradingStore'
import { THEME } from '@/lib/engine/theme'
import { formatPrice } from '@/lib/engine/precision'
import type { OrderBookLevel } from '@/lib/engine/types'

function generateRows(mid: number, side: 'ask' | 'bid', count = 12): OrderBookLevel[] {
  const rows: OrderBookLevel[] = []
  for (let i = 0; i < count; i++) {
    const spread = mid * (0.0002 * (i + 1) + Math.random() * 0.0003)
    const price = side === 'ask' ? mid + spread : mid - spread
    const qty = parseFloat((Math.random() * 2 + 0.05).toFixed(4))
    rows.push({ price, qty, total: parseFloat((price * qty).toFixed(2)) })
  }
  return side === 'ask' ? rows.reverse() : rows
}

type Grouping = '0.01' | '0.1' | '1' | '10'

export default function OrderBookPro() {
  const { asks, bids, setOrderBook, candles } = useTradingStore()
  const [grouping, setGrouping] = useState<Grouping>('0.1')
  const midPrice = candles.length > 0 ? candles[candles.length - 1].close : 67420

  // Generate mock order book data
  useEffect(() => {
    const update = () => {
      const mid = midPrice * (1 + (Math.random() - 0.5) * 0.001)
      setOrderBook(
        generateRows(mid, 'ask', 12),
        generateRows(mid, 'bid', 12),
      )
    }
    update()
    const id = setInterval(update, 1200)
    return () => clearInterval(id)
  }, [midPrice, setOrderBook])

  const maxTotal = Math.max(
    ...asks.concat(bids).map(r => r.total),
    1,
  )
  const spread = asks.length && bids.length
    ? Math.abs(asks[asks.length - 1].price - bids[0].price)
    : 0

  return (
    <div style={{
      background: THEME.bgPanel,
      border: `1px solid ${THEME.border}`,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${THEME.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: THEME.textSecondary,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          Order Book
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {(['0.01', '0.1', '1', '10'] as Grouping[]).map(g => (
            <button
              key={g}
              onClick={() => setGrouping(g)}
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '9px',
                cursor: 'pointer',
                border: 'none',
                background: grouping === g ? THEME.bgHover : 'transparent',
                color: grouping === g ? THEME.text : THEME.textMuted,
                fontFamily: THEME.fontMono,
                transition: 'all 0.12s',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        padding: '4px 14px',
        fontSize: '9px',
        color: THEME.textMuted,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        borderBottom: `1px solid ${THEME.border}`,
      }}>
        <span>Price</span>
        <span style={{ textAlign: 'center' }}>Qty</span>
        <span style={{ textAlign: 'right' }}>Total</span>
      </div>

      {/* Asks */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {asks.map((row, i) => (
          <div key={`ask-${i}`} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            padding: '2.5px 14px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.08s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,70,93,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              position: 'absolute',
              top: 0, right: 0,
              height: '100%',
              width: `${(row.total / maxTotal) * 100}%`,
              background: THEME.bearMuted,
              transition: 'width 0.3s ease',
            }} />
            <span style={{
              fontFamily: THEME.fontMono, fontSize: '11px',
              fontWeight: 500, color: THEME.bear, position: 'relative',
            }}>
              {formatPrice(row.price)}
            </span>
            <span style={{
              fontFamily: THEME.fontMono, fontSize: '11px',
              color: THEME.textSecondary, textAlign: 'center', position: 'relative',
            }}>
              {row.qty.toFixed(4)}
            </span>
            <span style={{
              fontFamily: THEME.fontMono, fontSize: '11px',
              color: THEME.textMuted, textAlign: 'right', position: 'relative',
            }}>
              {row.total.toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div style={{
        padding: '5px 14px',
        textAlign: 'center',
        fontFamily: THEME.fontMono,
        fontSize: '10px',
        color: THEME.textMuted,
        borderTop: `1px solid ${THEME.border}`,
        borderBottom: `1px solid ${THEME.border}`,
        background: THEME.bgSurface,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>Spread</span>
        <span style={{ color: THEME.text, fontWeight: 500 }}>
          {formatPrice(spread)}
          <span style={{ color: THEME.textMuted, marginLeft: '6px' }}>
            ({midPrice ? ((spread / midPrice) * 100).toFixed(4) : '0'}%)
          </span>
        </span>
      </div>

      {/* Bids */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {bids.map((row, i) => (
          <div key={`bid-${i}`} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            padding: '2.5px 14px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.08s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(14,203,129,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              position: 'absolute',
              top: 0, right: 0,
              height: '100%',
              width: `${(row.total / maxTotal) * 100}%`,
              background: THEME.bullMuted,
              transition: 'width 0.3s ease',
            }} />
            <span style={{
              fontFamily: THEME.fontMono, fontSize: '11px',
              fontWeight: 500, color: THEME.bull, position: 'relative',
            }}>
              {formatPrice(row.price)}
            </span>
            <span style={{
              fontFamily: THEME.fontMono, fontSize: '11px',
              color: THEME.textSecondary, textAlign: 'center', position: 'relative',
            }}>
              {row.qty.toFixed(4)}
            </span>
            <span style={{
              fontFamily: THEME.fontMono, fontSize: '11px',
              color: THEME.textMuted, textAlign: 'right', position: 'relative',
            }}>
              {row.total.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}