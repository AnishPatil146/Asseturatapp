import Navbar from '@/components/Navbar'
import Portfolio from '@/components/Portfolio'

export default function PortfolioPage() {
    return (
        <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <Portfolio />
        </main>
    )
}