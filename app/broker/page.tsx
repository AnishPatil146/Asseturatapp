import Navbar from '@/components/Navbar'
import BrokerConnect from '@/components/BrokerConnect'

export default function BrokerPage() {
    return (
        <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <BrokerConnect />
        </main>
    )
}