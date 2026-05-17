'use client'

import { useState, useEffect } from 'react'
import { useTradingStore } from '@/lib/store/useTradingStore'
import { THEME } from '@/lib/engine/theme'
import { formatPrice } from '@/lib/engine/precision'
import type { Position, TradeRecord } from '@/lib/engine/types'
import { toast } from '@/components/ui/ToastContainer'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

const MOCK_POSITIONS: Position[] = [
  { id:'1', symbol:'BTCUSDT', side:'long', qty:0.42, entryPrice:61200, currentPrice:67420, unrealizedPnL:2612.40, realizedPnL:1450, marginUsed:12852, timestamp:Date.now()-86400000 },
  { id:'2', symbol:'ETHUSDT', side:'long', qty:3.5, entryPrice:3200, currentPrice:3120, unrealizedPnL:-280, realizedPnL:840, marginUsed:5600, timestamp:Date.now()-172800000 },
  { id:'3', symbol:'SOLUSDT', side:'long', qty:12, entryPrice:148, currentPrice:164, unrealizedPnL:192, realizedPnL:0, marginUsed:888, timestamp:Date.now()-43200000 },
  { id:'4', symbol:'AAPL', side:'long', qty:10, entryPrice:182, currentPrice:189, unrealizedPnL:70, realizedPnL:220, marginUsed:910, timestamp:Date.now()-604800000 },
]

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day = d.getDate()
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return `${month} ${day}, ${time}`
}

