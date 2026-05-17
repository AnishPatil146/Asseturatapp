'use client'

// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Institutional Trading Dashboard (Phase 5 + 6)
// Grid workspace · Binance-gold accents · Synchronized panels
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTradingStore, type AssetType } from '@/lib/store/useTradingStore'
import { THEME } from '@/lib/engine/theme'
import AsseturaChart from '@/components/AsseturaChart'
import OrderBookPro from '@/components/OrderBook'
import TradePanel from '@/components/TradePanel'
import Watchlist from '@/components/Watchlist'
import PositionsTracker from '@/components/PositionsTracker'
import MarketSummary from '@/components/MarketSummary'

const TABS: AssetType[] = ['CRYPTO', 'STOCKS', 'FOREX', 'OPTIONS']
const ASSET_INFO: Record<AssetType, { label: string; symbol: string; color: string }> = {
  CRYPTO:  { label: 'Crypto',  symbol: 'BTC/USDT', color: '#00E676' },
  STOCKS:  { label: 'Stocks',  symbol: 'AAPL',     color: '#4F8EF7' },
  FOREX:   { label: 'Forex',   symbol: 'EUR/USD',  color: '#A78BFA' },
  OPTIONS: { label: 'Options', symbol: 'SPX',      color: '#FFB020' },
}

type DashboardLayout = 'trading' | 'analysis' | 'overview'
function getAsset(p: string | null): AssetType {
  return p && TABS.includes(p as AssetType) ? (p as AssetType) : 'CRYPTO'
}

export default function HomeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const assetParam = searchParams.get('asset')
  const { activeAsset, setActiveAsset } = useTradingStore()
  const [layout, setLayout] = useState<DashboardLayout>('trading')

  useEffect(() => {
    const next = getAsset(assetParam)
    if (next !== activeAsset) setActiveAsset(next)
  }, [assetParam, activeAsset, setActiveAsset])

  const handleTab = (tab: AssetType) => {
    setActiveAsset(tab)
    startTransition(() => router.push(`/?asset=${tab}`, { scroll: false }))
  }

  const activeColor = ASSET_INFO[activeAsset].color

  return (
    <div style={{
      padding: '6px 10px 0',
      height: 'calc(100vh - 46px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Control Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
        flexShrink: 0,
      }}>
        {/* Asset Tabs */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {TABS.map(tab => {
            const isActive = activeAsset === tab
            return (
              <button
                key={tab}
                onClick={() => handleTab(tab)}
                style={{
                  padding: '5px 16px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: isActive ? `1px solid ${THEME.borderFocus}` : '1px solid transparent',
                  background: isActive ? THEME.bgHover : 'transparent',
                  color: isActive ? THEME.accent : THEME.textSecondary,
                  fontFamily: THEME.fontSans,
                  transition: 'all 0.15s ease',
                  textShadow: isActive ? `0 0 8px ${THEME.accentGlow}` : 'none',
                }}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>

        {/* Layout Switcher + Active Symbol */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            gap: '1px',
            background: THEME.border,
            borderRadius: '4px',
            padding: '1px',
          }}>
            {([
              { key: 'trading' as DashboardLayout, label: 'Trading' },
              { key: 'analysis' as DashboardLayout, label: 'Analysis' },
              { key: 'overview' as DashboardLayout, label: 'Overview' },
            ]).map(l => (
              <button
                key={l.key}
                onClick={() => setLayout(l.key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: layout === l.key ? THEME.bgSurface : 'transparent',
                  color: layout === l.key ? THEME.accent : THEME.textMuted,
                  fontFamily: THEME.fontMono,
                  transition: 'all 0.12s',
                  letterSpacing: '0.3px',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Active symbol indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: activeColor,
              boxShadow: `0 0 6px ${activeColor}, 0 0 12px ${activeColor}40`,
              animation: 'accentPulse 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: THEME.fontMono,
              fontSize: '11px',
              color: THEME.textSecondary,
              letterSpacing: '0.5px',
            }}>
              {ASSET_INFO[activeAsset].symbol}
            </span>
          </div>
        </div>
      </div>

      {/* ── Trading Layout (Primary) ── */}
      {layout === 'trading' && (
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 248px',
          gap: '6px',
          minHeight: 0,
        }}>
          {/* LEFT: Chart + Bottom Panels */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minHeight: 0,
          }}>
            {/* Chart */}
            <div style={{ flex: 1, minHeight: '340px' }}>
              <AsseturaChart
                key={activeAsset}
                assetType={activeAsset}
                height={typeof window !== 'undefined' ? Math.max(340, window.innerHeight - 330) : 450}
              />
            </div>
            {/* Bottom panels */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              height: '200px',
              flexShrink: 0,
            }}>
              <Watchlist />
              <PositionsTracker />
            </div>
          </div>

          {/* RIGHT: Execution Zone */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minHeight: 0,
          }}>
            <TradePanel />
            <div style={{ flex: 1, minHeight: '220px' }}>
              <OrderBookPro />
            </div>
          </div>
        </div>
      )}

      {/* ── Analysis Layout ── */}
      {layout === 'analysis' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: '400px' }}>
            <AsseturaChart
              key={`analysis-${activeAsset}`}
              assetType={activeAsset}
              height={typeof window !== 'undefined' ? window.innerHeight - 200 : 600}
            />
          </div>
          <div style={{ height: '150px', flexShrink: 0 }}>
            <Watchlist />
          </div>
        </div>
      )}

      {/* ── Overview Layout ── */}
      {layout === 'overview' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <AsseturaChart key={activeAsset} assetType={activeAsset} height={480} />
          <MarketSummary />
        </div>
      )}
    </div>
  )
}