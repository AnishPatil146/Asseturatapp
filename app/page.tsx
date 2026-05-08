import Navbar from '@/components/Navbar'
import MarketSummary from '@/components/MarketSummary'

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <MarketSummary />
    </main>
  )
}