export default function PositionsTracker() {
  const { positions, setPositions, closePosition, tradeHistory, clearTradeHistory } = useTradingStore()
  const [tab, setTab] = useState<'positions' | 'history'>('positions')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [closingId, setClosingId] = useState<string | null>(null)

  // Initialize with mock positions if empty
  useEffect(() => {
    if (positions.length === 0) setPositions(MOCK_POSITIONS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalUnrealized = positions.reduce((s,p) => s + p.unrealizedPnL, 0)
  const totalMargin = positions.reduce((s,p) => s + p.marginUsed, 0)

  const filteredHistory = tradeHistory.filter(t =>
    historyFilter === 'all' || t.side === historyFilter
  )

  const totalPnL = tradeHistory.reduce((s, t) => s + t.pnl, 0)
  const totalFees = tradeHistory.reduce((s, t) => s + t.fee, 0)

  const handleClose = (id: string) => {
    const pos = positions.find(p => p.id === id)
    setClosingId(id)
    // Animate then close
    setTimeout(() => {
      closePosition(id)
      setClosingId(null)
      if (pos) {
        const title = `Position Closed`
        const msg = `${pos.qty} ${pos.symbol} • PnL: ${pos.unrealizedPnL >= 0 ? '+' : ''}$${pos.unrealizedPnL.toFixed(2)}`
        toast.info(title, msg)
      }
    }, 300)
  }

  return (
    <div style={{ background:THEME.bgPanel, border:`1px solid ${THEME.border}`, borderRadius:'8px', display:'flex', flexDirection:'column', overflow:'hidden', height:'100%' }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${THEME.border}`, flexShrink: 0 }}>
        {(['positions','history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'9px 18px', fontSize:'11px', fontWeight:500, cursor:'pointer', border:'none',
            background:'transparent', fontFamily:THEME.fontSans, textTransform:'capitalize',
            color: tab===t ? THEME.text : THEME.textMuted,
            borderBottom: tab===t ? `2px solid ${THEME.blue}` : '2px solid transparent',
            transition:'all 0.15s', position:'relative',
          }}>
            {t}
            {/* Badge for history count */}
            {t === 'history' && tradeHistory.length > 0 && (
              <span style={{
                marginLeft:'6px', fontSize:'9px', fontWeight:600,
                background: THEME.accentDim, color: THEME.accent,
                padding:'1px 5px', borderRadius:'8px', fontFamily: THEME.fontMono,
              }}>
                {tradeHistory.length}
              </span>
            )}
          </button>
        ))}

        {/* Summary stats */}
        <div style={{ marginLeft:'auto', padding:'8px 14px', display:'flex', gap:'16px' }}>
          {tab === 'positions' ? (
            <>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px' }}>UNREALIZED P&L</div>
                <div style={{ fontFamily:THEME.fontMono, fontSize:'12px', fontWeight:600, color: totalUnrealized>=0 ? THEME.bull : THEME.bear }}>
                  {totalUnrealized>=0 ? '+' : ''}$<AnimatedNumber value={Math.abs(totalUnrealized)} format={(v) => v.toFixed(2)} />
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px' }}>MARGIN</div>
                <div style={{ fontFamily:THEME.fontMono, fontSize:'12px', fontWeight:500, color:THEME.text }}>
                  $<AnimatedNumber value={totalMargin} format={(v) => v.toLocaleString()} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px' }}>REALIZED P&L</div>
                <div style={{ fontFamily:THEME.fontMono, fontSize:'12px', fontWeight:600, color: totalPnL>=0 ? THEME.bull : THEME.bear }}>
                  {totalPnL>=0 ? '+' : ''}$<AnimatedNumber value={Math.abs(totalPnL)} format={(v) => v.toFixed(2)} />
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px' }}>FEES</div>
                <div style={{ fontFamily:THEME.fontMono, fontSize:'12px', fontWeight:500, color:THEME.textSecondary }}>
                  -$<AnimatedNumber value={totalFees} format={(v) => v.toFixed(2)} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Positions Tab ── */}
      {tab === 'positions' && (
        <div style={{ flex:1, overflow:'auto' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 80px', padding:'6px 14px', fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px', textTransform:'uppercase', borderBottom:`1px solid ${THEME.border}`, position:'sticky', top:0, background:THEME.bgPanel, zIndex:1 }}>
            <span>Symbol</span>
            <span style={{ textAlign:'right' }}>Size</span>
            <span style={{ textAlign:'right' }}>Entry</span>
            <span style={{ textAlign:'right' }}>Mark</span>
            <span style={{ textAlign:'right' }}>PnL</span>
            <span style={{ textAlign:'center' }}>Action</span>
          </div>

          {positions.length === 0 ? (
            <div style={{ padding:'30px', textAlign:'center', color:THEME.textMuted, fontSize:'12px', fontFamily:THEME.fontMono }}>
              <div style={{ marginBottom:'6px', fontSize:'16px', opacity:0.4 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline-block' }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" /><line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              No open positions
            </div>
          ) : (
            positions.map(p => {
              const pnlPct = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100
              const isClosing = closingId === p.id
              return (
                <div key={p.id} style={{
                  display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 80px', padding:'8px 14px', alignItems:'center',
                  borderBottom:`1px solid ${THEME.border}`, cursor:'pointer', transition:'all 0.3s ease',
                  opacity: isClosing ? 0 : 1,
                  transform: isClosing ? 'translateX(-20px)' : 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = THEME.bgSurface)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{
                      fontSize:'9px', fontWeight:600, padding:'2px 5px', borderRadius:'3px',
                      background: p.side==='long' ? THEME.bullMuted : THEME.bearMuted,
                      color: p.side==='long' ? THEME.bull : THEME.bear,
                      textTransform:'uppercase',
                    }}>{p.side}</span>
                    <span style={{ fontSize:'12px', fontWeight:500, fontFamily:THEME.fontMono }}>{p.symbol}</span>
                  </div>
                  <div style={{ textAlign:'right', fontFamily:THEME.fontMono, fontSize:'11px', color:THEME.text }}>{p.qty}</div>
                  <div style={{ textAlign:'right', fontFamily:THEME.fontMono, fontSize:'11px', color:THEME.textSecondary }}>{formatPrice(p.entryPrice)}</div>
                  <div style={{ textAlign:'right', fontFamily:THEME.fontMono, fontSize:'11px', color:THEME.text }}>{formatPrice(p.currentPrice)}</div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:THEME.fontMono, fontSize:'11px', fontWeight:500, color: p.unrealizedPnL>=0 ? THEME.bull : THEME.bear }}>
                      {p.unrealizedPnL>=0 ? '+' : ''}${p.unrealizedPnL.toFixed(2)}
                    </div>
                    <div style={{ fontFamily:THEME.fontMono, fontSize:'9px', color: pnlPct>=0 ? THEME.bull : THEME.bear }}>
                      {pnlPct>=0 ? '+' : ''}{pnlPct.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <button
                      onClick={() => handleClose(p.id)}
                      style={{
                        padding:'3px 10px', borderRadius:'3px', fontSize:'10px', cursor:'pointer',
                        border:`1px solid ${THEME.bear}`, background:'transparent', color:THEME.bear,
                        fontFamily:THEME.fontSans, transition:'all 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = THEME.bearDim }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >Close</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Trade History Tab ── */}
      {tab === 'history' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Filter bar */}
          <div style={{
            display:'flex', alignItems:'center', padding:'6px 14px', gap:'6px',
            borderBottom:`1px solid ${THEME.border}`, flexShrink:0,
          }}>
            {(['all','buy','sell'] as const).map(f => (
              <button key={f} onClick={() => setHistoryFilter(f)} style={{
                padding:'3px 10px', borderRadius:'12px', fontSize:'10px', fontWeight:500,
                cursor:'pointer', border:'none', fontFamily:THEME.fontSans,
                background: historyFilter===f
                  ? (f==='buy' ? THEME.bullDim : f==='sell' ? THEME.bearDim : THEME.accentDim)
                  : 'transparent',
                color: historyFilter===f
                  ? (f==='buy' ? THEME.bull : f==='sell' ? THEME.bear : THEME.accent)
                  : THEME.textMuted,
                transition:'all 0.12s', textTransform:'capitalize',
              }}>
                {f === 'all' ? 'All Orders' : f}
              </button>
            ))}

            {tradeHistory.length > 0 && (
              <button
                onClick={clearTradeHistory}
                style={{
                  marginLeft:'auto', padding:'3px 8px', borderRadius:'3px', fontSize:'9px',
                  cursor:'pointer', border:`1px solid ${THEME.border}`, background:'transparent',
                  color:THEME.textMuted, fontFamily:THEME.fontMono, transition:'all 0.12s',
                  letterSpacing:'0.3px',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = THEME.bear; e.currentTarget.style.borderColor = THEME.bear }}
                onMouseLeave={e => { e.currentTarget.style.color = THEME.textMuted; e.currentTarget.style.borderColor = THEME.border }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Column headers */}
          <div style={{
            display:'grid', gridTemplateColumns:'60px 1.4fr 1fr 1fr 1fr 1fr',
            padding:'5px 14px', fontSize:'9px', color:THEME.textMuted,
            letterSpacing:'0.5px', textTransform:'uppercase',
            borderBottom:`1px solid ${THEME.border}`, flexShrink:0,
          }}>
            <span>Side</span>
            <span>Symbol</span>
            <span style={{ textAlign:'right' }}>Qty</span>
            <span style={{ textAlign:'right' }}>Price</span>
            <span style={{ textAlign:'right' }}>PnL</span>
            <span style={{ textAlign:'right' }}>Time</span>
          </div>

          {/* Trade rows */}
          <div style={{ flex:1, overflow:'auto' }}>
            {filteredHistory.length === 0 ? (
              <div style={{ padding:'30px', textAlign:'center', color:THEME.textMuted, fontSize:'12px', fontFamily:THEME.fontMono }}>
                <div style={{ marginBottom:'8px', opacity:0.4 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline-block' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div style={{ marginBottom:'4px' }}>No trade history yet</div>
                <div style={{ fontSize:'10px', color:THEME.textDim }}>
                  Place an order from the Trade Panel to get started
                </div>
              </div>
            ) : (
              filteredHistory.map((trade, i) => (
                <TradeRow key={trade.id} trade={trade} index={i} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Individual Trade Row ── */
function TradeRow({ trade, index }: { trade: TradeRecord; index: number }) {
  const isBuy = trade.side === 'buy'
  const hasPnl = trade.pnl !== 0

  return (
    <div
      style={{
        display:'grid', gridTemplateColumns:'60px 1.4fr 1fr 1fr 1fr 1fr',
        padding:'7px 14px', alignItems:'center',
        borderBottom:`1px solid ${THEME.border}`,
        cursor:'default', transition:'background 0.08s',
        animation: index < 3 ? `fadeSlideIn 0.3s ease ${index * 0.05}s both` : 'none',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = THEME.bgSurface)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Side badge */}
      <div>
        <span style={{
          fontSize:'9px', fontWeight:600, padding:'2px 6px', borderRadius:'3px',
          background: isBuy ? THEME.bullMuted : THEME.bearMuted,
          color: isBuy ? THEME.bull : THEME.bear,
          textTransform:'uppercase', letterSpacing:'0.3px',
        }}>
          {trade.side}
        </span>
      </div>

      {/* Symbol + type */}
      <div>
        <div style={{ fontSize:'11px', fontWeight:500, fontFamily:THEME.fontMono, color:THEME.text }}>
          {trade.symbol}
        </div>
        <div style={{ fontSize:'9px', color:THEME.textMuted, textTransform:'uppercase', letterSpacing:'0.3px' }}>
          {trade.type}
          <span style={{
            marginLeft:'4px', fontSize:'8px', padding:'0px 4px', borderRadius:'2px',
            background: trade.status === 'filled' ? 'rgba(0,230,118,0.08)' : 'rgba(240,185,11,0.08)',
            color: trade.status === 'filled' ? THEME.bull : THEME.amber,
          }}>
            {trade.status}
          </span>
        </div>
      </div>

      {/* Qty */}
      <div style={{ textAlign:'right', fontFamily:THEME.fontMono, fontSize:'11px', color:THEME.text }}>
        {trade.qty}
      </div>

      {/* Fill price */}
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:THEME.fontMono, fontSize:'11px', color:THEME.text }}>
          {formatPrice(trade.fillPrice)}
        </div>
        <div style={{ fontFamily:THEME.fontMono, fontSize:'9px', color:THEME.textMuted }}>
          ${trade.total.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
        </div>
      </div>

      {/* PnL */}
      <div style={{ textAlign:'right' }}>
        {hasPnl ? (
          <div style={{
            fontFamily:THEME.fontMono, fontSize:'11px', fontWeight:500,
            color: trade.pnl >= 0 ? THEME.bull : THEME.bear,
          }}>
            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </div>
        ) : (
          <div style={{ fontFamily:THEME.fontMono, fontSize:'11px', color:THEME.textMuted }}>—</div>
        )}
        <div style={{ fontFamily:THEME.fontMono, fontSize:'9px', color:THEME.textMuted }}>
          -${trade.fee.toFixed(2)}
        </div>
      </div>

      {/* Time */}
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:THEME.fontMono, fontSize:'10px', color:THEME.textSecondary }}>
          {relativeTime(trade.timestamp)}
        </div>
      </div>
    </div>
  )
}
