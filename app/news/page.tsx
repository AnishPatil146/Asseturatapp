import Navbar from '@/components/Navbar'
import News from '@/components/News'

export default function NewsPage() {
    return (
        <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <News />
        </main>
    )
}