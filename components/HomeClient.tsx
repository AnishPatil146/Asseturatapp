'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AsseturaChart from '@/components/AsseturaChart'
import MarketSummary from '@/components/MarketSummary'

type AssetType = 'CRYPTO' | 'STOCKS' | 'FOREX' | 'OPTIONS'

const TABS: AssetType[] = ['CRYPTO', 'STOCKS', 'FOREX', 'OPTIONS']

const ASSET_INFO: Record<AssetType, { label: string; symbol: string; color: string }> = {
  CRYPTO: { label: 'Crypto', symbol: 'BTC/USDT', color: '#f7931a' },
  STOCKS: { label: 'Stocks', symbol: 'AAPL', color: '#4f8ef7' },
  FOREX: { label: 'Forex', symbol: 'EUR/USD', color: '#00d4a0' },
  OPTIONS: { label: 'Options', symbol: 'SPX', color: '#f5a623' },
}

function getAsset(param: string | null): AssetType {
  if (param && TABS.includes(param as AssetType)) return param as AssetType
  return 'CRYPTO'
}

export default function HomeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const assetParam = searchParams.get('asset')
  const [activeAsset, setActiveAsset] = useState<AssetType>(getAsset(assetParam))

  useEffect(() => {
    const next = getAsset(assetParam)
    if (next !== activeAsset) setActiveAsset(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetParam])

  const handleTab = (tab: AssetType) => {
    setActiveAsset(tab)
    startTransition(() => {
      router.push(`/?asset=${tab}`, { scroll: false })
    })
  }

  return (
    <div style={{ padding: '12px 20px 0' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTab(tab)}
              style={{
                padding: '4px 16px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                border: activeAsset === tab ? '1px solid #252b3d' : '1px solid transparent',
                background: activeAsset === tab ? '#1a1e2a' : 'transparent',
                color: activeAsset === tab ? '#e2e8f7' : '#7b88aa',
                fontFamily: 'DM Sans,sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: ASSET_INFO[activeAsset].color,
            boxShadow: `0 0 6px ${ASSET_INFO[activeAsset].color}`,
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: '#7b88aa' }}>
            {ASSET_INFO[activeAsset].symbol}
          </span>
        </div>
      </div>

      {/* Chart — key forces full remount on asset change */}
      <AsseturaChart
        key={activeAsset}
        assetType={activeAsset}
        height={480}
      />

      <MarketSummary />
    </div>
  )
}