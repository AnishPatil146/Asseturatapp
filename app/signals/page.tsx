import Navbar from '@/components/Navbar'
import Signals from '@/components/Signals'

export default function SignalsPage() {
    return (
        <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <Signals />
        </main>
    )
}