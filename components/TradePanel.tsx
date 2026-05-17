'use client'

import { useState, useEffect } from 'react'
import { useTradingStore } from '@/lib/store/useTradingStore'
import { THEME } from '@/lib/engine/theme'
import { formatPrice } from '@/lib/engine/precision'
import type { OrderType, TradeRecord } from '@/lib/engine/types'
import { toast } from '@/components/ui/ToastContainer'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

type Side = 'buy' | 'sell'

export default function TradePanel() {
  const { candles, activeAsset, assets, addTrade, positions, setPositions } = useTradingStore()
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : assets[activeAsset].price
  const symbol = assets[activeAsset].symbol.replace('/', '')

  const [side, setSide] = useState<Side>('buy')
  const [orderType, setOrderType] = useState<OrderType>('limit')
  const [qty, setQty] = useState('0.01')
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2))
  const [stopPrice, setStopPrice] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sliderPct, setSliderPct] = useState(25)

  useEffect(() => { setLimitPrice(currentPrice.toFixed(2)) }, [currentPrice])

  const execPrice = orderType === 'market' ? currentPrice : parseFloat(limitPrice || '0')
  const total = parseFloat(qty || '0') * execPrice
  const fee = total * 0.001 // 0.1% commission
  const isValid = parseFloat(qty) > 0 && execPrice > 0

  const handleSubmit = () => {
    if (!isValid) return

    const fillPrice = orderType === 'market'
      ? currentPrice * (1 + (side === 'buy' ? 0.0001 : -0.0001)) // tiny slippage
      : execPrice

    // Create trade record
    const trade: TradeRecord = {
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      symbol,
      side,
      type: orderType,
      qty: parseFloat(qty),
      price: execPrice,
      fillPrice,
      total: parseFloat(qty) * fillPrice,
      fee: parseFloat(qty) * fillPrice * 0.001,
      pnl: 0, // PnL is 0 on open, realized on close
      status: orderType === 'market' ? 'filled' : 'pending',
      timestamp: Date.now(),
      assetType: activeAsset,
    }
    addTrade(trade)

    // If it's a market order, also create/update position
    if (orderType === 'market') {
      const positionSide = side === 'buy' ? 'long' : 'short'
      const existing = positions.find(p => p.symbol === symbol && p.side === positionSide)
      if (existing) {
        // Average into existing position
        const newQty = existing.qty + parseFloat(qty)
        const avgEntry = (existing.entryPrice * existing.qty + fillPrice * parseFloat(qty)) / newQty
        setPositions(positions.map(p =>
          p.id === existing.id
            ? { ...p, qty: newQty, entryPrice: avgEntry, marginUsed: newQty * avgEntry * 0.1 }
            : p
        ))
      } else {
        // New position
        setPositions([...positions, {
          id: `pos-${Date.now()}`,
          symbol,
          side: positionSide,
          qty: parseFloat(qty),
          entryPrice: fillPrice,
          currentPrice: fillPrice,
          unrealizedPnL: 0,
          realizedPnL: 0,
          marginUsed: parseFloat(qty) * fillPrice * 0.1,
          timestamp: Date.now(),
        }])
      }
    }

    // Show toast notification
    const title = `${side.toUpperCase()} ${orderType.toUpperCase()} Order`
    const msg = `${qty} ${symbol} @ ${formatPrice(fillPrice)}`
    if (side === 'buy') toast.buy(title, msg)
    else toast.sell(title, msg)

    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  const iStyle: React.CSSProperties = {
    width: '100%', background: THEME.bgSurface,
    border: `1px solid ${THEME.borderLight}`, borderRadius: '5px',
    padding: '8px 10px', fontFamily: THEME.fontMono, fontSize: '12px',
    color: THEME.text, outline: 'none',
  }

  return (
    <div style={{ background: THEME.bgPanel, border: `1px solid ${THEME.border}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${THEME.border}` }}>
        {(['buy','sell'] as Side[]).map(s => (
          <button key={s} onClick={() => setSide(s)} style={{
            flex:1, padding:'10px', textAlign:'center', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'none',
            background: side===s ? (s==='buy' ? THEME.bullDim : THEME.bearDim) : 'transparent',
            fontFamily: THEME.fontSans, letterSpacing:'0.5px', textTransform:'uppercase',
            color: side===s ? (s==='buy' ? THEME.bull : THEME.bear) : THEME.textMuted,
            borderBottom: side===s ? `2px solid ${s==='buy' ? THEME.bull : THEME.bear}` : '2px solid transparent',
            transition:'all 0.15s',
          }}>{s}</button>
        ))}
      </div>
      <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>
        <div>
          <div style={{ fontSize:'10px', color:THEME.textMuted, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'5px' }}>Order Type</div>
          <div style={{ display:'flex', gap:'3px' }}>
            {(['limit','market','stop','oco'] as OrderType[]).map(t => (
              <button key={t} onClick={() => setOrderType(t)} style={{
                flex:1, padding:'5px', borderRadius:'4px', fontSize:'11px', cursor:'pointer',
                border: orderType===t ? `1px solid ${THEME.borderLight}` : `1px solid ${THEME.border}`,
                background: orderType===t ? THEME.bgHover : 'transparent',
                color: orderType===t ? THEME.text : THEME.textMuted,
                fontFamily:THEME.fontSans, transition:'all 0.12s', textTransform:'capitalize',
              }}>{t}</button>
            ))}
          </div>
        </div>
        {orderType !== 'market' && (
          <div>
            <div style={{ fontSize:'10px', color:THEME.textMuted, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'5px' }}>
              {orderType === 'stop' ? 'Stop Price' : orderType === 'oco' ? 'Take Profit' : 'Price (USDT)'}
            </div>
            <input type="number" value={orderType === 'stop' ? stopPrice : limitPrice}
              onChange={e => orderType === 'stop' ? setStopPrice(e.target.value) : setLimitPrice(e.target.value)}
              style={iStyle} />
          </div>
        )}
        <div>
          <div style={{ fontSize:'10px', color:THEME.textMuted, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'5px' }}>Quantity</div>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={iStyle} />
          <div style={{ display:'flex', gap:'4px', marginTop:'5px' }}>
            {[25,50,75,100].map(p => (
              <button key={p} onClick={() => { setSliderPct(p); setQty((p/100*0.1).toFixed(4)) }} style={{
                flex:1, padding:'3px', borderRadius:'3px', fontSize:'10px', cursor:'pointer',
                border:`1px solid ${THEME.border}`, background: sliderPct===p ? THEME.bgHover : 'transparent',
                color: sliderPct===p ? THEME.text : THEME.textMuted, fontFamily:THEME.fontMono, transition:'all 0.12s',
              }}>{p}%</button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background:THEME.bgSurface, borderRadius:'5px', padding:'8px 10px', display:'flex', flexDirection:'column', gap:'4px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'11px', color:THEME.textMuted }}>Total</span>
            <span style={{ fontFamily:THEME.fontMono, fontSize:'13px', fontWeight:600, color:THEME.text }}>
              $<AnimatedNumber value={isNaN(total) ? 0 : total} format={(v) => v.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })} />
            </span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'10px', color:THEME.textMuted }}>Est. Fee (0.1%)</span>
            <span style={{ fontFamily:THEME.fontMono, fontSize:'10px', color:THEME.textMuted }}>
              $<AnimatedNumber value={isNaN(fee) ? 0 : fee} format={(v) => v.toFixed(2)} />
            </span>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!isValid} style={{
          width:'100%', padding:'11px', borderRadius:'6px', fontSize:'12px', fontWeight:600,
          cursor: isValid ? 'pointer' : 'not-allowed', border:'none', fontFamily:THEME.fontSans,
          letterSpacing:'0.5px', textTransform:'uppercase',
          background: submitted ? THEME.bgHover : side==='buy' ? THEME.bull : THEME.bear,
          color: submitted ? THEME.bull : '#fff', opacity: isValid ? 1 : 0.5, transition:'all 0.2s',
          boxShadow: !submitted ? `0 2px 12px ${side==='buy' ? 'rgba(14,203,129,0.3)' : 'rgba(246,70,93,0.3)'}` : 'none',
        }}>
          {submitted ? '✓ Order Placed' : `${side==='buy' ? 'Buy' : 'Sell'} ${orderType.toUpperCase()}`}
        </button>
      </div>
    </div>
  )
}