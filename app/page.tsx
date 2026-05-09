'use client'

import Navbar from '@/components/Navbar'
import LiveTicker from '@/components/LiveTicker'
import MarketSummary from '@/components/MarketSummary'
import AuthGuard from '@/components/AuthGuard'

export default function HomePage() {
  return (
    <AuthGuard>
      <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <LiveTicker />
        <MarketSummary />
      </main>
    </AuthGuard>
  )
}