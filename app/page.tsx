import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import HomeClient from '@/components/HomeClient'

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#08090d' }}>
      <Navbar />
      <Suspense fallback={
        <div style={{
          padding: '40px 20px',
          color: '#4a5470',
          fontFamily: 'DM Mono,monospace',
          fontSize: '12px',
          letterSpacing: '2px',
        }}>
          LOADING...
        </div>
      }>
        <HomeClient />
      </Suspense>
    </main>
  )
}