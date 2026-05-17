'use client'

import { useState } from 'react'
import { THEME } from '@/lib/engine/theme'
import { formatPrice } from '@/lib/engine/precision'
import type { Position } from '@/lib/engine/types'

const MOCK_POSITIONS: Position[] = [
  { id:'1', symbol:'BTCUSDT', side:'long', qty:0.42, entryPrice:61200, currentPrice:67420, unrealizedPnL:2612.40, realizedPnL:1450, marginUsed:12852, timestamp:Date.now()-86400000 },
  { id:'2', symbol:'ETHUSDT', side:'long', qty:3.5, entryPrice:3200, currentPrice:3120, unrealizedPnL:-280, realizedPnL:840, marginUsed:5600, timestamp:Date.now()-172800000 },
  { id:'3', symbol:'SOLUSDT', side:'long', qty:12, entryPrice:148, currentPrice:164, unrealizedPnL:192, realizedPnL:0, marginUsed:888, timestamp:Date.now()-43200000 },
  { id:'4', symbol:'AAPL', side:'long', qty:10, entryPrice:182, currentPrice:189, unrealizedPnL:70, realizedPnL:220, marginUsed:910, timestamp:Date.now()-604800000 },
]

export default function PositionsTracker() {
  const [tab, setTab] = useState<'positions'|'history'>('positions')
  const [positions] = useState(MOCK_POSITIONS)

  const totalUnrealized = positions.reduce((s,p) => s + p.unrealizedPnL, 0)
  const totalRealized = positions.reduce((s,p) => s + p.realizedPnL, 0)
  const totalMargin = positions.reduce((s,p) => s + p.marginUsed, 0)

  return (
    <div style={{ background:THEME.bgPanel, border:`1px solid ${THEME.border}`, borderRadius:'8px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${THEME.border}` }}>
        {(['positions','history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'9px 18px', fontSize:'11px', fontWeight:500, cursor:'pointer', border:'none',
            background:'transparent', fontFamily:THEME.fontSans, textTransform:'capitalize',
            color: tab===t ? THEME.text : THEME.textMuted,
            borderBottom: tab===t ? `2px solid ${THEME.blue}` : '2px solid transparent',
            transition:'all 0.15s',
          }}>{t}</button>
        ))}
        <div style={{ marginLeft:'auto', padding:'8px 14px', display:'flex', gap:'16px' }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px' }}>UNREALIZED P&L</div>
            <div style={{ fontFamily:THEME.fontMono, fontSize:'12px', fontWeight:600, color: totalUnrealized>=0 ? THEME.bull : THEME.bear }}>
              {totalUnrealized>=0 ? '+' : ''}${totalUnrealized.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px' }}>MARGIN</div>
            <div style={{ fontFamily:THEME.fontMono, fontSize:'12px', fontWeight:500, color:THEME.text }}>
              ${totalMargin.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {tab === 'positions' && (
        <>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 80px', padding:'6px 14px', fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px', textTransform:'uppercase', borderBottom:`1px solid ${THEME.border}` }}>
            <span>Symbol</span>
            <span style={{ textAlign:'right' }}>Size</span>
            <span style={{ textAlign:'right' }}>Entry</span>
            <span style={{ textAlign:'right' }}>Mark</span>
            <span style={{ textAlign:'right' }}>PnL</span>
            <span style={{ textAlign:'center' }}>Action</span>
          </div>
          {/* Rows */}
          {positions.map(p => {
            const pnlPct = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100
            return (
              <div key={p.id} style={{
                display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 80px', padding:'8px 14px', alignItems:'center',
                borderBottom:`1px solid ${THEME.border}`, cursor:'pointer', transition:'background 0.1s',
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
                  <button style={{
                    padding:'3px 10px', borderRadius:'3px', fontSize:'10px', cursor:'pointer',
                    border:`1px solid ${THEME.bear}`, background:'transparent', color:THEME.bear,
                    fontFamily:THEME.fontSans, transition:'all 0.12s',
                  }}>Close</button>
                </div>
              </div>
            )
          })}
        </>
      )}

      {tab === 'history' && (
        <div style={{ padding:'40px', textAlign:'center', color:THEME.textMuted, fontSize:'12px', fontFamily:THEME.fontMono }}>
          Trade history will appear here
        </div>
      )}
    </div>
  )
}
