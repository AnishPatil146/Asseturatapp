'use client'

import { useState, useEffect, useRef } from 'react'
import { useTradingStore } from '@/lib/store/useTradingStore'
import { THEME } from '@/lib/engine/theme'
import { formatPrice } from '@/lib/engine/precision'

const WATCHLIST_DATA = [
  { symbol:'BTCUSDT', name:'Bitcoin', price:78429, change24h:1247, changePct:1.62, volume:'2.41B', assetType:'crypto' as const, color:'#f7931a' },
  { symbol:'ETHUSDT', name:'Ethereum', price:2312, change24h:-18, changePct:-0.77, volume:'890M', assetType:'crypto' as const, color:'#627eea' },
  { symbol:'SOLUSDT', name:'Solana', price:164, change24h:3.2, changePct:1.99, volume:'432M', assetType:'crypto' as const, color:'#9945ff' },
  { symbol:'AAPL', name:'Apple Inc.', price:189.45, change24h:-1.67, changePct:-0.87, volume:'48.2M', assetType:'stock' as const, color:'#4f8ef7' },
  { symbol:'NVDA', name:'Nvidia', price:875, change24h:12.4, changePct:1.44, volume:'55M', assetType:'stock' as const, color:'#76b900' },
  { symbol:'EURUSD', name:'EUR/USD', price:1.0842, change24h:0.0013, changePct:0.12, volume:'3.2T', assetType:'forex' as const, color:'#00d4a0' },
  { symbol:'GBPUSD', name:'GBP/USD', price:1.2534, change24h:-0.002, changePct:-0.16, volume:'2.1T', assetType:'forex' as const, color:'#2980b9' },
  { symbol:'TSLA', name:'Tesla', price:242.8, change24h:5.6, changePct:2.36, volume:'78M', assetType:'stock' as const, color:'#e74c3c' },
]

type SortKey = 'symbol' | 'price' | 'changePct' | 'volume'

function MiniSparkline({ data, color, w=60, h=20 }: { data:number[]; color:string; w?:number; h?:number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return
    // 4K HiDPI: use actual devicePixelRatio for razor-sharp sparklines
    const dpr = Math.min(window.devicePixelRatio || 1, 4)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const mn = Math.min(...data)
    const mx = Math.max(...data)
    const rng = mx - mn || 1
    ctx.strokeStyle = color
    ctx.lineWidth = 1.2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    data.forEach((v,i) => {
      const x = (i/(data.length-1))*w
      const y = h - ((v-mn)/rng)*h*0.85 - h*0.05
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
    })
    ctx.stroke()
  }, [data, color, w, h])

  return <canvas ref={ref} style={{ width:w, height:h }} />
}

export default function Watchlist() {
  const [sortKey, setSortKey] = useState<SortKey>('changePct')
  const [sortAsc, setSortAsc] = useState(false)
  const [filter, setFilter] = useState('')
  const [items, setItems] = useState(WATCHLIST_DATA)

  // Simulate live updates
  useEffect(() => {
    const id = setInterval(() => {
      setItems(prev => prev.map(item => {
        const delta = item.price * (Math.random()-0.499) * 0.0004
        const newPrice = item.price + delta
        return { ...item, price: newPrice, change24h: item.change24h + delta }
      }))
    }, 800)
    return () => clearInterval(id)
  }, [])

  // Generate sparkline data
  const [sparklines] = useState(() => {
    const map: Record<string,number[]> = {}
    items.forEach(item => {
      const pts: number[] = []
      let v = item.price
      for (let i=0;i<24;i++) { v += v*(Math.random()-0.48)*0.008; pts.push(v) }
      map[item.symbol] = pts
    })
    return map
  })

  const sorted = [...items]
    .filter(i => !filter || i.name.toLowerCase().includes(filter.toLowerCase()) || i.symbol.toLowerCase().includes(filter.toLowerCase()))
    .sort((a,b) => {
      const m = sortAsc ? 1 : -1
      if (sortKey==='symbol') return a.symbol.localeCompare(b.symbol) * m
      if (sortKey==='price') return (a.price-b.price)*m
      if (sortKey==='changePct') return (a.changePct-b.changePct)*m
      return 0
    })

  const handleSort = (key: SortKey) => {
    if (sortKey===key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const arrow = (key: SortKey) => sortKey===key ? (sortAsc ? ' ↑' : ' ↓') : ''

  return (
    <div style={{ background:THEME.bgPanel, border:`1px solid ${THEME.border}`, borderRadius:'8px', display:'flex', flexDirection:'column', overflow:'hidden', height:'100%' }}>
      <div style={{ padding:'10px 14px', borderBottom:`1px solid ${THEME.border}`, display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:'11px', fontWeight:600, color:THEME.textSecondary, letterSpacing:'0.5px', textTransform:'uppercase' }}>
          Watchlist
        </span>
        <input
          placeholder="Search..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            marginLeft:'auto', background:THEME.bgSurface, border:`1px solid ${THEME.border}`, borderRadius:'4px',
            padding:'3px 8px', fontSize:'10px', color:THEME.text, outline:'none', width:'100px',
            fontFamily:THEME.fontSans,
          }}
        />
      </div>

      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 60px 1fr', padding:'4px 14px', fontSize:'9px', color:THEME.textMuted, letterSpacing:'0.5px', textTransform:'uppercase', borderBottom:`1px solid ${THEME.border}` }}>
        <span onClick={() => handleSort('symbol')} style={{ cursor:'pointer' }}>Asset{arrow('symbol')}</span>
        <span onClick={() => handleSort('price')} style={{ cursor:'pointer', textAlign:'right' }}>Price{arrow('price')}</span>
        <span style={{ textAlign:'center' }}>Chart</span>
        <span onClick={() => handleSort('changePct')} style={{ cursor:'pointer', textAlign:'right' }}>24h{arrow('changePct')}</span>
      </div>

      {/* Rows */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {sorted.map(item => (
          <div key={item.symbol} style={{
            display:'grid', gridTemplateColumns:'2fr 1fr 60px 1fr', padding:'6px 14px', alignItems:'center',
            borderBottom:`1px solid ${THEME.border}`, cursor:'pointer', transition:'background 0.1s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = THEME.bgSurface)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:item.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'#fff', flexShrink:0 }}>
                {item.symbol[0]}
              </div>
              <div>
                <div style={{ fontSize:'12px', fontWeight:500, color:THEME.text }}>{item.name}</div>
                <div style={{ fontSize:'9px', color:THEME.textMuted }}>{item.symbol}</div>
              </div>
            </div>
            <div style={{ textAlign:'right', fontFamily:THEME.fontMono, fontSize:'11px', fontWeight:500, color:THEME.text }}>
              {formatPrice(item.price)}
            </div>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <MiniSparkline data={sparklines[item.symbol]||[]} color={item.changePct>=0 ? THEME.bull : THEME.bear} />
            </div>
            <div style={{ textAlign:'right' }}>
              <span style={{
                fontFamily:THEME.fontMono, fontSize:'11px', fontWeight:500,
                color: item.changePct>=0 ? THEME.bull : THEME.bear,
                padding:'1px 5px', borderRadius:'3px',
                background: item.changePct>=0 ? THEME.bullMuted : THEME.bearMuted,
              }}>
                {item.changePct>=0 ? '+' : ''}{item.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
